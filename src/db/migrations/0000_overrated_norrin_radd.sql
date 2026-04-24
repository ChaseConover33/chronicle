CREATE TABLE `domains` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`color` text,
	`is_builtin` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `domains_name_unique` ON `domains` (`name`);--> statement-breakpoint
CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`template` text,
	`raw_text` text,
	`formatted_content` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`published_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_entries_date` ON `entries` (`date`);--> statement-breakpoint
CREATE INDEX `idx_entries_type` ON `entries` (`type`);--> statement-breakpoint
CREATE INDEX `idx_entries_status` ON `entries` (`status`);--> statement-breakpoint
CREATE TABLE `entry_domains` (
	`entry_id` text NOT NULL,
	`domain_id` text NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_entry_domains_pk` ON `entry_domains` (`entry_id`,`domain_id`);--> statement-breakpoint
CREATE TABLE `goal_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_id` text NOT NULL,
	`summary_entry_id` text,
	`assessment` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`summary_entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`lens_id` text,
	`domain_id` text,
	`target_date` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`lens_id`) REFERENCES `lenses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lens_reflections` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`lens_id` text NOT NULL,
	`reflection` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lens_id`) REFERENCES `lenses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_reflections_entry` ON `lens_reflections` (`entry_id`);--> statement-breakpoint
CREATE INDEX `idx_reflections_lens` ON `lens_reflections` (`lens_id`);--> statement-breakpoint
CREATE TABLE `lenses` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`system_prompt` text NOT NULL,
	`analysis_questions` text NOT NULL,
	`summary_focus` text NOT NULL,
	`is_builtin` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `links` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`note` text,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `relations` (
	`id` text PRIMARY KEY NOT NULL,
	`source_entry_id` text NOT NULL,
	`target_entry_id` text NOT NULL,
	`relation_type` text NOT NULL,
	`description` text,
	FOREIGN KEY (`source_entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_relations_source` ON `relations` (`source_entry_id`);--> statement-breakpoint
CREATE INDEX `idx_relations_target` ON `relations` (`target_entry_id`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_tags_entry` ON `tags` (`entry_id`);--> statement-breakpoint
CREATE INDEX `idx_tags_name` ON `tags` (`name`);--> statement-breakpoint
CREATE TABLE `templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`sections` text NOT NULL,
	`is_builtin` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
