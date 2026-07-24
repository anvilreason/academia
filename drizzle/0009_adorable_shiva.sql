CREATE TABLE `answer_path_artifacts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`enrollment_id` text NOT NULL,
	`title` text NOT NULL,
	`artifact_type` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`content` text NOT NULL,
	`user_contribution` text NOT NULL,
	`agent_contribution` text NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `answer_path_artifacts_enrollment_version_unique` ON `answer_path_artifacts` (`enrollment_id`,`version`);--> statement-breakpoint
CREATE TABLE `answer_path_enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`path_slug` text NOT NULL,
	`path_version` text NOT NULL,
	`content_version` text NOT NULL,
	`evaluation_version` text NOT NULL,
	`current_step` text DEFAULT 'baseline' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`outcome_status` text,
	`started_at` text NOT NULL,
	`completed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `answer_path_enrollments_user_path_unique` ON `answer_path_enrollments` (`user_id`,`path_slug`);--> statement-breakpoint
CREATE INDEX `answer_path_enrollments_user_updated_idx` ON `answer_path_enrollments` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `baseline_diagnoses` (
	`id` text PRIMARY KEY NOT NULL,
	`enrollment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`project_title` text NOT NULL,
	`idea_summary` text NOT NULL,
	`target_user` text NOT NULL,
	`current_evidence` text NOT NULL,
	`biggest_uncertainty` text NOT NULL,
	`confidence` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `baseline_diagnoses_enrollment_unique` ON `baseline_diagnoses` (`enrollment_id`);--> statement-breakpoint
CREATE TABLE `capability_evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`enrollment_id` text NOT NULL,
	`capability_id` text NOT NULL,
	`level` integer NOT NULL,
	`source_type` text NOT NULL,
	`source_id` text NOT NULL,
	`confidence` integer NOT NULL,
	`verified_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `capability_evidence_source_unique` ON `capability_evidence` (`user_id`,`capability_id`,`source_type`,`source_id`);--> statement-breakpoint
CREATE TABLE `evidence_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`enrollment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`step_key` text NOT NULL,
	`evidence_type` text NOT NULL,
	`subject_label` text NOT NULL,
	`content` text NOT NULL,
	`provenance` text NOT NULL,
	`observed_at` text,
	`verification_status` text DEFAULT 'user_attested' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `evidence_submissions_enrollment_created_idx` ON `evidence_submissions` (`enrollment_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `real_world_outcomes` (
	`id` text PRIMARY KEY NOT NULL,
	`enrollment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`decision` text NOT NULL,
	`observed_result` text NOT NULL,
	`next_action` text NOT NULL,
	`uncertainty` text NOT NULL,
	`happened_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `real_world_outcomes_enrollment_unique` ON `real_world_outcomes` (`enrollment_id`);--> statement-breakpoint
CREATE TABLE `rubric_evaluations` (
	`id` text PRIMARY KEY NOT NULL,
	`enrollment_id` text NOT NULL,
	`artifact_id` text NOT NULL,
	`rubric_version` text NOT NULL,
	`evaluator_type` text DEFAULT 'agent' NOT NULL,
	`score_detail_json` text NOT NULL,
	`strengths` text NOT NULL,
	`weaknesses` text NOT NULL,
	`feedback` text NOT NULL,
	`required_revision` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `rubric_evaluations_enrollment_created_idx` ON `rubric_evaluations` (`enrollment_id`,`created_at`);