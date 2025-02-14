ALTER TABLE "email_verification_codes" RENAME TO "email_verification_tokens";--> statement-breakpoint
ALTER TABLE "email_verification_tokens" RENAME COLUMN "code" TO "hashed_token";--> statement-breakpoint
ALTER TABLE "email_verification_tokens" DROP CONSTRAINT "email_verification_codes_user_id_unique";--> statement-breakpoint
ALTER TABLE "email_verification_tokens" DROP CONSTRAINT "email_verification_codes_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_unique" UNIQUE("user_id");--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_hashed_token_unique" UNIQUE("hashed_token");