CREATE TABLE `edges` (
	`id` text PRIMARY KEY NOT NULL,
	`workflowId` text NOT NULL,
	`source` text NOT NULL,
	`sourceHandle` text NOT NULL,
	`target` text NOT NULL,
	`targetHandle` text NOT NULL,
	`animated` integer NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`workflowId`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`source`) REFERENCES `nodes`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`target`) REFERENCES `nodes`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `environments` (
	`id` text PRIMARY KEY NOT NULL,
	`workflowId` text NOT NULL,
	`name` text NOT NULL,
	`env` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`workflowId`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`workflowId` text NOT NULL,
	`type` text NOT NULL,
	`data` text NOT NULL,
	`position` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`workflowId`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `workflowLogs` (
	`workflowRunId` text NOT NULL,
	`parallelIndex` integer NOT NULL,
	`nodeId` text,
	`nodeType` text,
	`message` text NOT NULL,
	`data` text,
	`debug` integer NOT NULL,
	`timestamp` text,
	FOREIGN KEY (`workflowRunId`) REFERENCES `workflowRuns`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `workflowRuns` (
	`id` text PRIMARY KEY NOT NULL,
	`workflowId` text NOT NULL,
	`environmentId` text,
	`status` integer NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`workflowId`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`currentEnvironmentId` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP
);
