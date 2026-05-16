CREATE TABLE `watchlist` (
	`userId` text NOT NULL,
	`problemSlug` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`userId`, `problemSlug`),
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
