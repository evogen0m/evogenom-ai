CREATE TABLE "follow_up" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"chat_id" uuid NOT NULL,
	"content" text NOT NULL,
	"due_date" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "time_zone" text DEFAULT 'Europe/Helsinki' NOT NULL;--> statement-breakpoint
ALTER TABLE "follow_up" ADD CONSTRAINT "follow_up_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up" ADD CONSTRAINT "follow_up_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "follow_up_user_id_index" ON "follow_up" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "follow_up_chat_id_index" ON "follow_up" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "follow_up_due_date_index" ON "follow_up" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "follow_up_status_index" ON "follow_up" USING btree ("status");