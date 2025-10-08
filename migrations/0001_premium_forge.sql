DO $$
BEGIN
  PERFORM 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE t.typname = 'dish_tag' AND n.nspname = 'public';
  IF NOT FOUND THEN
    CREATE TYPE "public"."dish_tag" AS ENUM (
      'salad', 'chicken', 'meat', 'fish',
      'soup', 'dessert', 'spicy', 'sweet',
      'salty', 'dairy'
    );
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='dishes' AND column_name='description'
  ) THEN
    ALTER TABLE "public"."dishes"
      ADD COLUMN "description" text DEFAULT '' NOT NULL;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='dishes' AND column_name='tags'
      AND udt_name <> '_dish_tag'
  ) THEN
    ALTER TABLE "public"."dishes"
      ADD COLUMN "tags_tmp" "public"."dish_tag"[] DEFAULT '{}' NOT NULL;

    UPDATE "public"."dishes" d
    SET "tags_tmp" = COALESCE((
      SELECT array_agg((t)::public.dish_tag)
      FROM unnest(COALESCE(d."tags", '{}')) AS t
      WHERE t = ANY(enum_range(NULL::public.dish_tag)::text[])
    ), '{}');

    ALTER TABLE "public"."dishes" DROP COLUMN "tags";
    ALTER TABLE "public"."dishes" RENAME COLUMN "tags_tmp" TO "tags";
  END IF;
END $$;

ALTER TABLE "public"."dishes"
  ALTER COLUMN "tags" SET DEFAULT '{}'::dish_tag[]::"public"."dish_tag"[];

ALTER TABLE "public"."dishes"
  ALTER COLUMN "tags" SET DATA TYPE "public"."dish_tag"[]
  USING "tags"::"public"."dish_tag"[];
