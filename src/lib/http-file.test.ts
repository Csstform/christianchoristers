import assert from "node:assert/strict";
import { Writable } from "stream";
import { mkdtemp, writeFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { describe, it, after } from "node:test";
import type { NextApiRequest, NextApiResponse } from "next";
import { parseByteRange, sendLocalFile } from "./http-file";

describe("parseByteRange", () => {
  it("parses closed ranges", () => {
    assert.deepEqual(parseByteRange("bytes=10-19", 100), {
      start: 10,
      end: 19,
    });
  });

  it("parses open-ended and suffix ranges", () => {
    assert.deepEqual(parseByteRange("bytes=90-", 100), {
      start: 90,
      end: 99,
    });
    assert.deepEqual(parseByteRange("bytes=-10", 100), {
      start: 90,
      end: 99,
    });
  });

  it("rejects unsatisfiable ranges", () => {
    assert.equal(parseByteRange("bytes=100-", 100), "invalid");
    assert.equal(parseByteRange("bytes=", 100), "invalid");
    assert.equal(parseByteRange(null, 100), null);
  });
});

describe("sendLocalFile", () => {
  let dir = "";
  let path = "";
  const body = Buffer.from("0123456789abcdefghijklmnopqrstuvwxyz");

  it("sets up fixture", async () => {
    dir = await mkdtemp(join(tmpdir(), "http-file-"));
    path = join(dir, "sample.bin");
    await writeFile(path, body);
  });

  function mockReq(range?: string): NextApiRequest {
    return {
      headers: range ? { range } : {},
    } as NextApiRequest;
  }

  function mockRes(): {
    res: NextApiResponse;
    statusCode: { value: number };
    headers: { value: Record<string, string | number> };
    body: Promise<Buffer>;
  } {
    const chunks: Buffer[] = [];
    const statusCode = { value: 0 };
    const headers = { value: {} as Record<string, string | number> };

    let resolveBody!: (buf: Buffer) => void;
    const bodyPromise = new Promise<Buffer>((resolve) => {
      resolveBody = resolve;
    });

    const writable = new Writable({
      write(chunk, _enc, cb) {
        chunks.push(Buffer.from(chunk));
        cb();
      },
      final(cb) {
        resolveBody(Buffer.concat(chunks));
        cb();
      },
    });

    Object.assign(writable, {
      writeHead(status: number, hdrs: Record<string, string | number>) {
        statusCode.value = status;
        headers.value = hdrs;
      },
    });

    return {
      res: writable as unknown as NextApiResponse,
      statusCode,
      headers,
      body: bodyPromise,
    };
  }

  it("returns 200 with Content-Length and Accept-Ranges", async () => {
    const { res, statusCode, headers, body: payload } = mockRes();
    sendLocalFile(mockReq(), res, {
      absolutePath: path,
      size: body.length,
      contentType: "application/octet-stream",
      contentDisposition: 'inline; filename="sample.bin"',
      cacheControl: "private, max-age=60",
    });
    const buf = await payload;
    assert.equal(statusCode.value, 200);
    assert.equal(headers.value["Accept-Ranges"], "bytes");
    assert.equal(headers.value["Content-Length"], body.length);
    assert.deepEqual(buf, body);
  });

  it("returns 206 for a byte range", async () => {
    const { res, statusCode, headers, body: payload } = mockRes();
    sendLocalFile(mockReq("bytes=10-19"), res, {
      absolutePath: path,
      size: body.length,
      contentType: "application/octet-stream",
      contentDisposition: 'inline; filename="sample.bin"',
      cacheControl: "private, max-age=60",
    });
    const buf = await payload;
    assert.equal(statusCode.value, 206);
    assert.equal(headers.value["Content-Length"], 10);
    assert.equal(
      headers.value["Content-Range"],
      `bytes 10-19/${body.length}`,
    );
    assert.deepEqual(buf, body.subarray(10, 20));
  });

  it("returns 416 for an unsatisfiable range", async () => {
    const { res, statusCode, headers, body: payload } = mockRes();
    sendLocalFile(mockReq(`bytes=${body.length}-`), res, {
      absolutePath: path,
      size: body.length,
      contentType: "application/octet-stream",
      contentDisposition: 'inline; filename="sample.bin"',
      cacheControl: "private, max-age=60",
    });
    // 416 ends immediately without piping; resolve empty body if needed
    await Promise.race([
      payload,
      new Promise<Buffer>((resolve) => setTimeout(() => resolve(Buffer.alloc(0)), 50)),
    ]);
    assert.equal(statusCode.value, 416);
    assert.equal(headers.value["Content-Range"], `bytes */${body.length}`);
  });

  after(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });
});
