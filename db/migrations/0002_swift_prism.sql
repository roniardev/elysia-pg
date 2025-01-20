ALTER TABLE "refresh_token" ADD COLUMN "session_id" varchar(21) NOT NULL;--> statement-breakpoint
CREATE INDEX "refresh_token_session_idx" ON "refresh_token" USING btree ("session_id");