ALTER TABLE "email_verification_tokens" DROP CONSTRAINT "email_verification_tokens_user_id_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
DROP INDEX "post_created_at_idx";--> statement-breakpoint
UPDATE "users" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;--> statement-breakpoint
UPDATE "permissions" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;--> statement-breakpoint
UPDATE "scopes" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;--> statement-breakpoint
UPDATE "posts" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;--> statement-breakpoint
UPDATE "user_permissions" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;--> statement-breakpoint
UPDATE "scope_user_permissions" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_permissions" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_permissions" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "scopes" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "scopes" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "scope_user_permissions" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "scope_user_permissions" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "verification_code_active_lookup_idx" ON "email_verification_tokens" USING btree ("user_id","expires_at") WHERE "email_verification_tokens"."revoked" = false AND "email_verification_tokens"."verified_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "verification_code_active_user_unique" ON "email_verification_tokens" USING btree ("user_id") WHERE "email_verification_tokens"."revoked" = false AND "email_verification_tokens"."verified_at" IS NULL;--> statement-breakpoint
CREATE INDEX "password_token_active_lookup_idx" ON "password_reset_tokens" USING btree ("user_id","expires_at") WHERE "password_reset_tokens"."revoked" = false;--> statement-breakpoint
CREATE INDEX "posts_active_user_created_at_idx" ON "posts" USING btree ("user_id","created_at","id") WHERE "posts"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "posts_active_created_at_idx" ON "posts" USING btree ("created_at","id") WHERE "posts"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_active_email_lower_unique" ON "users" USING btree (lower("email")) WHERE "users"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "permissions_created_at_idx" ON "permissions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_active_name_unique" ON "permissions" USING btree ("name") WHERE "permissions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "user_permissions_user_idx" ON "user_permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_permissions_permission_idx" ON "user_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_permissions_active_unique" ON "user_permissions" USING btree ("user_id","permission_id") WHERE "user_permissions"."revoked" = false;--> statement-breakpoint
CREATE INDEX "scopes_created_at_idx" ON "scopes" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "scopes_active_name_unique" ON "scopes" USING btree ("name") WHERE "scopes"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "scope_user_permissions_scope_idx" ON "scope_user_permissions" USING btree ("scope_id");--> statement-breakpoint
CREATE INDEX "scope_user_permissions_assignment_idx" ON "scope_user_permissions" USING btree ("user_permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scope_user_permissions_active_unique" ON "scope_user_permissions" USING btree ("scope_id","user_permission_id") WHERE "scope_user_permissions"."revoked" = false;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_status_check" CHECK ("posts"."status" IN ('draft', 'published'));--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_visibility_check" CHECK ("posts"."visibility" IN ('public', 'private'));