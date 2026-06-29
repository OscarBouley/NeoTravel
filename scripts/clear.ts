import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { relances, devis, leads, prospects } from "../src/lib/db/schema";

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
const db = drizzle(client);

async function clear() {
  console.log("Suppression de toutes les données...");
  await db.delete(relances);
  await db.delete(devis);
  await db.delete(leads);
  await db.delete(prospects);
  console.log("Base vidée.");
  process.exit(0);
}

clear().catch((e) => {
  console.error(e);
  process.exit(1);
});
