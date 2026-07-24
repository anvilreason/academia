CREATE TABLE `exam_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`session_id` text NOT NULL,
	`node_slug` text NOT NULL,
	`attempt_number` integer NOT NULL,
	`score` integer NOT NULL,
	`grade_point_hundredths` integer NOT NULL,
	`credits_attempted` integer NOT NULL,
	`credits_earned` integer NOT NULL,
	`passed` integer NOT NULL,
	`weak_topics_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `user_course_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`program_slug` text NOT NULL,
	`course_slug` text NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_course_plans_user_course_unique` ON `user_course_plans` (`user_id`,`course_slug`);--> statement-breakpoint
CREATE TABLE `user_programs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`program_slug` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_programs_user_program_unique` ON `user_programs` (`user_id`,`program_slug`);--> statement-breakpoint
CREATE TABLE `wallet_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`balance_fen` integer DEFAULT 0 NOT NULL,
	`completed_spend_fen` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wallet_accounts_user_unique` ON `wallet_accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `wallet_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`amount_fen` integer NOT NULL,
	`reference_id` text,
	`description` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wallet_transactions_completion_unique` ON `wallet_transactions` (`user_id`,`type`,`reference_id`);