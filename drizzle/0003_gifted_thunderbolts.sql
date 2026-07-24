CREATE TABLE `agent_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
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
CREATE UNIQUE INDEX `agent_messages_thread_idempotency_unique` ON `agent_messages` (`thread_id`,`idempotency_key`,`role`);--> statement-breakpoint
CREATE TABLE `agent_threads` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text DEFAULT '新的思考' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `agent_threads_user_updated_idx` ON `agent_threads` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `memory_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`context_label` text NOT NULL,
	`content` text NOT NULL,
	`source_type` text NOT NULL,
	`source_id` text NOT NULL,
	`salience` integer DEFAULT 50 NOT NULL,
	`last_used_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `memory_items_source_unique` ON `memory_items` (`user_id`,`source_type`,`source_id`);--> statement-breakpoint
CREATE INDEX `memory_items_user_updated_idx` ON `memory_items` (`user_id`,`updated_at`);--> statement-breakpoint
INSERT OR IGNORE INTO `memory_items`
  (`id`, `user_id`, `kind`, `context_label`, `content`, `source_type`, `source_id`, `salience`, `last_used_at`, `created_at`, `updated_at`, `deleted_at`)
SELECT
  'backfill-project-' || p.id,
  p.user_id,
  'project',
  '实践项目：' || p.title,
  '真实处境：' || p.context || char(10) || '希望改变的结果：' || p.goal,
  'practice_project',
  p.id,
  90,
  NULL,
  p.created_at,
  p.updated_at,
  NULL
FROM practice_projects p
WHERE p.deleted_at IS NULL;--> statement-breakpoint
INSERT OR IGNORE INTO `memory_items`
  (`id`, `user_id`, `kind`, `context_label`, `content`, `source_type`, `source_id`, `salience`, `last_used_at`, `created_at`, `updated_at`, `deleted_at`)
SELECT
  'backfill-learning-' || m.id,
  s.user_id,
  'learning',
  s.node_slug,
  m.content,
  'learning_message',
  m.id,
  60,
  NULL,
  m.created_at,
  m.updated_at,
  NULL
FROM messages m
JOIN learning_sessions s ON s.id = m.session_id
WHERE m.role = 'user'
  AND m.deleted_at IS NULL
  AND s.user_id IS NOT NULL
  AND s.deleted_at IS NULL;
