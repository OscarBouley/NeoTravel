import { db } from "@/lib/db";
import { leads, prospects, devis, relances } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface RelanceAEnvoyer {
  devisId: string;
  leadId: string;
  prospectEmail: string;
  prospectPrenom: string;
  reference: string;
  prixTTC: string;
  departVille: string;
  arriveeVille: string;
  type: string;
  numero: number;
  urgent: boolean;
}

const DELAIS_NORMAL = [3, 7];
const DELAIS_URGENT = [1, 2, 4];

function joursDepuis(date: Date): number {
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(
    (todayMidnight.getTime() - dateMidnight.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function joursAvant(dateStr: string): number {
  const dep = new Date(dateStr);
  const now = new Date();
  return Math.ceil(
    (dep.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
}

export async function getRelancesAEnvoyer(): Promise<RelanceAEnvoyer[]> {
  const rows = await db
    .select({
      lead: leads,
      prospect: prospects,
      devis: devis,
    })
    .from(leads)
    .innerJoin(prospects, eq(leads.prospectId, prospects.id))
    .innerJoin(devis, eq(devis.leadId, leads.id));

  const allRelances = await db.select().from(relances);

  const relancesParDevis = new Map<string, string[]>();
  for (const r of allRelances) {
    const list = relancesParDevis.get(r.devisId) ?? [];
    list.push(r.type);
    relancesParDevis.set(r.devisId, list);
  }

  const latestDevisByLead = new Map<string, typeof rows[0]>();
  for (const row of rows) {
    if (!row.devis.envoyeLe) continue;
    const existing = latestDevisByLead.get(row.lead.id);
    if (!existing || row.devis.version > existing.devis.version) {
      latestDevisByLead.set(row.lead.id, row);
    }
  }

  const result: RelanceAEnvoyer[] = [];

  for (const row of latestDevisByLead.values()) {
    if (row.lead.status !== "Devis envoyé") continue;
    if (!row.lead.departDate) continue;
    if (!row.devis.envoyeLe) continue;

    const joursAvantDepart = joursAvant(row.lead.departDate);
    if (joursAvantDepart < 0) continue;

    const joursDepuisEnvoi = joursDepuis(row.devis.envoyeLe);
    const urgent = joursAvantDepart <= 7;
    const delais = urgent ? DELAIS_URGENT : DELAIS_NORMAL;
    const dejaSent = relancesParDevis.get(row.devis.id) ?? [];

    for (let i = 0; i < delais.length; i++) {
      const type = `relance_${i + 1}`;
      if (dejaSent.includes(type)) continue;

      if (joursDepuisEnvoi >= delais[i]) {
        result.push({
          devisId: row.devis.id,
          leadId: row.lead.id,
          prospectEmail: row.prospect.email,
          prospectPrenom: row.prospect.prenom ?? row.prospect.nom ?? "",
          reference: row.devis.reference,
          prixTTC: row.devis.prixTTC,
          departVille: row.lead.departVille ?? "",
          arriveeVille: row.lead.arriveeVille ?? "",
          type,
          numero: i + 1,
          urgent,
        });
        break;
      }
    }
  }

  return result;
}
