CREATE TABLE "quick_response" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid NOT NULL,
	"assistant_message_id" uuid NOT NULL,
	"responses" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quick_response" ADD CONSTRAINT "quick_response_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_response" ADD CONSTRAINT "quick_response_assistant_message_id_chat_message_id_fk" FOREIGN KEY ("assistant_message_id") REFERENCES "public"."chat_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quick_response_chat_id_assistant_message_id_index" ON "quick_response" USING btree ("chat_id","assistant_message_id");--> statement-breakpoint
CREATE INDEX "quick_response_created_at_index" ON "quick_response" USING btree ("created_at");