import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_packages_category" AS ENUM('web', 'prednasky');
  ALTER TYPE "public"."enum_services_segment" ADD VALUE 'weby' BEFORE 'remeslnici';
  ALTER TYPE "public"."enum_services_segment" ADD VALUE 'bezpecnost' BEFORE 'remeslnici';
  ALTER TYPE "public"."enum_projects_segment" ADD VALUE 'weby' BEFORE 'remeslnici';
  ALTER TYPE "public"."enum_projects_segment" ADD VALUE 'bezpecnost' BEFORE 'remeslnici';
  ALTER TYPE "public"."enum_faqs_topic" ADD VALUE 'prednasky' BEFORE 'obor';
  ALTER TABLE "home_page" ALTER COLUMN "hero_title" SET DEFAULT 'Rychlé a bezpečné weby na míru. A přednášky o tom, jak se na internetu nenechat napálit.';
  ALTER TABLE "home_page" ALTER COLUMN "hero_text" SET DEFAULT 'Navrhnu a naprogramuju web pro vaši firmu, projekt nebo organizaci – bez šablon, s pevnou cenou a hotový v řádu týdnů.';
  ALTER TABLE "home_page" ALTER COLUMN "closing_title" SET DEFAULT 'Pojďme to probrat';
  ALTER TABLE "home_page" ALTER COLUMN "closing_text" SET DEFAULT 'Úvodní konzultace trvá 30 minut a je zdarma. Řeknu vám, co to obnáší, kolik to stojí a kdy to stihneme.';
  ALTER TABLE "about_page" ALTER COLUMN "headline" SET DEFAULT 'Programuju weby a učím lidi, jak být na internetu v bezpečí';
  ALTER TABLE "site_settings" ALTER COLUMN "tagline" SET DEFAULT 'Weby na míru a přednášky o bezpečnosti na internetu';
  ALTER TABLE "packages" ADD COLUMN "category" "enum_packages_category" DEFAULT 'web' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "services" ALTER COLUMN "segment" SET DATA TYPE text;
  DROP TYPE "public"."enum_services_segment";
  CREATE TYPE "public"."enum_services_segment" AS ENUM('remeslnici', 'gastro', 'sluzby', 'jine');
  ALTER TABLE "services" ALTER COLUMN "segment" SET DATA TYPE "public"."enum_services_segment" USING "segment"::"public"."enum_services_segment";
  ALTER TABLE "projects" ALTER COLUMN "segment" SET DATA TYPE text;
  DROP TYPE "public"."enum_projects_segment";
  CREATE TYPE "public"."enum_projects_segment" AS ENUM('remeslnici', 'gastro', 'sluzby', 'jine');
  ALTER TABLE "projects" ALTER COLUMN "segment" SET DATA TYPE "public"."enum_projects_segment" USING "segment"::"public"."enum_projects_segment";
  ALTER TABLE "faqs" ALTER COLUMN "topic" SET DATA TYPE text;
  ALTER TABLE "faqs" ALTER COLUMN "topic" SET DEFAULT 'prubeh'::text;
  DROP TYPE "public"."enum_faqs_topic";
  CREATE TYPE "public"."enum_faqs_topic" AS ENUM('cena', 'prubeh', 'technika', 'obor');
  ALTER TABLE "faqs" ALTER COLUMN "topic" SET DEFAULT 'prubeh'::"public"."enum_faqs_topic";
  ALTER TABLE "faqs" ALTER COLUMN "topic" SET DATA TYPE "public"."enum_faqs_topic" USING "topic"::"public"."enum_faqs_topic";
  ALTER TABLE "home_page" ALTER COLUMN "hero_title" SET DEFAULT 'Weby pro řemeslníky, restaurace a malé firmy. Hotové do dvou týdnů.';
  ALTER TABLE "home_page" ALTER COLUMN "hero_text" SET DEFAULT 'Navrhnu a naprogramuju web, který se načte dřív, než zákazník stihne odejít ke konkurenci. Žádné šablony, žádné měsíční poplatky za stavebnici.';
  ALTER TABLE "home_page" ALTER COLUMN "closing_title" SET DEFAULT 'Pojďme se na váš web podívat spolu';
  ALTER TABLE "home_page" ALTER COLUMN "closing_text" SET DEFAULT 'Úvodní konzultace trvá 30 minut a je zdarma. Řeknete mi, co děláte a co od webu chcete, já vám řeknu, co to bude stát a kdy to bude hotové.';
  ALTER TABLE "about_page" ALTER COLUMN "headline" SET DEFAULT 'Jsem vývojář, který píše weby pro lidi, co mají plné ruce práce';
  ALTER TABLE "site_settings" ALTER COLUMN "tagline" SET DEFAULT 'Weby na míru pro řemeslníky, restaurace a malé firmy';
  ALTER TABLE "packages" DROP COLUMN "category";
  DROP TYPE "public"."enum_packages_category";`)
}
