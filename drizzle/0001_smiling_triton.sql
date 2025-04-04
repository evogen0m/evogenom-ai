ALTER TABLE "chat_message" DROP CONSTRAINT "chat_message_chat_id_chat_id_fk";
--> statement-breakpoint
ALTER TABLE "chat_message" DROP CONSTRAINT "chat_message_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "chat" DROP CONSTRAINT "chat_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "chat_message" ADD COLUMN "rank" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat" ADD CONSTRAINT "chat_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_message_chat_id_index" ON "chat_message" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "chat_message_user_id_index" ON "chat_message" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_user_id_index" ON "chat" USING btree ("user_id");