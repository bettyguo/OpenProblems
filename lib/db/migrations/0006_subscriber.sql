CREATE TABLE `subscriber` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`status` text NOT NULL,
	`domainSubscriptions` text NOT NULL,
	`verificationToken` text,
	`verificationTokenExpiresAt` integer,
	`unsubscribeToken` text NOT NULL,
	`verifiedAt` integer,
	`unsubscribedAt` integer,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriber_email_idx` ON `subscriber` (`email`);--> statement-breakpoint
CREATE INDEX `subscriber_verification_token_idx` ON `subscriber` (`verificationToken`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscriber_unsubscribe_token_idx` ON `subscriber` (`unsubscribeToken`);