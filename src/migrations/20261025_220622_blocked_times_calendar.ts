import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_booking_settings_blocked_times_repeat" AS ENUM('weekly', 'once');
  CREATE TYPE "public"."enum_booking_settings_blocked_times_day" AS ENUM('1', '2', '3', '4', '5', '6', '0');
  CREATE TABLE "booking_settings_blocked_times" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"repeat" "enum_booking_settings_blocked_times_repeat" DEFAULT 'weekly' NOT NULL,
  	"day" "enum_booking_settings_blocked_times_day",
  	"date" timestamp(3) with time zone,
  	"from" varchar NOT NULL,
  	"to" varchar NOT NULL,
  	"note" varchar
  );
  
  CREATE TABLE "booking_settings_ics_urls" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  ALTER TABLE "bookings" ADD COLUMN "calendar_event_url" varchar;
  ALTER TABLE "booking_settings" ADD COLUMN "calendar_busy_calendars" varchar;
  ALTER TABLE "booking_settings" ADD COLUMN "calendar_booking_calendar" varchar;
  ALTER TABLE "booking_settings_blocked_times" ADD CONSTRAINT "booking_settings_blocked_times_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."booking_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "booking_settings_ics_urls" ADD CONSTRAINT "booking_settings_ics_urls_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."booking_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "booking_settings_blocked_times_order_idx" ON "booking_settings_blocked_times" USING btree ("_order");
  CREATE INDEX "booking_settings_blocked_times_parent_id_idx" ON "booking_settings_blocked_times" USING btree ("_parent_id");
  CREATE INDEX "booking_settings_ics_urls_order_idx" ON "booking_settings_ics_urls" USING btree ("_order");
  CREATE INDEX "booking_settings_ics_urls_parent_id_idx" ON "booking_settings_ics_urls" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "booking_settings_blocked_times" CASCADE;
  DROP TABLE "booking_settings_ics_urls" CASCADE;
  ALTER TABLE "bookings" DROP COLUMN "calendar_event_url";
  ALTER TABLE "booking_settings" DROP COLUMN "calendar_busy_calendars";
  ALTER TABLE "booking_settings" DROP COLUMN "calendar_booking_calendar";
  DROP TYPE "public"."enum_booking_settings_blocked_times_repeat";
  DROP TYPE "public"."enum_booking_settings_blocked_times_day";`)
}
