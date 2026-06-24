import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ status: "ok" });
  } catch (error: unknown) {
    const cause =
      error instanceof Error && error.cause instanceof Error
        ? error.cause.message
        : undefined;
    const message =
      error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      { status: "error", message, cause },
      { status: 500 },
    );
  }
}
