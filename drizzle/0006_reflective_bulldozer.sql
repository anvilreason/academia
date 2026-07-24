CREATE TABLE `admin_audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_email` text NOT NULL,
	`action` text NOT NULL,
	`resource_type` text,
	`resource_id` text,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `admin_audit_logs_email_time_idx` ON `admin_audit_logs` (`admin_email`,`created_at`);--> statement-breakpoint
CREATE TABLE `admin_members` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`email` text NOT NULL,
	`role` text DEFAULT 'viewer' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`last_access_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_members_email_unique` ON `admin_members` (`email`);--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_name` text NOT NULL,
	`schema_version` integer DEFAULT 1 NOT NULL,
	`date_key` text NOT NULL,
	`user_id` text,
	`guest_id` text,
	`analytics_session_id` text,
	`path` text,
	`referrer_host` text,
	`school_slug` text,
	`program_slug` text,
	`course_slug` text,
	`country` text,
	`region` text,
	`city` text,
	`timezone` text,
	`device_category` text,
	`engagement_ms` integer,
	`properties_json` text DEFAULT '{}' NOT NULL,
	`is_test` integer DEFAULT false NOT NULL,
	`occurred_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `analytics_events_date_name_idx` ON `analytics_events` (`date_key`,`event_name`);--> statement-breakpoint
CREATE INDEX `analytics_events_user_time_idx` ON `analytics_events` (`user_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `analytics_events_guest_time_idx` ON `analytics_events` (`guest_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `analytics_events_program_time_idx` ON `analytics_events` (`program_slug`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `analytics_identity_links` (
	`id` text PRIMARY KEY NOT NULL,
	`guest_id` text NOT NULL,
	`user_id` text NOT NULL,
	`linked_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `analytics_identity_guest_user_unique` ON `analytics_identity_links` (`guest_id`,`user_id`);