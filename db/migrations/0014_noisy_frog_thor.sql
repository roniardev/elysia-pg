CREATE TABLE "scopes" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "scope_user_permissions" (
	"scope_id" varchar(26) NOT NULL,
	"permission_id" varchar(26) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"scope" varchar(10) DEFAULT 'personal' NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	CONSTRAINT "scope_user_permissions_scope_id_permission_id_pk" PRIMARY KEY("scope_id","permission_id")
);
--> statement-breakpoint
ALTER TABLE "user_permissions" ADD COLUMN "scope" varchar(10) DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE "scope_user_permissions" ADD CONSTRAINT "scope_user_permissions_scope_id_scopes_id_fk" FOREIGN KEY ("scope_id") REFERENCES "public"."scopes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scope_user_permissions" ADD CONSTRAINT "scope_user_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;