# YumMenu Frontend

## Getting Started

- Install dependencies: `pnpm install`
- Start development server: `pnpm dev`
- Run linting: `pnpm lint`
- Build for production: `pnpm build`

The application runs on Next.js App Router with all pages rendered as client components.

## Screen Map

- `/` – Dashboard with quick links to feature sections.
- `/ingredients` – Manage ingredient library (create/edit pages at `/ingredients/create` and `/ingredients/[id]/edit`).
- `/dishes` – Manage dishes with dedicated create/edit screens.
- `/fridge` – Review fridge inventory with card actions (`/fridge/create`, `/fridge/[id]/edit` for quantity updates).
- `/generate` – Enter menu name and slot counts, redirecting to the checkout flow.
- `/checkout/[id]` – Lock dishes, regenerate, or finalise the in-progress menu.
- `/menus` – List all generated menus.
  - `/menus/[id]` – Menu detail with cook/lock toggles.
  - `/menus/[id]/options` – Entry point to menu detail or the linked shopping list.
- `/shopping-lists/[id]` – Shopping list detail with bought toggles (accessible via menu options).

## Data Access Layer

Shared hooks for all API interactions live in `data-access/hooks/`. Each hook wraps the ts-rest client with TanStack Query for caching and mutations:

- `useIngredientsQuery`, `useCreateIngredient`, `useUpdateIngredient`, `useDeleteIngredient`
- `useDishesQuery`, `useCreateDish`, `useUpdateDish`, `useDeleteDish`
- `useFridgeQuery`, `useUpsertFridgeItem`, `useUpdateFridgeItem`, `useDeleteFridgeItem`
- `useMenusQuery`, `useMenuQuery`, `useGenerateMenu`, `useRegenerateMenu`, `useLockMenuItems`, `useUpdateMenuItemCooked`, `useUpdateMenuStatus`, `useDeleteMenu`
- `useShoppingListsQuery`, `useShoppingListQuery`, `useToggleShoppingListItem`, `useDeleteShoppingList`

The hooks share query keys defined in `data-access/query-keys.ts` and utilities in `data-access/utils.ts`.

## UI Components

Custom UI primitives (buttons, inputs, dialogs, tables, etc.) live under `components/ui/`. Shared layout components such as the mobile header and toaster are located in `components/`.

- `app/providers.tsx` sets up the global `QueryClientProvider` and toaster.
- `app/(dashboard)/layout.tsx` contains the common page container styles.

Forms rely on `react-hook-form` with Zod schemas defined per feature. Shared form helpers reside in `lib/forms.ts` and enum helpers in `lib/enums.ts`.

## Notes

- All API calls flow through the typed ts-rest client (`lib/apiClient.ts`). Success and error toasts are centralised in `lib/toast.ts`.
- Confirm dialogs guard destructive actions (delete/remove) across features.
- After menu generation or mutations, related queries are invalidated to keep pages in sync.
