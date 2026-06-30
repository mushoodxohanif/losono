CREATE TABLE "tracking_rate_limits" (
	"agent_id" uuid NOT NULL,
	"visitor_id" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"event_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tracking_rate_limits_agent_id_visitor_id_pk" PRIMARY KEY("agent_id","visitor_id")
);
--> statement-breakpoint
ALTER TABLE "tracking_rate_limits" ADD CONSTRAINT "tracking_rate_limits_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tracking_rate_limits_updated_at_idx" ON "tracking_rate_limits" USING btree ("updated_at");