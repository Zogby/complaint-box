CREATE TABLE `likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userType` enum('citizen','employee') NOT NULL,
	`ipAddress` varchar(45) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `likes_id` PRIMARY KEY(`id`)
);
