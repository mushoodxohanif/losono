import type { AdapterAccountType } from "@auth/core/adapters";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { vector } from "./vector";

// --- Auth.js (NextAuth v5) tables ---

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ],
);

// --- Billing ---

export type SubscriptionPlan = "free" | "pro";
export type SubscriptionStatus = "active" | "canceled" | "past_due";

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    plan: text("plan").$type<SubscriptionPlan>().notNull().default("free"),
    agentLimit: integer("agent_limit").notNull().default(1),
    voiceEnabled: boolean("voice_enabled").notNull().default(false),
    status: text("status")
      .$type<SubscriptionStatus>()
      .notNull()
      .default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("subscriptions_user_id_idx").on(table.userId),
    index("subscriptions_stripe_customer_id_idx").on(table.stripeCustomerId),
    index("subscriptions_stripe_subscription_id_idx").on(
      table.stripeSubscriptionId,
    ),
  ],
);

// --- Agents ---

export type AgentStatus = "draft" | "published";

import type { PreChatField, PreChatFormConfig } from "@/lib/pre-chat-form";
import type { WidgetTheme } from "@/lib/widget-theme";

export type VoiceGender = "male" | "female";

export type AgentSettings = {
  voicePersona?: string;
  voiceGender?: VoiceGender;
  language?: string;
  temperature?: number;
  widgetTheme?: WidgetTheme;
  allowedOrigins?: string[];
  preChatForm?: PreChatFormConfig;
};

export const agents = pgTable(
  "agents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    userPrompt: text("user_prompt").notNull().default(""),
    status: text("status").$type<AgentStatus>().notNull().default("draft"),
    voiceEnabled: boolean("voice_enabled").notNull().default(false),
    settings: jsonb("settings").$type<AgentSettings>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("agents_slug_idx").on(table.slug),
    index("agents_user_id_idx").on(table.userId),
  ],
);

// --- Context / RAG ---

export const contextSources = pgTable(
  "context_sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    chunkCount: integer("chunk_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("context_sources_agent_id_idx").on(table.agentId)],
);

export const documentChunks = pgTable(
  "document_chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    documentId: uuid("document_id")
      .notNull()
      .references(() => contextSources.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    embedding: vector("embedding", { dimensions: 768 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("document_chunks_agent_id_idx").on(table.agentId),
    index("document_chunks_document_id_idx").on(table.documentId),
    index("document_chunks_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);

// --- Conversations ---

export type ConversationMode = "chat" | "voice" | "playground";
export type MessageRole = "user" | "assistant" | "system";

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    mode: text("mode").$type<ConversationMode>().notNull(),
    sessionId: text("session_id"),
    visitorId: text("visitor_id"),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("conversations_agent_id_idx").on(table.agentId)],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role").$type<MessageRole>().notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("messages_conversation_id_idx").on(table.conversationId)],
);

// --- External forms & tracking ---

export type TrackingSessionSummary = {
  lastEvent?: { name: string; at: string };
  eventCounts?: Record<string, number>;
};

export const externalForms = pgTable(
  "external_forms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    fields: jsonb("fields").$type<PreChatField[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("external_forms_agent_slug_idx").on(table.agentId, table.slug),
    index("external_forms_agent_id_idx").on(table.agentId),
  ],
);

export const externalFormSubmissions = pgTable(
  "external_form_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    formId: uuid("form_id").references(() => externalForms.id, {
      onDelete: "set null",
    }),
    visitorId: text("visitor_id").notNull(),
    responses: jsonb("responses").$type<Record<string, string>>().notNull(),
    pageUrl: text("page_url"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("external_form_submissions_agent_id_idx").on(table.agentId),
    index("external_form_submissions_form_id_idx").on(table.formId),
    index("external_form_submissions_created_at_idx").on(table.createdAt),
  ],
);

export const trackingSessions = pgTable(
  "tracking_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    lastActivityAt: timestamp("last_activity_at", {
      withTimezone: true,
    }).notNull(),
    landingPage: text("landing_page"),
    referrer: text("referrer"),
    eventCount: integer("event_count").notNull().default(0),
    summary: jsonb("summary").$type<TrackingSessionSummary>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("tracking_sessions_agent_id_idx").on(table.agentId),
    index("tracking_sessions_last_activity_at_idx").on(table.lastActivityAt),
    index("tracking_sessions_agent_visitor_idx").on(
      table.agentId,
      table.visitorId,
    ),
  ],
);

export const trackingEvents = pgTable(
  "tracking_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => trackingSessions.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").notNull(),
    eventName: text("event_name").notNull(),
    properties: jsonb("properties").$type<Record<string, unknown>>(),
    pageUrl: text("page_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("tracking_events_session_id_idx").on(table.sessionId),
    index("tracking_events_agent_id_idx").on(table.agentId),
    index("tracking_events_created_at_idx").on(table.createdAt),
  ],
);

export const trackingRateLimits = pgTable(
  "tracking_rate_limits",
  {
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    eventCount: integer("event_count").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.agentId, table.visitorId] }),
    index("tracking_rate_limits_updated_at_idx").on(table.updatedAt),
  ],
);

// --- Pre-chat form submissions ---

export const formSubmissions = pgTable(
  "form_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").notNull(),
    responses: jsonb("responses").$type<Record<string, string>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("form_submissions_agent_id_idx").on(table.agentId),
    uniqueIndex("form_submissions_agent_visitor_idx").on(
      table.agentId,
      table.visitorId,
    ),
  ],
);

// --- CRM integrations (Sales CRM) ---

export type CrmProvider = "sales-crm";

export type CrmFieldMapping = Record<string, string>;

export type CrmExportStatus = "pending" | "success" | "failed" | "skipped";

export type CrmLeadSource = "pre_chat" | "external_form" | "session";

export const crmIntegrations = pgTable(
  "crm_integrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").$type<CrmProvider>().notNull(),
    salesCrmBaseUrl: text("sales_crm_base_url"),
    accessTokenEncrypted: text("access_token_encrypted"),
    refreshTokenEncrypted: text("refresh_token_encrypted"),
    tokenExpiresAt: timestamp("token_expires_at", {
      withTimezone: true,
    }),
    campaignId: text("campaign_id"),
    campaignName: text("campaign_name"),
    syncEnabled: boolean("sync_enabled").notNull().default(true),
    connectedAt: timestamp("connected_at", { withTimezone: true }),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("crm_integrations_user_provider_idx").on(
      table.userId,
      table.provider,
    ),
    index("crm_integrations_user_id_idx").on(table.userId),
  ],
);

export const crmFieldMappings = pgTable(
  "crm_field_mappings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    integrationId: uuid("integration_id")
      .notNull()
      .references(() => crmIntegrations.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    mapping: jsonb("mapping").$type<CrmFieldMapping>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("crm_field_mappings_integration_agent_idx").on(
      table.integrationId,
      table.agentId,
    ),
    index("crm_field_mappings_agent_id_idx").on(table.agentId),
  ],
);

export const crmExportLog = pgTable(
  "crm_export_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    submissionId: uuid("submission_id").references(() => formSubmissions.id, {
      onDelete: "cascade",
    }),
    leadSource: text("lead_source").$type<CrmLeadSource>().notNull(),
    leadSourceId: uuid("lead_source_id").notNull(),
    integrationId: uuid("integration_id")
      .notNull()
      .references(() => crmIntegrations.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    crmLeadId: text("crm_lead_id"),
    status: text("status").$type<CrmExportStatus>().notNull(),
    error: text("error"),
    exportedAt: timestamp("exported_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("crm_export_log_lead_source_idx").on(
      table.leadSource,
      table.leadSourceId,
      table.integrationId,
    ),
    index("crm_export_log_integration_id_idx").on(table.integrationId),
    index("crm_export_log_agent_id_idx").on(table.agentId),
    index("crm_export_log_status_idx").on(table.status),
    index("crm_export_log_submission_id_idx").on(table.submissionId),
  ],
);

// --- API keys ---

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    keyHash: text("key_hash").notNull(),
    name: text("name").notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("api_keys_agent_id_idx").on(table.agentId)],
);

// --- Usage ---

export type UsageEventType = "chat_message" | "voice_minute" | "embedding";

export const usageEvents = pgTable(
  "usage_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    eventType: text("event_type").$type<UsageEventType>().notNull(),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("usage_events_agent_id_idx").on(table.agentId),
    index("usage_events_created_at_idx").on(table.createdAt),
  ],
);

export type User = typeof users.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type ContextSource = typeof contextSources.$inferSelect;
export type NewContextSource = typeof contextSources.$inferInsert;
export type DocumentChunk = typeof documentChunks.$inferSelect;
export type NewDocumentChunk = typeof documentChunks.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type ExternalForm = typeof externalForms.$inferSelect;
export type NewExternalForm = typeof externalForms.$inferInsert;
export type ExternalFormSubmission =
  typeof externalFormSubmissions.$inferSelect;
export type NewExternalFormSubmission =
  typeof externalFormSubmissions.$inferInsert;
export type TrackingSession = typeof trackingSessions.$inferSelect;
export type NewTrackingSession = typeof trackingSessions.$inferInsert;
export type TrackingEvent = typeof trackingEvents.$inferSelect;
export type NewTrackingEvent = typeof trackingEvents.$inferInsert;
export type FormSubmission = typeof formSubmissions.$inferSelect;
export type NewFormSubmission = typeof formSubmissions.$inferInsert;
export type CrmIntegration = typeof crmIntegrations.$inferSelect;
export type NewCrmIntegration = typeof crmIntegrations.$inferInsert;
export type CrmFieldMappingRow = typeof crmFieldMappings.$inferSelect;
export type NewCrmFieldMappingRow = typeof crmFieldMappings.$inferInsert;
export type CrmExportLogEntry = typeof crmExportLog.$inferSelect;
export type NewCrmExportLogEntry = typeof crmExportLog.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type UsageEvent = typeof usageEvents.$inferSelect;
export type NewUsageEvent = typeof usageEvents.$inferInsert;
