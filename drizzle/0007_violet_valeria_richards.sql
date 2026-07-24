CREATE TABLE `tracking_links` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`target_path` text NOT NULL,
	`source` text NOT NULL,
	`medium` text NOT NULL,
	`campaign` text NOT NULL,
	`owner_email` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tracking_links_code_unique` ON `tracking_links` (`code`);--> statement-breakpoint
CREATE INDEX `tracking_links_campaign_created_idx` ON `tracking_links` (`campaign`,`created_at`);--> statement-breakpoint
ALTER TABLE `analytics_events` ADD `tracking_link_id` text;--> statement-breakpoint
ALTER TABLE `analytics_events` ADD `acquisition_source` text;--> statement-breakpoint
ALTER TABLE `analytics_events` ADD `acquisition_medium` text;--> statement-breakpoint
ALTER TABLE `analytics_events` ADD `acquisition_campaign` text;--> statement-breakpoint
CREATE INDEX `analytics_events_campaign_time_idx` ON `analytics_events` (`acquisition_campaign`,`occurred_at`);