ALTER TABLE `ratingChallenge` ADD `reviewedAt` integer;--> statement-breakpoint
ALTER TABLE `ratingChallenge` ADD `reviewerId` text REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null;--> statement-breakpoint
ALTER TABLE `ratingChallenge` ADD `reviewNotes` text;--> statement-breakpoint
ALTER TABLE `ratingChallenge` ADD `acceptedActionId` text;