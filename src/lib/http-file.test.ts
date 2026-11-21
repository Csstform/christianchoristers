import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { describe, it, after } from "node:test";
import { streamLocalFile } from "./http-file";

describe("streamLocalFile", () => {
  let dir = "";
  let path = "";
  const body = Buffer.from("0123456789abcdefghijklmnopqrstuvwxyz");

  it("sets up fixture", async () => {
    dir = await mkdtemp(join(tmpdir(), "http-file-"));
    path = join(dir, "sample.bin");
    await writeFile(path, body);
  });

  it("returns 200 with Content-Length and Accept-Ranges", async () => {
    const res = await streamLocalFile({
      absolutePath: path,
      size: body.length,
      contentType: "application/octet-stream",
      contentDisposition: 'inline; filename="sample.bin"',
      cacheControl: "private, max-age=60",
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("Accept-Ranges"), "bytes");
    assert.equal(res.headers.get("Content-Length"), String(body.length));
    const buf = Buffer.from(await res.arrayBuffer());
    assert.deepEqual(buf, body);
  });

  it("returns 206 for a byte range", async () => {
    const res = await streamLocalFile({
      absolutePath: path,
      size: body.length,
      contentType: "application/octet-stream",
      contentDisposition: 'inline; filename="sample.bin"',
      cacheControl: "private, max-age=60",
      rangeHeader: "bytes=10-19",
    });
    assert.equal(res.status, 206);
    assert.equal(res.headers.get("Content-Length"), "10");
    assert.equal(
      res.headers.get("Content-Range"),
      `bytes 10-19/${body.length}`,
    );
    const buf = Buffer.from(await res.arrayBuffer());
    assert.deepEqual(buf, body.subarray(10, 20));
  });

  it("returns 416 for an unsatisfiable range", async () => {
    const res = await streamLocalFile({
      absolutePath: path,
      size: body.length,
      contentType: "application/octet-stream",
      contentDisposition: 'inline; filename="sample.bin"',
      cacheControl: "private, max-age=60",
      rangeHeader: `bytes=${body.length}-`,
    });
    assert.equal(res.status, 416);
    assert.equal(
      res.headers.get("Content-Range"),
      `bytes */${body.length}`,
    );
  });

  after(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });
});
