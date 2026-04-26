CREATE TABLE `entry_goals` (
	`entry_id` text NOT NULL,
	`goal_id` text NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_entry_goals_pk` ON `entry_goals` (`entry_id`,`goal_id`);
