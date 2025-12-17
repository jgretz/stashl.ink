CREATE TABLE "email_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email_message_id" text NOT NULL,
	"email_from" varchar(255) NOT NULL,
	"link" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"clicked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_integration_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_filter" varchar(500);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gmail_access_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gmail_refresh_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gmail_token_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "email_items" ADD CONSTRAINT "email_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_items_user_id_idx" ON "email_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_items_created_at_idx" ON "email_items" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "email_items_user_message_link_idx" ON "email_items" USING btree ("user_id","email_message_id","link");