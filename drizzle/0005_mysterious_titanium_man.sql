ALTER TABLE `user_course_plans` ADD `recognition_type` text;--> statement-breakpoint
ALTER TABLE `user_course_plans` ADD `source_course_slug` text;--> statement-breakpoint
ALTER TABLE `user_course_plans` ADD `recognized_credits` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_course_plans` ADD `remaining_credits` integer DEFAULT 0 NOT NULL;