CREATE TABLE "prospects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" varchar(255),
	"prenom" varchar(255),
	"email" varchar(255) NOT NULL,
	"telephone" varchar(20),
	"societe" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "prospect_id" uuid NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "prospects_email_idx" ON "prospects" USING btree ("email");--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" DROP COLUMN "nom";--> statement-breakpoint
ALTER TABLE "leads" DROP COLUMN "prenom";--> statement-breakpoint
ALTER TABLE "leads" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "leads" DROP COLUMN "telephone";--> statement-breakpoint
ALTER TABLE "leads" DROP COLUMN "societe";