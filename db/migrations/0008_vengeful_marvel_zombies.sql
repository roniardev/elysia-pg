ALTER TABLE "user_permissions" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD COLUMN "revoked" boolean DEFAULT false NOT NULL;