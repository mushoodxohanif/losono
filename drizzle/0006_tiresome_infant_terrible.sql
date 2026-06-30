CREATE TABLE "external_form_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"form_id" uuid,
	"visitor_id" text NOT NULL,
	"responses" jsonb NOT NULL,
	"page_url" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracking_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"visitor_id" text NOT NULL,
	"event_name" text NOT NULL,
	"properties" jsonb,
	"page_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracking_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"visitor_id" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"last_activity_at" timestamp with time zone NOT NULL,
	"landing_page" text,
	"referrer" text,
	"event_count" integer DEFAULT 0 NOT NULL,
	"summary" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "crm_export_log_submission_integration_idx";--> statement-breakpoint
ALTER TABLE "crm_export_log" ALTER COLUMN "submission_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "crm_export_log" ADD COLUMN "lead_source" text;--> statement-breakpoint
ALTER TABLE "crm_export_log" ADD COLUMN "lead_source_id" uuid;--> statement-breakpoint
UPDATE "crm_export_log" SET "lead_source" = 'pre_chat', "lead_source_id" = "submission_id" WHERE "lead_source" IS NULL;--> statement-breakpoint
ALTER TABLE "crm_export_log" ALTER COLUMN "lead_source" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "crm_export_log" ALTER COLUMN "lead_source_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "external_form_submissions" ADD CONSTRAINT "external_form_submissions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_form_submissions" ADD CONSTRAINT "external_form_submissions_form_id_external_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."external_forms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_forms" ADD CONSTRAINT "external_forms_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_session_id_tracking_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."tracking_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_sessions" ADD CONSTRAINT "tracking_sessions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "external_form_submissions_agent_id_idx" ON "external_form_submissions" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "external_form_submissions_form_id_idx" ON "external_form_submissions" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "external_form_submissions_created_at_idx" ON "external_form_submissions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "external_forms_agent_slug_idx" ON "external_forms" USING btree ("agent_id","slug");--> statement-breakpoint
CREATE INDEX "external_forms_agent_id_idx" ON "external_forms" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "tracking_events_session_id_idx" ON "tracking_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "tracking_events_agent_id_idx" ON "tracking_events" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "tracking_events_created_at_idx" ON "tracking_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tracking_sessions_agent_id_idx" ON "tracking_sessions" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "tracking_sessions_last_activity_at_idx" ON "tracking_sessions" USING btree ("last_activity_at");--> statement-breakpoint
CREATE INDEX "tracking_sessions_agent_visitor_idx" ON "tracking_sessions" USING btree ("agent_id","visitor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_export_log_lead_source_idx" ON "crm_export_log" USING btree ("lead_source","lead_source_id","integration_id");--> statement-breakpoint
CREATE INDEX "crm_export_log_submission_id_idx" ON "crm_export_log" USING btree ("submission_id");