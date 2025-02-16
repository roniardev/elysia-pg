ALTER TABLE "users" DROP CONSTRAINT "users_session_id_unique";--> statement-breakpoint
DROP INDEX "users_session_idx";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "session_id";