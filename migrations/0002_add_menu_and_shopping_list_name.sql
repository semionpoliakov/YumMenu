ALTER TABLE public.menus
  ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';

ALTER TABLE public.shopping_lists
  ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';
