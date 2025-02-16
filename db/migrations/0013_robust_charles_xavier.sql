ALTER TABLE "user_permissions" ALTER COLUMN "user_id" SET DATA TYPE varchar(26);--> statement-breakpoint
ALTER TABLE "user_permissions" ALTER COLUMN "permission_id" SET DATA TYPE varchar(26);--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "id" SET DATA TYPE varchar(26);--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ALTER COLUMN "id" SET DATA TYPE varchar(26);--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ALTER COLUMN "user_id" SET DATA TYPE varchar(26);--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ALTER COLUMN "id" SET DATA TYPE varchar(26);--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ALTER COLUMN "user_id" SET DATA TYPE varchar(26);--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "id" SET DATA TYPE varchar(26);--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "user_id" SET DATA TYPE varchar(26);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE varchar(26);