CREATE TABLE `workflowLogs` (
	`workflowRunId` text NOT NULL,
	`nodeId` text,
	`nodeType` text,
	`message` text NOT NULL,
	`data` text,
	`debug` integer NOT NULL,
	`timestamp` text,
	FOREIGN KEY (`workflowRunId`) REFERENCES `workflowRuns`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`nodeId`) REFERENCES `nodes`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `workflowRuns` (
	`id` text PRIMARY KEY NOT NULL,
	`workflowId` text NOT NULL,
	`environmentId` text,
	`status` integer NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`workflowId`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`environmentId`) REFERENCES `environments`(`id`) ON UPDATE no action ON DELETE restrict
);
