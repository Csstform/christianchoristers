ALTER TABLE "concerts" RENAME TO "programs";--> statement-breakpoint
ALTER TABLE "programs" RENAME CONSTRAINT "concerts_created_by_id_users_id_fk" TO "programs_created_by_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "rsvps" DROP CONSTRAINT "rsvps_concert_id_concerts_id_fk";--> statement-breakpoint
DROP INDEX IF EXISTS "rsvps_concert_user_idx";--> statement-breakpoint
ALTER TABLE "rsvps" RENAME COLUMN "concert_id" TO "program_id";--> statement-breakpoint
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rsvps_program_user_idx" ON "rsvps" USING btree ("program_id","user_id");
