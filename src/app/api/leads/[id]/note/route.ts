import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [lead] = await db
    .select({ note: leads.noteCommercial })
    .from(leads)
    .where(eq(leads.id, id));

  return NextResponse.json({ note: lead?.note ?? "" });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { note } = await request.json();

  await db
    .update(leads)
    .set({ noteCommercial: note ?? null })
    .where(eq(leads.id, id));

  return NextResponse.json({ success: true });
}
