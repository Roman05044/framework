CREATE TABLE `devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`device` varchar(255) NOT NULL,
	`status` enum('on','off') DEFAULT 'off',
	`room` varchar(255) NOT NULL,
	`description` text,
	`image` varchar(255),
	CONSTRAINT `devices_id` PRIMARY KEY(`id`)
);
