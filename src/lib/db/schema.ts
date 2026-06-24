import {
  pgTable,
  pgEnum,
  uuid,
  timestamp,
  varchar,
  time,
  integer,
} from "drizzle-orm/pg-core";

export const besoinEnum = pgEnum("besoin", [
  "aller_simple",
  "aller_retour",
  "circuit",
]);

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  status: varchar("status", { length: 50 })
    .notNull()
    .default("Nouvelle demande"),

  // Client
  nom: varchar("nom", { length: 255 }),
  prenom: varchar("prenom", { length: 255 }),
  email: varchar("email", { length: 255 }),
  telephone: varchar("telephone", { length: 20 }),
  societe: varchar("societe", { length: 255 }),

  // Trajet
  departVille: varchar("depart_ville", { length: 255 }),
  departHeure: time("depart_heure"),
  arriveeVille: varchar("arrivee_ville", { length: 255 }),
  arriveeHeure: time("arrivee_heure"),

  // Besoin
  besoin: besoinEnum("besoin"),

  // Voyageurs — si exact, min = max
  voyageursMin: integer("voyageurs_min"),
  voyageursMax: integer("voyageurs_max"),
});
