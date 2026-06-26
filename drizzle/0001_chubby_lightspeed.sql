CREATE TYPE "public"."besoin" AS ENUM('aller_simple', 'aller_retour', 'circuit');--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'Nouvelle demande';--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "prenom" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "telephone" varchar(20);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "societe" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "depart_ville" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "depart_heure" time;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "arrivee_ville" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "arrivee_heure" time;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "besoin" "besoin";--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "voyageurs_min" integer;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "voyageurs_max" integer;