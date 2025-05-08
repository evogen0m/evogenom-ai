CREATE TYPE "public"."message_scope" AS ENUM('ONBOARDING', 'COACH');--> statement-breakpoint
ALTER TABLE "chat_message" ADD COLUMN "message_scope" "message_scope";
UPDATE "chat_message" SET "message_scope" = 'COACH';
ALTER TABLE "chat_message" ALTER COLUMN "message_scope" SET NOT NULL;