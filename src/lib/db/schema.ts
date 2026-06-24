import {
  pgTable,
  pgEnum,
  uuid,
  timestamp,
  varchar,
  date,
  time,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const besoinEnum = pgEnum("besoin", [
  "aller_simple",
  "aller_retour",
  "circuit",
]);

export const prospects = pgTable(
  "prospects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nom: varchar("nom", { length: 255 }),
    prenom: varchar("prenom", { length: 255 }),
    email: varchar("email", { length: 255 }).notNull(),
    telephone: varchar("telephone", { length: 20 }),
    societe: varchar("societe", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("prospects_email_idx").on(table.email)],
);

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  status: varchar("status", { length: 50 })
    .notNull()
    .default("Nouvelle demande"),

  prospectId: uuid("prospect_id")
    .notNull()
    .references(() => prospects.id),

  departVille: varchar("depart_ville", { length: 255 }),
  departDate: date("depart_date"),
  departHeure: time("depart_heure"),
  arriveeVille: varchar("arrivee_ville", { length: 255 }),
  arriveeDate: date("arrivee_date"),
  arriveeHeure: time("arrivee_heure"),

  besoin: besoinEnum("besoin"),

  voyageursMin: integer("voyageurs_min"),
  voyageursMax: integer("voyageurs_max"),
});
