import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await req.json();
  await db.update(leads).set({ status }).where(eq(leads.id, id));
  logger.commercial("Changement statut", `lead: ${id.slice(0, 8)} → ${status}`);
  return Response.json({ ok: true });
}
