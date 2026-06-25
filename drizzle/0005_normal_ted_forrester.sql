CREATE TABLE "relances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"devis_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"envoye_le" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "relances" ADD CONSTRAINT "relances_devis_id_devis_id_fk" FOREIGN KEY ("devis_id") REFERENCES "public"."devis"("id") ON DELETE no action ON UPDATE no action;