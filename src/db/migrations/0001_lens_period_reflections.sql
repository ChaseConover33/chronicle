CREATE TABLE `lens_period_reflections` (
	`id` text PRIMARY KEY NOT NULL,
	`lens_id` text NOT NULL,
	`period` text NOT NULL,
	`range_from` text NOT NULL,
	`range_to` text NOT NULL,
	`reflection` text NOT NULL,
	`model_id` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`lens_id`) REFERENCES `lenses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_lens_period_lens` ON `lens_period_reflections` (`lens_id`);
--> statement-breakpoint
CREATE INDEX `idx_lens_period_range` ON `lens_period_reflections` (`lens_id`,`range_from`,`range_to`);
