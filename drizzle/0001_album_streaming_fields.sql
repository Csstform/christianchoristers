ALTER TABLE "albums" ADD COLUMN "slug" varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE "albums" ADD COLUMN "cd_url" text;--> statement-breakpoint
ALTER TABLE "albums" ADD COLUMN "local_audio_path" text;--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_slug_unique" UNIQUE("slug");