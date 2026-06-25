import {
  pgTable,
  pgEnum,
  uuid,
  timestamp,
  varchar,
  date,
  time,
  integer,
  numeric,
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

  noteCommercial: varchar("note_commercial", { length: 500 }),
});

export const devis = pgTable("devis", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),

  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id),

  reference: varchar("reference", { length: 50 }).notNull(),
  distanceKm: integer("distance_km").notNull(),
  prixHT: numeric("prix_ht", { precision: 10, scale: 2 }).notNull(),
  prixTTC: numeric("prix_ttc", { precision: 10, scale: 2 }).notNull(),

  version: integer("version").notNull().default(1),

  coeffSaison: numeric("coeff_saison", { precision: 5, scale: 4 }),
  coeffDate: numeric("coeff_date", { precision: 5, scale: 4 }),
  coeffCapacite: numeric("coeff_capacite", { precision: 5, scale: 4 }),
  marge: numeric("marge", { precision: 5, scale: 4 }),
  ajustementCustom: numeric("ajustement_custom", { precision: 5, scale: 4 }),

  envoyeLe: timestamp("envoye_le", { withTimezone: true }),
});

export const relances = pgTable("relances", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),

  devisId: uuid("devis_id")
    .notNull()
    .references(() => devis.id),

  type: varchar("type", { length: 20 }).notNull(),
  envoyeLe: timestamp("envoye_le", { withTimezone: true }).notNull(),
});
