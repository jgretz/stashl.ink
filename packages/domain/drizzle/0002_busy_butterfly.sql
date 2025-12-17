CREATE TABLE "stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(100) NOT NULL,
	"stat_time" timestamp DEFAULT now() NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX "stats_type_idx" ON "stats" USING btree ("type");--> statement-breakpoint
CREATE INDEX "stats_type_time_idx" ON "stats" USING btree ("type","stat_time");