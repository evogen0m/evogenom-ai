ALTER TABLE "chat_message" ADD COLUMN "tool_data" jsonb;--> statement-breakpoint
ALTER TABLE "chat_message" ADD COLUMN "embedding" vector(1536);--> statement-breakpoint
CREATE INDEX "chat_message_user_id_created_at_index" ON "chat_message" USING btree ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "chat_message" DROP COLUMN "rank";