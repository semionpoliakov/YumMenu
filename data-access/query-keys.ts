export const INGREDIENTS_KEY = ['ingredients'] as const;
export const DISHES_KEY = ['dishes'] as const;
export const FRIDGE_KEY = ['fridge'] as const;
export const MENUS_KEY = ['menus'] as const;
export const MENU_KEY = (id: string) => [...MENUS_KEY, id] as const;
export const SHOPPING_LISTS_KEY = ['shopping-lists'] as const;
export const SHOPPING_LIST_KEY = (id: string) => [...SHOPPING_LISTS_KEY, id] as const;
