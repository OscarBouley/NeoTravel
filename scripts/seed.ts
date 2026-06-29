import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../src/lib/db/schema";
import { calculerDevis } from "../src/lib/business/calculer-devis";

const url = new URL(process.env.DATABASE_URL!);
const client = postgres({
  host: url.hostname,
  port: Number(url.port),
  username: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  prepare: false,
  ssl: "prefer",
});
const db = drizzle(client, { schema });

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

function futureDate(fromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + fromNow);
  return d.toISOString().slice(0, 10);
}

function randomHeure(): string {
  const h = 6 + Math.floor(Math.random() * 14);
  return `${h.toString().padStart(2, "0")}:00`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const FIXTURES = [
  { nom: "Martin", prenom: "Sophie", email: "sophie.martin@groupeabc.fr", tel: "0612345678", societe: "Groupe ABC", depart: "Paris", arrivee: "Lyon", besoin: "aller_retour" as const, pax: 45, daysAgo: 0, departIn: 30, status: "Devis généré" },
  { nom: "Dupont", prenom: "Pierre", email: "p.dupont@techcorp.fr", tel: "0698765432", societe: "TechCorp", depart: "Marseille", arrivee: "Nice", besoin: "aller_simple" as const, pax: 30, daysAgo: 1, departIn: 5, status: "Devis généré" },
  { nom: "Bernard", prenom: "Marie", email: "m.bernard@educnat.fr", tel: "0654321098", societe: "Lycée Victor Hugo", depart: "Bordeaux", arrivee: "Toulouse", besoin: "aller_retour" as const, pax: 52, daysAgo: 2, departIn: 21, status: "Devis envoyé" },
  { nom: "Leroy", prenom: "Thomas", email: "thomas@sportclub.fr", tel: "0676543210", societe: "AS Rugby Club", depart: "Lille", arrivee: "Paris", besoin: "aller_retour" as const, pax: 35, daysAgo: 3, departIn: 14, status: "Devis accepté" },
  { nom: "Moreau", prenom: "Julie", email: "j.moreau@events.fr", tel: "0687654321", societe: "Events Plus", depart: "Nantes", arrivee: "Rennes", besoin: "aller_simple" as const, pax: 60, daysAgo: 4, departIn: 45, status: "Devis envoyé" },
  { nom: "Garcia", prenom: "Lucas", email: "lucas.g@transport-scolaire.fr", tel: "0643218765", societe: "Collège Pasteur", depart: "Lyon", arrivee: "Grenoble", besoin: "aller_retour" as const, pax: 48, daysAgo: 5, departIn: 60, status: "Devis généré" },
  { nom: "Petit", prenom: "Emma", email: "emma.petit@mariage.fr", tel: "0612348765", societe: "Mariage E&T", depart: "Strasbourg", arrivee: "Colmar", besoin: "circuit" as const, pax: 80, daysAgo: 7, departIn: 90, status: "Devis envoyé" },
  { nom: "Roux", prenom: "Alexandre", email: "a.roux@bigcorp.fr", tel: "0698761234", societe: "BigCorp Industries", depart: "Paris", arrivee: "Bruxelles", besoin: "aller_retour" as const, pax: 90, daysAgo: 8, departIn: 35, status: "Renvoyé au commercial" },
  { nom: "Fournier", prenom: "Camille", email: "camille@asso-jeunes.org", tel: "0665432198", societe: "Asso Jeunes", depart: "Montpellier", arrivee: "Perpignan", besoin: "aller_simple" as const, pax: 25, daysAgo: 10, departIn: 20, status: "Devis accepté" },
  { nom: "Girard", prenom: "Nicolas", email: "n.girard@seminaire.fr", tel: "0632198765", societe: "Séminaires Pro", depart: "Toulouse", arrivee: "Bordeaux", besoin: "aller_retour" as const, pax: 40, daysAgo: 12, departIn: 8, status: "Devis envoyé" },
  { nom: "Blanc", prenom: "Isabelle", email: "isabelle@ecole-danse.fr", tel: "0654329876", societe: "École de Danse", depart: "Marseille", arrivee: "Avignon", besoin: "aller_retour" as const, pax: 18, daysAgo: 14, departIn: 3, status: "Devis refusé" },
  { nom: "Lambert", prenom: "Hugo", email: "hugo.l@startup.io", tel: "0687651234", societe: "StartupIO", depart: "Paris", arrivee: "Lille", besoin: "aller_simple" as const, pax: 15, daysAgo: 15, departIn: 40, status: "Devis généré" },
  { nom: "Morel", prenom: "Chloé", email: "chloe@club-rando.fr", tel: "0643219876", societe: "Club Rando", depart: "Grenoble", arrivee: "Chamonix", besoin: "circuit" as const, pax: 28, daysAgo: 18, departIn: 55, status: "Devis envoyé" },
  { nom: "Simon", prenom: "Antoine", email: "a.simon@hotel-group.fr", tel: "0612349876", societe: "Hotel Group", depart: "Nice", arrivee: "Monaco", besoin: "aller_simple" as const, pax: 65, daysAgo: 20, departIn: 25, status: "Devis accepté" },
  { nom: "Laurent", prenom: "Sarah", email: "sarah@asso-culturelle.fr", tel: "0698764321", societe: "Asso Culturelle", depart: "Lyon", arrivee: "Dijon", besoin: "aller_retour" as const, pax: 38, daysAgo: 22, departIn: 15, status: "Devis envoyé" },
  { nom: "Michel", prenom: "Julien", email: "julien.m@pharma.fr", tel: "0665439876", societe: "PharmaCo", depart: "Bordeaux", arrivee: "La Rochelle", besoin: "aller_simple" as const, pax: 22, daysAgo: 25, departIn: 10, status: "Devis refusé" },
  { nom: "Lefebvre", prenom: "Léa", email: "lea@comite-ent.fr", tel: "0632197654", societe: "Comité Entreprise SNCF", depart: "Paris", arrivee: "Strasbourg", besoin: "aller_retour" as const, pax: 55, daysAgo: 28, departIn: 50, status: "Devis accepté" },
  { nom: "David", prenom: "Maxime", email: "maxime@sport-events.fr", tel: "0654328765", societe: "Sport Events", depart: "Marseille", arrivee: "Montpellier", besoin: "aller_simple" as const, pax: 42, daysAgo: 30, departIn: 12, status: "Devis envoyé" },
  { nom: "Bertrand", prenom: "Clara", email: "clara.b@voyage-scolaire.fr", tel: "0687659876", societe: "Lycée Molière", depart: "Nantes", arrivee: "Angers", besoin: "aller_retour" as const, pax: 50, daysAgo: 32, departIn: 65, status: "Devis accepté" },
  { nom: "Richard", prenom: "Olivier", email: "o.richard@conseil.fr", tel: "0643217654", societe: "Conseil Plus", depart: "Toulouse", arrivee: "Pau", besoin: "aller_simple" as const, pax: 20, daysAgo: 35, departIn: 18, status: "Devis généré" },
  { nom: "Robert", prenom: "Manon", email: "manon@asso-parents.fr", tel: "0612347654", societe: "APE École Centrale", depart: "Lyon", arrivee: "Saint-Étienne", besoin: "aller_retour" as const, pax: 46, daysAgo: 38, departIn: 28, status: "Devis envoyé" },
  { nom: "Durand", prenom: "Vincent", email: "vincent@immobilier.fr", tel: "0698763214", societe: "Immo Invest", depart: "Paris", arrivee: "Reims", besoin: "aller_retour" as const, pax: 35, daysAgo: 40, departIn: 22, status: "Devis accepté" },
  { nom: "Thomas", prenom: "Pauline", email: "pauline@chorale.fr", tel: "0665438765", societe: "Chorale Harmonie", depart: "Strasbourg", arrivee: "Nancy", besoin: "aller_retour" as const, pax: 32, daysAgo: 42, departIn: 70, status: "Devis envoyé" },
  { nom: "Jolie", prenom: "Fabien", email: "fabien@tech-summit.fr", tel: "0632196543", societe: "Tech Summit", depart: "Paris", arrivee: "Bordeaux", besoin: "aller_simple" as const, pax: 75, daysAgo: 45, departIn: 5, status: "Devis refusé" },
  { nom: "Fontaine", prenom: "Lucie", email: "lucie@asso-senior.fr", tel: "0654327654", societe: "Club Seniors", depart: "Nice", arrivee: "Cannes", besoin: "aller_simple" as const, pax: 30, daysAgo: 48, departIn: 32, status: "Devis accepté" },
  { nom: "Mercier", prenom: "Romain", email: "romain@startup-weekend.fr", tel: "0687658765", societe: "Startup Weekend", depart: "Lyon", arrivee: "Marseille", besoin: "aller_retour" as const, pax: 40, daysAgo: 50, departIn: 45, status: "Devis envoyé" },
  { nom: "Chevalier", prenom: "Anaïs", email: "anais@mairie-villeurbanne.fr", tel: "0643216543", societe: "Mairie Villeurbanne", depart: "Villeurbanne", arrivee: "Annecy", besoin: "aller_retour" as const, pax: 55, daysAgo: 52, departIn: 38, status: "Devis accepté" },
  { nom: "Perrin", prenom: "Sébastien", email: "seb@federation-foot.fr", tel: "0612346543", societe: "FF Foot District", depart: "Paris", arrivee: "Lens", besoin: "aller_retour" as const, pax: 48, daysAgo: 55, departIn: 7, status: "Devis envoyé" },
  { nom: "Clement", prenom: "Aurélie", email: "aurelie@formation-pro.fr", tel: "0698762143", societe: "Formation Pro", depart: "Montpellier", arrivee: "Nîmes", besoin: "aller_simple" as const, pax: 16, daysAgo: 57, departIn: 42, status: "Erreur distance" },
  { nom: "Gauthier", prenom: "Damien", email: "damien@agence-voyage.fr", tel: "0665437654", societe: "Agence Voyages+", depart: "Bordeaux", arrivee: "Biarritz", besoin: "aller_retour" as const, pax: 58, daysAgo: 60, departIn: 20, status: "Devis généré" },
];

const DISTANCES: Record<string, number> = {
  "Paris-Lyon": 465, "Marseille-Nice": 200, "Bordeaux-Toulouse": 245,
  "Lille-Paris": 225, "Nantes-Rennes": 110, "Lyon-Grenoble": 115,
  "Strasbourg-Colmar": 75, "Paris-Bruxelles": 310, "Montpellier-Perpignan": 170,
  "Toulouse-Bordeaux": 245, "Marseille-Avignon": 100, "Paris-Lille": 225,
  "Grenoble-Chamonix": 150, "Nice-Monaco": 20, "Lyon-Dijon": 195,
  "Bordeaux-La Rochelle": 190, "Paris-Strasbourg": 490, "Marseille-Montpellier": 170,
  "Nantes-Angers": 90, "Toulouse-Pau": 195, "Lyon-Saint-Étienne": 60,
  "Paris-Reims": 145, "Strasbourg-Nancy": 160, "Paris-Bordeaux": 585,
  "Nice-Cannes": 35, "Lyon-Marseille": 315, "Villeurbanne-Annecy": 145,
  "Paris-Lens": 200, "Montpellier-Nîmes": 55, "Bordeaux-Biarritz": 196,
};

function getDistance(depart: string, arrivee: string): number {
  return DISTANCES[`${depart}-${arrivee}`] ?? DISTANCES[`${arrivee}-${depart}`] ?? 200;
}

async function seed() {
  console.log("🗑️  Suppression des données existantes...");
  await db.delete(schema.relances);
  await db.delete(schema.devis);
  await db.delete(schema.leads);
  await db.delete(schema.prospects);

  console.log(`🌱 Insertion de ${FIXTURES.length} fixtures...\n`);

  for (const f of FIXTURES) {
    const createdAt = daysAgo(f.daysAgo);

    const [prospect] = await db
      .insert(schema.prospects)
      .values({
        nom: f.nom,
        prenom: f.prenom,
        email: f.email,
        telephone: f.tel,
        societe: f.societe,
        createdAt,
      })
      .returning();

    const departDate = futureDate(f.departIn);

    const [lead] = await db
      .insert(schema.leads)
      .values({
        prospectId: prospect.id,
        status: f.status,
        departVille: f.depart,
        departDate,
        departHeure: randomHeure(),
        arriveeVille: f.arrivee,
        arriveeDate: departDate,
        arriveeHeure: randomHeure(),
        besoin: f.besoin,
        voyageursMin: f.pax,
        voyageursMax: f.pax,
        createdAt,
      })
      .returning();

    if (f.status !== "Nouvelle demande" && f.status !== "Renvoyé au commercial" && f.status !== "Erreur distance") {
      const distanceKm = getDistance(f.depart, f.arrivee);
      const result = calculerDevis({
        distanceKm,
        besoin: f.besoin,
        dateDepart: departDate,
        dateDemande: createdAt.toISOString().slice(0, 10),
        nbPassagers: f.pax,
      });

      const envoyeLe =
        ["Devis envoyé", "Devis accepté", "Devis refusé"].includes(f.status)
          ? new Date(createdAt.getTime() + 3600000)
          : null;

      await db.insert(schema.devis).values({
        leadId: lead.id,
        reference: `NT-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 4).toUpperCase()}`,
        distanceKm,
        prixHT: result.prixHT.toString(),
        prixTTC: result.prixTTC.toString(),
        coeffSaison: result.detail.coeffSaison.toString(),
        coeffDate: result.detail.coeffDate.toString(),
        coeffCapacite: result.detail.coeffCapacite.toString(),
        marge: result.detail.marge.toString(),
        ajustementCustom: "0",
        version: 1,
        envoyeLe,
        createdAt,
      });
    }

    console.log(`  ✅ ${f.societe} — ${f.depart}→${f.arrivee} — ${f.status}`);
  }

  console.log(`\n🎉 ${FIXTURES.length} fixtures insérées avec succès`);
  await client.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
