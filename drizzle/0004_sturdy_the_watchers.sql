CREATE TABLE `ad_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`ad_id` text,
	`author_id` text,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`ad_id`) REFERENCES `ads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `comments_ad_created_idx` ON `ad_comments` (`ad_id`,`created_at`,`id`);--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`ad_id` text,
	`buyer_id` text,
	`seller_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`ad_id`) REFERENCES `ads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `conversations_ad_buyer_idx` ON `conversations` (`ad_id`,`buyer_id`);--> statement-breakpoint
CREATE INDEX `conversations_buyer_updated_idx` ON `conversations` (`buyer_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `conversations_seller_updated_idx` ON `conversations` (`seller_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text,
	`author_id` text,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	`read_at` integer,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `messages_conversation_created_idx` ON `messages` (`conversation_id`,`created_at`,`id`);