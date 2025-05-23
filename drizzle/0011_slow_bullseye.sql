CREATE TABLE "chat_note" (
	"id" uuid DEFAULT gen_random_uuid(),
	"chat_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_note_id_chat_id_pk" PRIMARY KEY("id","chat_id")
);
--> statement-breakpoint
ALTER TABLE "chat_note" ADD CONSTRAINT "chat_note_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_note_chat_id_index" ON "chat_note" USING btree ("chat_id");