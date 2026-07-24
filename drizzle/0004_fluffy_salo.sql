CREATE TABLE `auth_rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`subject_hash` text NOT NULL,
	`window_key` text NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_rate_limits_subject_window_unique` ON `auth_rate_limits` (`action`,`subject_hash`,`window_key`);--> statement-breakpoint
ALTER TABLE `users` ADD `password_iterations` integer DEFAULT 100000 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `password_algorithm` text DEFAULT 'pbkdf2-sha256' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `status` text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `email_verified_at` text;--> statement-breakpoint
ALTER TABLE `users` ADD `last_login_at` text;