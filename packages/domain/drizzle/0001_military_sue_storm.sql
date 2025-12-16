CREATE TABLE "rss_feed_import_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feed_id" uuid NOT NULL,
	"import_date" timestamp DEFAULT now() NOT NULL,
	"item_count" integer NOT NULL,
	"status" varchar(50) NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "rss_feed_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feed_id" uuid NOT NULL,
	"guid" text NOT NULL,
	"title" varchar(500) NOT NULL,
	"link" text NOT NULL,
	"summary" text,
	"content" text,
	"image_url" text,
	"pub_date" timestamp,
	"read" boolean DEFAULT false NOT NULL,
	"clicked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rss_feeds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"feed_url" text NOT NULL,
	"site_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rss_feed_import_history" ADD CONSTRAINT "rss_feed_import_history_feed_id_rss_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."rss_feeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rss_feed_items" ADD CONSTRAINT "rss_feed_items_feed_id_rss_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."rss_feeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rss_feeds" ADD CONSTRAINT "rss_feeds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rss_feed_import_history_feed_id_idx" ON "rss_feed_import_history" USING btree ("feed_id");--> statement-breakpoint
CREATE INDEX "rss_feed_import_history_import_date_idx" ON "rss_feed_import_history" USING btree ("import_date");--> statement-breakpoint
CREATE INDEX "rss_feed_items_feed_id_idx" ON "rss_feed_items" USING btree ("feed_id");--> statement-breakpoint
CREATE INDEX "rss_feed_items_pub_date_idx" ON "rss_feed_items" USING btree ("pub_date");--> statement-breakpoint
CREATE INDEX "rss_feed_items_feed_guid_idx" ON "rss_feed_items" USING btree ("feed_id","guid");--> statement-breakpoint
CREATE INDEX "rss_feeds_user_id_idx" ON "rss_feeds" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "rss_feeds_feed_url_idx" ON "rss_feeds" USING btree ("feed_url");