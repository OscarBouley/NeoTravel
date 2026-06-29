DROP INDEX "prospects_email_idx";--> statement-breakpoint
ALTER TABLE "prospects" ALTER COLUMN "email" DROP NOT NULL;