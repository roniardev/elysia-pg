ALTER TABLE "scope_user_permissions" RENAME COLUMN "permission_id" TO "user_permission_id";--> statement-breakpoint
ALTER TABLE "scope_user_permissions" DROP CONSTRAINT "scope_user_permissions_permission_id_permissions_id_fk";
--> statement-breakpoint
ALTER TABLE "scope_user_permissions" DROP CONSTRAINT "scope_user_permissions_scope_id_permission_id_pk";--> statement-breakpoint
ALTER TABLE "scope_user_permissions" ADD CONSTRAINT "scope_user_permissions_scope_id_user_permission_id_pk" PRIMARY KEY("scope_id","user_permission_id");--> statement-breakpoint
ALTER TABLE "user_permissions" ADD COLUMN "id" varchar(26) PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "scope_user_permissions" ADD COLUMN "id" varchar(26) PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "scope_user_permissions" ADD CONSTRAINT "scope_user_permissions_user_permission_id_user_permissions_id_fk" FOREIGN KEY ("user_permission_id") REFERENCES "public"."user_permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" DROP COLUMN "scope";