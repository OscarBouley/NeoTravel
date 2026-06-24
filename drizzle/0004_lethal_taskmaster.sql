CREATE TABLE "devis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lead_id" uuid NOT NULL,
	"reference" varchar(50) NOT NULL,
	"distance_km" integer NOT NULL,
	"prix_ht" numeric(10, 2) NOT NULL,
	"prix_ttc" numeric(10, 2) NOT NULL,
	"coeff_saison" numeric(5, 4),
	"coeff_date" numeric(5, 4),
	"coeff_capacite" numeric(5, 4),
	"marge" numeric(5, 4),
	"envoye_le" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "devis" ADD CONSTRAINT "devis_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;