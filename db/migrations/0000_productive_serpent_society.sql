CREATE TABLE "api_key" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"hashed_key" varchar(255) NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expired_at" timestamp,
	CONSTRAINT "api_key_hashed_key_unique" UNIQUE("hashed_key")
);
--> statement-breakpoint
CREATE TABLE "email_verification_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"email" varchar(255) NOT NULL,
	"code" varchar(8) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "email_verification_codes_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_token" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"hashed_token" varchar(255) NOT NULL,
	"session_id" varchar(21) NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_token_hashed_token_unique" UNIQUE("hashed_token")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"excerpt" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"status" varchar(10) DEFAULT 'draft' NOT NULL,
	"visibility" varchar(10) DEFAULT 'private' NOT NULL,
	"tags" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"hashed_password" varchar(255),
	"photo" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"session_id" varchar(21),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
ALTER TABLE "email_verification_codes" ADD CONSTRAINT "email_verification_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "verification_code_user_idx" ON "email_verification_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_code_email_idx" ON "email_verification_codes" USING btree ("email");--> statement-breakpoint
CREATE INDEX "password_token_user_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_token_session_idx" ON "refresh_token" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "post_user_idx" ON "posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "post_created_at_idx" ON "posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_session_idx" ON "users" USING btree ("session_id");