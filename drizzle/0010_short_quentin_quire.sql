CREATE TABLE `artifact_shares` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`artifact_id` text NOT NULL,
	`enrollment_id` text NOT NULL,
	`public_slug` text NOT NULL,
	`share_title` text NOT NULL,
	`share_summary` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`published_at` text NOT NULL,
	`revoked_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artifact_shares_artifact_unique` ON `artifact_shares` (`artifact_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `artifact_shares_public_slug_unique` ON `artifact_shares` (`public_slug`);--> statement-breakpoint
CREATE INDEX `artifact_shares_user_updated_idx` ON `artifact_shares` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `result_recognitions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`enrollment_id` text NOT NULL,
	`path_slug` text NOT NULL,
	`artifact_id` text NOT NULL,
	`course_slug` text NOT NULL,
	`program_slug` text NOT NULL,
	`capability_id` text NOT NULL,
	`scope` text DEFAULT 'practice' NOT NULL,
	`status` text DEFAULT 'validated' NOT NULL,
	`recognized_credits` integer NOT NULL,
	`graph_version` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `result_recognitions_user_enrollment_unique` ON `result_recognitions` (`user_id`,`enrollment_id`);--> statement-breakpoint
CREATE INDEX `result_recognitions_user_course_idx` ON `result_recognitions` (`user_id`,`course_slug`);