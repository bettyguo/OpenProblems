CREATE TABLE `ratingChallenge` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`problemSlug` text NOT NULL,
	`dimension` text NOT NULL,
	`proposedValue` text NOT NULL,
	`rationale` text NOT NULL,
	`status` text DEFAULT 'submitted' NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
