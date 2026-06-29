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

const NOW = new Date("2026-06-29T12:00:00Z");

function daysAgo(n: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  d.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

function dateStr(daysFromNow: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

function randomHeure(): string {
  const h = 6 + Math.floor(Math.random() * 14);
  const m = Math.random() < 0.5 ? "00" : "30";
  return `${h.toString().padStart(2, "0")}:${m}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type Besoin = "aller_simple" | "aller_retour" | "circuit";

interface Fixture {
  nom: string;
  prenom: string;
  email: string | null;
  tel: string | null;
  societe: string;
  depart: string;
  arrivee: string;
  besoin: Besoin;
  pax: number;
  createdDaysAgo: number;
  departIn: number;
  status: string;
  relances?: number;
  detailComplexe?: string;
}

const TRAJETS: { depart: string; arrivee: string; km: number }[] = [
  { depart: "Paris", arrivee: "Lyon", km: 465 },
  { depart: "Paris", arrivee: "Lille", km: 225 },
  { depart: "Paris", arrivee: "Bordeaux", km: 585 },
  { depart: "Paris", arrivee: "Strasbourg", km: 490 },
  { depart: "Paris", arrivee: "Reims", km: 145 },
  { depart: "Paris", arrivee: "Rouen", km: 135 },
  { depart: "Paris", arrivee: "Tours", km: 235 },
  { depart: "Paris", arrivee: "Lens", km: 200 },
  { depart: "Lyon", arrivee: "Grenoble", km: 115 },
  { depart: "Lyon", arrivee: "Saint-Étienne", km: 60 },
  { depart: "Lyon", arrivee: "Marseille", km: 315 },
  { depart: "Lyon", arrivee: "Dijon", km: 195 },
  { depart: "Lyon", arrivee: "Annecy", km: 145 },
  { depart: "Marseille", arrivee: "Nice", km: 200 },
  { depart: "Marseille", arrivee: "Avignon", km: 100 },
  { depart: "Marseille", arrivee: "Montpellier", km: 170 },
  { depart: "Bordeaux", arrivee: "Toulouse", km: 245 },
  { depart: "Bordeaux", arrivee: "La Rochelle", km: 190 },
  { depart: "Bordeaux", arrivee: "Biarritz", km: 196 },
  { depart: "Toulouse", arrivee: "Pau", km: 195 },
  { depart: "Toulouse", arrivee: "Montpellier", km: 245 },
  { depart: "Nantes", arrivee: "Rennes", km: 110 },
  { depart: "Nantes", arrivee: "Angers", km: 90 },
  { depart: "Lille", arrivee: "Reims", km: 210 },
  { depart: "Strasbourg", arrivee: "Colmar", km: 75 },
  { depart: "Strasbourg", arrivee: "Nancy", km: 160 },
  { depart: "Nice", arrivee: "Cannes", km: 35 },
  { depart: "Montpellier", arrivee: "Nîmes", km: 55 },
  { depart: "Montpellier", arrivee: "Perpignan", km: 170 },
  { depart: "Grenoble", arrivee: "Chambéry", km: 60 },
];

const NOMS = [
  "Martin", "Bernard", "Dupont", "Thomas", "Robert", "Richard", "Petit", "Durand",
  "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia", "David",
  "Bertrand", "Roux", "Vincent", "Fournier", "Morel", "Girard", "André", "Mercier",
  "Blanc", "Guérin", "Boyer", "Garnier", "Chevalier", "François", "Legrand", "Gauthier",
  "Perrin", "Robin", "Clément", "Morin", "Nicolas", "Henry", "Rousseau", "Mathieu",
  "Aubry", "Fontaine", "Masson", "Pelletier", "Renard", "Picard", "Colin", "Barbier",
  "Lemoine", "Deschamps",
];
const PRENOMS = [
  "Sophie", "Pierre", "Marie", "Thomas", "Julie", "Lucas", "Emma", "Alexandre",
  "Camille", "Nicolas", "Isabelle", "Hugo", "Chloé", "Antoine", "Sarah", "Julien",
  "Léa", "Maxime", "Clara", "Olivier", "Manon", "Vincent", "Pauline", "Fabien",
  "Lucie", "Romain", "Anaïs", "Sébastien", "Aurélie", "Damien", "Élodie", "Mathieu",
  "Marion", "Benoît", "Laura", "Guillaume", "Céline", "Florian", "Nathalie", "Kevin",
  "Morgane", "Yann", "Valérie", "Jérôme", "Sandrine", "Franck", "Delphine", "Arnaud",
  "Caroline", "Stéphane",
];
const SOCIETES = [
  "Groupe ABC", "TechCorp", "Lycée Victor Hugo", "AS Rugby Club", "Events Plus",
  "Collège Pasteur", "Mariage E&T", "BigCorp Industries", "Asso Jeunes", "Séminaires Pro",
  "École de Danse", "StartupIO", "Club Rando", "Hotel Group", "Asso Culturelle",
  "PharmaCo", "CE SNCF", "Sport Events", "Lycée Molière", "Conseil Plus",
  "APE École Centrale", "Immo Invest", "Chorale Harmonie", "Tech Summit", "Club Seniors",
  "Startup Weekend", "Mairie Villeurbanne", "FF Foot District", "Formation Pro", "Agence Voyages+",
  "CE Airbus", "Asso Randonnée", "Club Basket", "Maison de retraite Beausoleil", "CE BNP",
  "Théâtre du Soleil", "Orchestre National", "CE Orange", "Scouts de France", "Asso Étudiants",
  "Mairie de Clichy", "Club Vélo", "Fondation Santé", "CE Thales", "Asso Musique",
  "CE Renault", "Club Tennis", "Lycée Voltaire", "CE EDF", "Asso Solidarité",
];

function makeFixtures(): Fixture[] {
  const fixtures: Fixture[] = [];
  let idx = 0;

  function add(overrides: Partial<Fixture> & { status: string }) {
    const trajet = pick(TRAJETS);
    const nom = NOMS[idx % NOMS.length];
    const prenom = PRENOMS[idx % PRENOMS.length];
    const societe = SOCIETES[idx % SOCIETES.length];
    const hasEmail = overrides.email !== null;
    const email = overrides.email === undefined
      ? (hasEmail !== false ? `${prenom.toLowerCase()}.${nom.toLowerCase()}@${societe.toLowerCase().replace(/[^a-z]/g, "")}.fr` : null)
      : overrides.email;
    idx++;
    fixtures.push({
      nom,
      prenom,
      email,
      tel: overrides.tel ?? (Math.random() < 0.7 ? `06${Math.floor(10000000 + Math.random() * 90000000)}` : null),
      societe,
      depart: overrides.depart ?? trajet.depart,
      arrivee: overrides.arrivee ?? trajet.arrivee,
      besoin: overrides.besoin ?? pick(["aller_simple", "aller_retour", "aller_retour"] as Besoin[]),
      pax: overrides.pax ?? (10 + Math.floor(Math.random() * 60)),
      createdDaysAgo: overrides.createdDaysAgo ?? 1,
      departIn: overrides.departIn ?? 30,
      status: overrides.status,
      relances: overrides.relances,
      detailComplexe: overrides.detailComplexe,
    });
  }

  // === QUALIFIÉ (Devis généré, pas encore envoyé) — 12 leads ===
  add({ status: "Devis généré", createdDaysAgo: 0, departIn: 25, besoin: "aller_retour", pax: 45, depart: "Paris", arrivee: "Lyon" });
  add({ status: "Devis généré", createdDaysAgo: 0, departIn: 14, besoin: "aller_simple", pax: 30, depart: "Marseille", arrivee: "Nice" });
  add({ status: "Devis généré", createdDaysAgo: 1, departIn: 45, besoin: "aller_retour", pax: 52, depart: "Bordeaux", arrivee: "Toulouse" });
  add({ status: "Devis généré", createdDaysAgo: 1, departIn: 60, besoin: "aller_retour", pax: 38, depart: "Lyon", arrivee: "Grenoble" });
  add({ status: "Devis généré", createdDaysAgo: 2, departIn: 20, besoin: "aller_simple", pax: 22, depart: "Nantes", arrivee: "Rennes" });
  add({ status: "Devis généré", createdDaysAgo: 2, departIn: 35, besoin: "circuit", pax: 48, depart: "Strasbourg", arrivee: "Colmar" });
  add({ status: "Devis généré", createdDaysAgo: 3, departIn: 5, besoin: "aller_retour", pax: 34 }); // urgent
  add({ status: "Devis généré", createdDaysAgo: 3, departIn: 3, besoin: "aller_simple", pax: 18 }); // urgent
  add({ status: "Devis généré", createdDaysAgo: 4, departIn: 90, besoin: "aller_retour", pax: 55 });
  add({ status: "Devis généré", createdDaysAgo: 5, departIn: 40, besoin: "aller_simple", pax: 28 });
  add({ status: "Devis généré", createdDaysAgo: 7, departIn: 70, besoin: "aller_retour", pax: 42 });
  add({ status: "Devis généré", createdDaysAgo: 10, departIn: 15, besoin: "aller_retour", pax: 36 });

  // === DEVIS ENVOYÉ (envoyé, pas encore relancé, en attente de réponse) — 15 leads ===
  add({ status: "Devis envoyé", createdDaysAgo: 1, departIn: 30, besoin: "aller_retour", pax: 40, depart: "Paris", arrivee: "Bordeaux" });
  add({ status: "Devis envoyé", createdDaysAgo: 1, departIn: 18, besoin: "aller_simple", pax: 25, depart: "Toulouse", arrivee: "Montpellier" });
  add({ status: "Devis envoyé", createdDaysAgo: 2, departIn: 22, besoin: "aller_retour", pax: 50, depart: "Lyon", arrivee: "Dijon" });
  add({ status: "Devis envoyé", createdDaysAgo: 2, departIn: 45, besoin: "aller_retour", pax: 35 });
  add({ status: "Devis envoyé", createdDaysAgo: 2, departIn: 6, besoin: "aller_simple", pax: 20 }); // urgent
  add({ status: "Devis envoyé", createdDaysAgo: 2, departIn: 4, besoin: "aller_retour", pax: 44 }); // urgent
  add({ status: "Devis envoyé", createdDaysAgo: 3, departIn: 55, besoin: "circuit", pax: 60 });
  add({ status: "Devis envoyé", createdDaysAgo: 3, departIn: 28, besoin: "aller_retour", pax: 32 });
  // prêts à être relancés (envoyés il y a 4+ jours, relance 1 due à J+3)
  add({ status: "Devis envoyé", createdDaysAgo: 5, departIn: 40, besoin: "aller_retour", pax: 46 });
  add({ status: "Devis envoyé", createdDaysAgo: 6, departIn: 35, besoin: "aller_simple", pax: 28 });
  add({ status: "Devis envoyé", createdDaysAgo: 7, departIn: 50, besoin: "aller_retour", pax: 52 });
  add({ status: "Devis envoyé", createdDaysAgo: 8, departIn: 25, besoin: "aller_retour", pax: 38 });
  add({ status: "Devis envoyé", createdDaysAgo: 10, departIn: 20, besoin: "aller_simple", pax: 22 });
  add({ status: "Devis envoyé", createdDaysAgo: 12, departIn: 30, besoin: "aller_retour", pax: 48 });
  add({ status: "Devis envoyé", createdDaysAgo: 14, departIn: 45, besoin: "aller_retour", pax: 55 });

  // === RELANCÉ (envoyé + relances faites) — 10 leads ===
  add({ status: "Devis envoyé", createdDaysAgo: 6, departIn: 20, relances: 1, besoin: "aller_retour", pax: 40 });
  add({ status: "Devis envoyé", createdDaysAgo: 8, departIn: 35, relances: 1, besoin: "aller_simple", pax: 30 });
  add({ status: "Devis envoyé", createdDaysAgo: 10, departIn: 28, relances: 1, besoin: "aller_retour", pax: 55 });
  add({ status: "Devis envoyé", createdDaysAgo: 12, departIn: 40, relances: 2, besoin: "aller_retour", pax: 42 });
  add({ status: "Devis envoyé", createdDaysAgo: 14, departIn: 50, relances: 2, besoin: "circuit", pax: 35 });
  add({ status: "Devis envoyé", createdDaysAgo: 15, departIn: 22, relances: 2, besoin: "aller_retour", pax: 48 });
  add({ status: "Devis envoyé", createdDaysAgo: 4, departIn: 5, relances: 1, besoin: "aller_simple", pax: 26 }); // urgent relancé
  add({ status: "Devis envoyé", createdDaysAgo: 5, departIn: 4, relances: 2, besoin: "aller_retour", pax: 32 }); // urgent 2x relancé
  add({ status: "Devis envoyé", createdDaysAgo: 18, departIn: 60, relances: 2, besoin: "aller_retour", pax: 50 });
  add({ status: "Devis envoyé", createdDaysAgo: 20, departIn: 45, relances: 2, besoin: "aller_simple", pax: 20 });

  // === DEVIS ENVOYÉ — suppléments pour atteindre ~100 ===
  add({ status: "Devis envoyé", createdDaysAgo: 4, departIn: 15, besoin: "aller_retour", pax: 33, depart: "Paris", arrivee: "Rouen" });
  add({ status: "Devis envoyé", createdDaysAgo: 6, departIn: 38, besoin: "aller_simple", pax: 27, depart: "Lyon", arrivee: "Annecy" });
  add({ status: "Devis envoyé", createdDaysAgo: 9, departIn: 42, relances: 1, besoin: "aller_retour", pax: 44, depart: "Paris", arrivee: "Tours" });
  add({ status: "Devis envoyé", createdDaysAgo: 11, departIn: 55, relances: 1, besoin: "aller_retour", pax: 52, depart: "Lille", arrivee: "Reims" });
  add({ status: "Devis envoyé", createdDaysAgo: 16, departIn: 32, relances: 2, besoin: "aller_simple", pax: 19, depart: "Grenoble", arrivee: "Chambéry" });

  // === QUALIFIÉ — suppléments ===
  add({ status: "Devis généré", createdDaysAgo: 0, departIn: 10, besoin: "aller_retour", pax: 40, depart: "Toulouse", arrivee: "Pau" });
  add({ status: "Devis généré", createdDaysAgo: 1, departIn: 55, besoin: "aller_simple", pax: 26, depart: "Nice", arrivee: "Cannes" });
  add({ status: "Devis généré", createdDaysAgo: 6, departIn: 28, besoin: "aller_retour", pax: 50, depart: "Montpellier", arrivee: "Nîmes" });

  // === INFOS SUPPLÉMENTAIRES — suppléments ===
  add({ status: "Devis refusé", createdDaysAgo: 6, departIn: 22, besoin: "aller_retour", pax: 34, depart: "Paris", arrivee: "Reims" });
  add({ status: "Devis refusé", createdDaysAgo: 10, departIn: 15, besoin: "aller_simple", pax: 20, depart: "Bordeaux", arrivee: "La Rochelle" });
  add({ status: "Devis refusé", createdDaysAgo: 20, departIn: 8, besoin: "aller_retour", pax: 45 });
  add({ status: "Devis refusé", createdDaysAgo: 28, departIn: -1, besoin: "aller_simple", pax: 30 }); // dépassé

  // === GAGNÉ — suppléments ===
  add({ status: "Devis accepté", createdDaysAgo: 3, departIn: 8, besoin: "aller_retour", pax: 42, depart: "Strasbourg", arrivee: "Nancy" });
  add({ status: "Devis accepté", createdDaysAgo: 7, departIn: 20, besoin: "aller_simple", pax: 18, depart: "Montpellier", arrivee: "Perpignan" });
  add({ status: "Devis accepté", createdDaysAgo: 14, departIn: 35, besoin: "aller_retour", pax: 55, depart: "Nantes", arrivee: "Angers" });
  add({ status: "Devis accepté", createdDaysAgo: 20, departIn: 45, besoin: "aller_retour", pax: 48, depart: "Paris", arrivee: "Strasbourg" });
  add({ status: "Devis accepté", createdDaysAgo: 45, departIn: -8, besoin: "aller_retour", pax: 36, depart: "Toulouse", arrivee: "Montpellier" }); // dépassé
  add({ status: "Devis accepté", createdDaysAgo: 70, departIn: -35, besoin: "aller_simple", pax: 25, depart: "Marseille", arrivee: "Montpellier" }); // dépassé

  // === ERREUR DISTANCE — suppléments ===
  add({ status: "Erreur distance", createdDaysAgo: 1, departIn: 18, pax: 42, depart: "Issoire", arrivee: "Brioude" });

  // === GAGNÉ (Devis accepté) — boucle ===
  for (let i = 0; i < 12; i++) {
    add({ status: "Devis accepté", createdDaysAgo: 5 + i * 4, departIn: 10 + i * 7, besoin: pick(["aller_retour", "aller_simple", "aller_retour"] as Besoin[]), pax: 15 + Math.floor(Math.random() * 55) });
  }
  // gagnés avec date dépassée (départ dans le passé)
  add({ status: "Devis accepté", createdDaysAgo: 30, departIn: -2, besoin: "aller_retour", pax: 45, depart: "Paris", arrivee: "Lyon" });
  add({ status: "Devis accepté", createdDaysAgo: 40, departIn: -5, besoin: "aller_simple", pax: 32, depart: "Marseille", arrivee: "Avignon" });
  add({ status: "Devis accepté", createdDaysAgo: 50, departIn: -10, besoin: "aller_retour", pax: 50, depart: "Bordeaux", arrivee: "Toulouse" });
  add({ status: "Devis accepté", createdDaysAgo: 55, departIn: -15, besoin: "aller_retour", pax: 38, depart: "Nantes", arrivee: "Rennes" });
  add({ status: "Devis accepté", createdDaysAgo: 60, departIn: -20, besoin: "aller_simple", pax: 28, depart: "Lyon", arrivee: "Grenoble" });
  add({ status: "Devis accepté", createdDaysAgo: 65, departIn: -30, besoin: "aller_retour", pax: 55, depart: "Lille", arrivee: "Reims" });

  // === INFOS SUPPLÉMENTAIRES (Devis refusé) — 10 leads ===
  add({ status: "Devis refusé", createdDaysAgo: 4, departIn: 18, besoin: "aller_retour", pax: 40 });
  add({ status: "Devis refusé", createdDaysAgo: 8, departIn: 25, besoin: "aller_simple", pax: 22 });
  add({ status: "Devis refusé", createdDaysAgo: 12, departIn: 35, besoin: "aller_retour", pax: 55 });
  add({ status: "Devis refusé", createdDaysAgo: 15, departIn: 40, besoin: "circuit", pax: 30 });
  add({ status: "Devis refusé", createdDaysAgo: 18, departIn: 12, besoin: "aller_retour", pax: 48 });
  add({ status: "Devis refusé", createdDaysAgo: 22, departIn: 30, besoin: "aller_simple", pax: 35 });
  add({ status: "Devis refusé", createdDaysAgo: 25, departIn: 50, besoin: "aller_retour", pax: 42 });
  add({ status: "Devis refusé", createdDaysAgo: 30, departIn: 20, besoin: "aller_retour", pax: 38 });
  add({ status: "Devis refusé", createdDaysAgo: 35, departIn: -3, besoin: "aller_simple", pax: 25 }); // dépassé
  add({ status: "Devis refusé", createdDaysAgo: 40, departIn: -8, besoin: "aller_retour", pax: 32 }); // dépassé

  // === À TRAITER - HITL (Renvoyé au commercial) — 8 leads ===
  add({ status: "Renvoyé au commercial", createdDaysAgo: 0, departIn: 30, pax: 95, detailComplexe: "Plus de 85 passagers (95 pax demandés)", depart: "Paris", arrivee: "Bordeaux" });
  add({ status: "Renvoyé au commercial", createdDaysAgo: 1, departIn: 45, pax: 120, detailComplexe: "Plus de 85 passagers (120 pax demandés)", depart: "Lyon", arrivee: "Marseille" });
  add({ status: "Renvoyé au commercial", createdDaysAgo: 2, departIn: 60, pax: 50, besoin: "circuit", detailComplexe: "Circuit 5 étapes sur 4 jours avec hébergement", depart: "Paris", arrivee: "Strasbourg" });
  add({ status: "Renvoyé au commercial", createdDaysAgo: 3, departIn: 25, pax: 35, detailComplexe: "Accessibilité PMR nécessitant un véhicule adapté", depart: "Marseille", arrivee: "Nice" });
  add({ status: "Renvoyé au commercial", createdDaysAgo: 4, departIn: 15, pax: 40, detailComplexe: "Transport de matériel volumineux (instruments de musique)", depart: "Toulouse", arrivee: "Bordeaux" });
  add({ status: "Renvoyé au commercial", createdDaysAgo: 5, departIn: 5, pax: 110, detailComplexe: "Plus de 85 passagers (110 pax demandés)", depart: "Nantes", arrivee: "Rennes" }); // urgent
  add({ status: "Renvoyé au commercial", createdDaysAgo: 7, departIn: 35, pax: 45, besoin: "circuit", detailComplexe: "Trajet international vers Barcelone, passage de frontière", depart: "Montpellier", arrivee: "Perpignan" });
  add({ status: "Renvoyé au commercial", createdDaysAgo: 10, departIn: 50, pax: 60, detailComplexe: "Prestation sur 3 jours avec hébergement à organiser" });

  // === ERREUR DISTANCE — 7 leads ===
  add({ status: "Erreur distance", createdDaysAgo: 0, departIn: 20, pax: 30, depart: "Saint-Pierre-des-Corps", arrivee: "Bourg-la-Reine" });
  add({ status: "Erreur distance", createdDaysAgo: 1, departIn: 14, pax: 25, depart: "Le Puy-en-Velay", arrivee: "Aurillac" });
  add({ status: "Erreur distance", createdDaysAgo: 2, departIn: 30, pax: 40, depart: "Cergy-Pontoise", arrivee: "Marne-la-Vallée" });
  add({ status: "Erreur distance", createdDaysAgo: 3, departIn: 45, pax: 18, depart: "Villefranche-sur-Saône", arrivee: "Bourg-en-Bresse" });
  add({ status: "Erreur distance", createdDaysAgo: 5, departIn: 10, pax: 55, depart: "Saint-Nazaire", arrivee: "La Baule" });
  add({ status: "Erreur distance", createdDaysAgo: 8, departIn: 25, pax: 35, depart: "Font-Romeu", arrivee: "Ax-les-Thermes" });
  add({ status: "Erreur distance", createdDaysAgo: 12, departIn: 60, pax: 22, depart: "Châteauroux", arrivee: "Guéret" });

  return fixtures;
}

const DISTANCES: Record<string, number> = {};
for (const t of TRAJETS) {
  DISTANCES[`${t.depart}-${t.arrivee}`] = t.km;
  DISTANCES[`${t.arrivee}-${t.depart}`] = t.km;
}

function getDistance(depart: string, arrivee: string): number {
  return DISTANCES[`${depart}-${arrivee}`] ?? 200;
}

async function seed() {
  const fixtures = makeFixtures();

  console.log("Suppression des données existantes...");
  await db.delete(schema.relances);
  await db.delete(schema.devis);
  await db.delete(schema.leads);
  await db.delete(schema.prospects);

  console.log(`Insertion de ${fixtures.length} fixtures...\n`);

  for (const f of fixtures) {
    const createdAt = daysAgo(f.createdDaysAgo);

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

    const departDate = dateStr(f.departIn);
    const arriveeDate = f.besoin === "aller_retour" ? dateStr(f.departIn + 1) : departDate;

    const [lead] = await db
      .insert(schema.leads)
      .values({
        prospectId: prospect.id,
        status: f.status,
        departVille: f.depart,
        departDate,
        departHeure: randomHeure(),
        arriveeVille: f.arrivee,
        arriveeDate,
        arriveeHeure: randomHeure(),
        besoin: f.besoin,
        voyageursMin: f.pax,
        voyageursMax: f.pax,
        detailComplexe: f.detailComplexe ?? null,
        createdAt,
      })
      .returning();

    const needsDevis = !["Renvoyé au commercial", "Erreur distance"].includes(f.status);

    if (needsDevis) {
      const distanceKm = getDistance(f.depart, f.arrivee);
      const result = calculerDevis({
        distanceKm,
        besoin: f.besoin,
        dateDepart: departDate,
        dateDemande: createdAt.toISOString().slice(0, 10),
        nbPassagers: f.pax,
      });

      const wasEnvoye = ["Devis envoyé", "Devis accepté", "Devis refusé"].includes(f.status);
      const envoyeLe = wasEnvoye
        ? new Date(createdAt.getTime() + 2 * 3600000)
        : null;

      const [devisRow] = await db
        .insert(schema.devis)
        .values({
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
        })
        .returning();

      if (f.relances && f.relances > 0 && envoyeLe) {
        for (let r = 0; r < f.relances; r++) {
          const relanceDate = new Date(envoyeLe.getTime() + (r === 0 ? 3 : 7) * 24 * 3600000);
          await db.insert(schema.relances).values({
            devisId: devisRow.id,
            type: `relance_${r + 1}`,
            envoyeLe: relanceDate,
            createdAt: relanceDate,
          });
        }
      }
    }

    const col = f.status === "Devis accepté" && f.departIn < 0 ? "GAGNÉ (dépassé)" :
      f.relances ? `${f.status} (${f.relances}x relancé)` : f.status;
    console.log(`  ${f.societe.padEnd(30)} ${f.depart}→${f.arrivee.padEnd(16)} ${col}`);
  }

  console.log(`\n${fixtures.length} fixtures insérées avec succès`);
  await client.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
