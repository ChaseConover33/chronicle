import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const entries = sqliteTable(
  "entries",
  {
    id: text("id").primaryKey(),
    date: text("date").notNull(),
    type: text("type", {
      enum: [
        "daily",
        "retrospective",
        "weekly",
        "monthly",
        "yearly",
        "decade",
        "goal_reflection",
      ],
    }).notNull(),
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    template: text("template"),
    rawText: text("raw_text"),
    formattedContent: text("formatted_content"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    publishedAt: text("published_at"),
  },
  (t) => [
    index("idx_entries_date").on(t.date),
    index("idx_entries_type").on(t.type),
    index("idx_entries_status").on(t.status),
  ],
);

export const domains = sqliteTable("domains", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon"),
  color: text("color"),
  isBuiltin: integer("is_builtin", { mode: "boolean" })
    .notNull()
    .default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const entryDomains = sqliteTable(
  "entry_domains",
  {
    entryId: text("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    domainId: text("domain_id")
      .notNull()
      .references(() => domains.id, { onDelete: "cascade" }),
  },
  (t) => [index("idx_entry_domains_pk").on(t.entryId, t.domainId)],
);

export const tags = sqliteTable(
  "tags",
  {
    id: text("id").primaryKey(),
    entryId: text("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
  },
  (t) => [index("idx_tags_entry").on(t.entryId), index("idx_tags_name").on(t.name)],
);

export const links = sqliteTable("links", {
  id: text("id").primaryKey(),
  entryId: text("entry_id")
    .notNull()
    .references(() => entries.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url").notNull(),
  note: text("note"),
});

export const relations = sqliteTable(
  "relations",
  {
    id: text("id").primaryKey(),
    sourceEntryId: text("source_entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    targetEntryId: text("target_entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    relationType: text("relation_type", {
      enum: [
        "similar_challenge",
        "growth_from",
        "pattern",
        "user_linked",
        "ai_suggested",
      ],
    }).notNull(),
    description: text("description"),
  },
  (t) => [
    index("idx_relations_source").on(t.sourceEntryId),
    index("idx_relations_target").on(t.targetEntryId),
  ],
);

export const lenses = sqliteTable("lenses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  analysisQuestions: text("analysis_questions", { mode: "json" })
    .notNull()
    .$type<string[]>(),
  summaryFocus: text("summary_focus", { mode: "json" })
    .notNull()
    .$type<string[]>(),
  isBuiltin: integer("is_builtin", { mode: "boolean" })
    .notNull()
    .default(false),
  active: integer("active", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const lensReflections = sqliteTable(
  "lens_reflections",
  {
    id: text("id").primaryKey(),
    entryId: text("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    lensId: text("lens_id")
      .notNull()
      .references(() => lenses.id, { onDelete: "cascade" }),
    reflection: text("reflection").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    index("idx_reflections_entry").on(t.entryId),
    index("idx_reflections_lens").on(t.lensId),
  ],
);

export const lensPeriodReflections = sqliteTable(
  "lens_period_reflections",
  {
    id: text("id").primaryKey(),
    lensId: text("lens_id")
      .notNull()
      .references(() => lenses.id, { onDelete: "cascade" }),
    period: text("period", { enum: ["weekly", "monthly", "yearly"] }).notNull(),
    rangeFrom: text("range_from").notNull(),
    rangeTo: text("range_to").notNull(),
    reflection: text("reflection").notNull(),
    modelId: text("model_id"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    index("idx_lens_period_lens").on(t.lensId),
    index("idx_lens_period_range").on(t.lensId, t.rangeFrom, t.rangeTo),
  ],
);

export const goals = sqliteTable("goals", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  lensId: text("lens_id").references(() => lenses.id),
  domainId: text("domain_id").references(() => domains.id),
  targetDate: text("target_date"),
  status: text("status", {
    enum: ["active", "achieved", "paused", "abandoned"],
  })
    .notNull()
    .default("active"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const entryGoals = sqliteTable(
  "entry_goals",
  {
    entryId: text("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    goalId: text("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
  },
  (t) => [index("idx_entry_goals_pk").on(t.entryId, t.goalId)],
);

export const goalProgress = sqliteTable("goal_progress", {
  id: text("id").primaryKey(),
  goalId: text("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  summaryEntryId: text("summary_entry_id").references(() => entries.id),
  rangeFrom: text("range_from"),
  rangeTo: text("range_to"),
  trajectory: text("trajectory", {
    enum: ["on_track", "at_risk", "off_track", "achieved", "abandoned"],
  }),
  assessment: text("assessment").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type TemplateSection = {
  id: string;
  heading: string;
  prompt: string;
  required: boolean;
};

export const templates = sqliteTable("templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sections: text("sections", { mode: "json" })
    .notNull()
    .$type<TemplateSection[]>(),
  isBuiltin: integer("is_builtin", { mode: "boolean" })
    .notNull()
    .default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const userSettings = sqliteTable("user_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
export type Domain = typeof domains.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type Lens = typeof lenses.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
export type GoalProgress = typeof goalProgress.$inferSelect;
