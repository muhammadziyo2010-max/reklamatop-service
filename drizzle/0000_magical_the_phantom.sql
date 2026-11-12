CREATE TABLE `ads` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`city` text NOT NULL,
	`district` text NOT NULL,
	`phone` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`created_at` integer NOT NULL,
	`delete_hash` text NOT NULL
);
