CREATE TYPE "public"."follow_up_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
ALTER TABLE "follow_up" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "follow_up" ALTER COLUMN "status" TYPE follow_up_status USING status::follow_up_status;--> statement-breakpoint
ALTER TABLE "follow_up" ALTER COLUMN "status" SET DEFAULT 'pending';