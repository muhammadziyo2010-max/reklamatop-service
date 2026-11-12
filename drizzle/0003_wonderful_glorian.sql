CREATE TABLE `video_uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`ad_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`storage_key` text NOT NULL,
	`r2_id` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`received` integer NOT NULL,
	`parts` text NOT NULL,
	`status` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `ads` ADD `video_key` text;--> statement-breakpoint
ALTER TABLE `ads` ADD `video_type` text;--> statement-breakpoint
ALTER TABLE `ads` ADD `video_size` integer;