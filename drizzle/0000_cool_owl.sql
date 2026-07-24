CREATE TABLE `daily_cost_quotas` (
	`id` text PRIMARY KEY NOT NULL,
	`date_key` text NOT NULL,
	`reserved_fen` integer DEFAULT 0 NOT NULL,
	`actual_fen` integer DEFAULT 0 NOT NULL,
	`limit_fen` integer DEFAULT 5000 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_cost_quotas_date_unique` ON `daily_cost_quotas` (`date_key`);--> statement-breakpoint
CREATE TABLE `guest_trial_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`guest_id` text NOT NULL,
	`date_key` text NOT NULL,
	`session_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guest_trial_usage_guest_date_unique` ON `guest_trial_usage` (`guest_id`,`date_key`);--> statement-breakpoint
CREATE TABLE `learning_nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`price_fen` integer DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learning_nodes_slug_unique` ON `learning_nodes` (`slug`);--> statement-breakpoint
CREATE TABLE `learning_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`session_id` text NOT NULL,
	`node_slug` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `learning_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`node_slug` text NOT NULL,
	`user_id` text,
	`guest_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`turn_count` integer DEFAULT 0 NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`prompt_version` text DEFAULT 'socratic-zh-v1' NOT NULL,
	`completed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `llm_call_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text,
	`user_id` text,
	`guest_id` text,
	`model_alias` text NOT NULL,
	`provider_model` text NOT NULL,
	`status` text NOT NULL,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`reserved_fen` integer DEFAULT 0 NOT NULL,
	`actual_fen` integer DEFAULT 0 NOT NULL,
	`error_code` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`idempotency_key` text,
	`input_tokens` integer,
	`output_tokens` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `messages_session_idempotency_unique` ON `messages` (`session_id`,`idempotency_key`,`role`);--> statement-breakpoint
CREATE TABLE `node_entitlements` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`node_slug` text NOT NULL,
	`source_order_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entitlements_user_node_unique` ON `node_entitlements` (`user_id`,`node_slug`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`node_slug` text NOT NULL,
	`amount_fen` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`idempotency_key` text NOT NULL,
	`confirmed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_user_idempotency_unique` ON `orders` (`user_id`,`idempotency_key`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`name` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);