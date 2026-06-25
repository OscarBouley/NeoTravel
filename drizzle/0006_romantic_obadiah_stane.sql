ALTER TABLE "devis" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "devis" ADD COLUMN "ajustement_custom" numeric(5, 4);--> statement-breakpoint
ALTER TABLE "devis" ADD COLUMN "note_commercial" varchar(500);