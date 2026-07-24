ALTER TABLE `orders` ADD `payment_mode` text DEFAULT 'test' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `refunded_at` text;