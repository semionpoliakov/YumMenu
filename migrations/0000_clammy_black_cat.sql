CREATE TYPE "public"."meal_type" AS ENUM('breakfast', 'lunch', 'dinner', 'snack', 'dessert');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('draft', 'final');--> statement-breakpoint
CREATE TYPE "public"."unit" AS ENUM('pcs', 'g', 'ml');--> statement-breakpoint
CREATE TABLE "dish_ingredients" (
	"dish_id" text NOT NULL,
	"ingredient_id" text NOT NULL,
	"quantity" numeric(12, 3) NOT NULL,
	CONSTRAINT "dish_ingredients_pk" PRIMARY KEY("dish_id","ingredient_id"),
	CONSTRAINT "dish_ingredients_quantity_nonnegative" CHECK (quantity >= 0)
);
--> statement-breakpoint
CREATE TABLE "dishes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"meal_type" "meal_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fridge_items" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"ingredient_id" text NOT NULL,
	"quantity" numeric(12, 3) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fridge_items_quantity_nonnegative" CHECK (quantity >= 0)
);
--> statement-breakpoint
CREATE TABLE "ingredients" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"unit" "unit" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" text PRIMARY KEY NOT NULL,
	"menu_id" text NOT NULL,
	"meal_type" "meal_type" NOT NULL,
	"dish_id" text NOT NULL,
	"locked" boolean DEFAULT false NOT NULL,
	"cooked" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menus" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" "status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopping_list_items" (
	"id" text PRIMARY KEY NOT NULL,
	"shopping_list_id" text NOT NULL,
	"ingredient_id" text NOT NULL,
	"quantity" numeric(12, 3) NOT NULL,
	"bought" boolean DEFAULT false NOT NULL,
	CONSTRAINT "shopping_list_items_quantity_nonnegative" CHECK (quantity >= 0)
);
--> statement-breakpoint
CREATE TABLE "shopping_lists" (
	"id" text PRIMARY KEY NOT NULL,
	"menu_id" text NOT NULL,
	"status" "status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dish_ingredients" ADD CONSTRAINT "dish_ingredients_dish_id_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dish_ingredients" ADD CONSTRAINT "dish_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fridge_items" ADD CONSTRAINT "fridge_items_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_dish_id_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_shopping_list_id_shopping_lists_id_fk" FOREIGN KEY ("shopping_list_id") REFERENCES "public"."shopping_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_lists" ADD CONSTRAINT "shopping_lists_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dish_ingredients_dish_idx" ON "dish_ingredients" USING btree ("dish_id");--> statement-breakpoint
CREATE INDEX "dish_ingredients_ing_idx" ON "dish_ingredients" USING btree ("ingredient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "dishes_user_lower_name_idx" ON "dishes" USING btree ("user_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "fridge_items_user_ingredient_idx" ON "fridge_items" USING btree ("user_id","ingredient_id");--> statement-breakpoint
CREATE INDEX "fridge_items_ingredient_idx" ON "fridge_items" USING btree ("ingredient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ingredients_user_lower_name_idx" ON "ingredients" USING btree ("user_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "menu_items_menu_dish_uq" ON "menu_items" USING btree ("menu_id","dish_id");--> statement-breakpoint
CREATE INDEX "menu_items_dish_idx" ON "menu_items" USING btree ("dish_id");--> statement-breakpoint
CREATE INDEX "shopping_list_items_list_idx" ON "shopping_list_items" USING btree ("shopping_list_id");--> statement-breakpoint
CREATE INDEX "shopping_list_items_ing_idx" ON "shopping_list_items" USING btree ("ingredient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shopping_lists_menu_unique_idx" ON "shopping_lists" USING btree ("menu_id");