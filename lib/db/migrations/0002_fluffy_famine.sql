CREATE TABLE "commentary_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"message" text NOT NULL,
	"display_duration_ms" integer DEFAULT 5000 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commentary_messages" ADD CONSTRAINT "commentary_messages_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commentary_messages" ADD CONSTRAINT "commentary_messages_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "commentary_event_id_idx" ON "commentary_messages" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "commentary_created_by_idx" ON "commentary_messages" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "commentary_created_at_idx" ON "commentary_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "commentary_event_created_at_idx" ON "commentary_messages" USING btree ("event_id","created_at");