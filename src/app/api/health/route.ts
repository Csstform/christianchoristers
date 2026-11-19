import { NextResponse } from "next/server";
import { sql } from "@/db";

export async function GET() {
  try {
    await sql`select 1`;
    return NextResponse.json({ ok: true, db: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        db: false,
        error: error instanceof Error ? error.message : "db error",
      },
      { status: 503 },
    );
  }
}
