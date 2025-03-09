ALTER TABLE "email_verification_tokens" ALTER COLUMN "expires_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ALTER COLUMN "verified_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ALTER COLUMN "expires_at" SET DATA TYPE timestamp;