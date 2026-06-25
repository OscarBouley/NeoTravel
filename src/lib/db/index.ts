import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const url = new URL(connectionString);
const client = postgres({
  host: url.hostname,
  port: Number(url.port),
  username: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  prepare: false,
  ssl: "prefer",
});

export const db = drizzle(client, { schema });
