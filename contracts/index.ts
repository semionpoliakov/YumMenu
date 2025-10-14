import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { DishTagEnum, MealTypeEnum, StatusEnum, UnitEnum } from '../domain/common/enums';

export const Unit = z.enum(UnitEnum);
export const MealType = z.enum(MealTypeEnum);
export const DishTag = z.enum(DishTagEnum);

type MealTypeValue = z.infer<typeof MealType>;

export const IngredientCreate = z
  .object({
    name: z.string().trim().min(1),
    unit: Unit,
    isActive: z.boolean().optional(),
  })
  .strict();

export const IngredientUpdate = z
  .object({
    name: z.string().trim().min(1).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const Ingredient = z.object({
  id: z.string(),
  name: z.string(),
  unit: Unit,
  isActive: z.boolean(),
  createdAt: z.string(),
});

export const DishIngredientInput = z
  .object({
    ingredientId: z.string(),
    qtyPerServing: z.number().positive(),
  })
  .strict();

export const DishIngredient = z
  .object({
    name: z.string(),
    qtyPerServing: z.number().positive(),
    unit: Unit,
  })
  .strict();

export const DishCreate = z
  .object({
    name: z.string().trim().min(1),
    mealType: MealType,
    isActive: z.boolean().optional(),
    tags: z.array(DishTag),
    description: z.string().max(2_000).default(''),
    ingredients: z.array(DishIngredientInput).min(1),
  })
  .strict();

export const DishUpdate = z
  .object({
    name: z.string().trim().min(1).optional(),
    mealType: MealType.optional(),
    isActive: z.boolean().optional(),
    tags: z.array(DishTag).optional(),
    description: z.string().max(2_000).optional(),
    ingredients: z.array(DishIngredientInput).min(1).optional(),
  })
  .strict();

export const Dish = z.object({
  id: z.string(),
  name: z.string(),
  mealType: MealType,
  isActive: z.boolean(),
  tags: z.array(DishTag),
  description: z.string(),
  createdAt: z.string(),
});

export const DishWithIngredients = Dish.extend({
  ingredients: z.array(DishIngredient),
});

export const FridgeItemCreate = z
  .object({
    ingredientId: z.string(),
    quantity: z.number().nonnegative(),
  })
  .strict();

export const FridgeItemUpdate = z
  .object({
    quantity: z.number().nonnegative(),
  })
  .strict();

export const FridgeItem = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number().nonnegative(),
  unit: Unit,
  createdAt: z.string(),
});

export const Menu = z.object({
  id: z.string(),
  status: z.enum(StatusEnum),
  name: z.string(),
  createdAt: z.string(),
});

export const MenuItem = z.object({
  id: z.string(),
  menuId: z.string(),
  mealType: MealType,
  dishName: z.string(),
  locked: z.boolean(),
  cooked: z.boolean(),
});

export const ShoppingListItem = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number().nonnegative(),
  unit: Unit,
  bought: z.boolean(),
});

export const ShoppingList = z.object({
  id: z.string(),
  status: z.enum(StatusEnum),
  name: z.string(),
  createdAt: z.string(),
});

export const ShoppingListWithItems = ShoppingList.extend({
  items: z.array(ShoppingListItem),
});

export const MenuListItem = z.object({
  id: z.string(),
  status: z.enum(StatusEnum),
  name: z.string(),
  createdAt: z.string(),
});

export const MenuItemView = z.object({
  id: z.string(),
  mealType: MealType,
  dishName: z.string(),
  locked: z.boolean(),
  cooked: z.boolean(),
});

export const MenuView = z.object({
  id: z.string(),
  status: z.enum(StatusEnum),
  name: z.string(),
  createdAt: z.string(),
  items: z.array(MenuItemView),
});

export const ShoppingListListItem = z.object({
  id: z.string(),
  status: z.enum(StatusEnum),
  name: z.string(),
  createdAt: z.string(),
});

export const ShoppingListItemView = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number().nonnegative(),
  unit: Unit,
  bought: z.boolean(),
});

export const ShoppingListView = z.object({
  id: z.string(),
  status: z.enum(StatusEnum),
  name: z.string(),
  createdAt: z.string(),
  items: z.array(ShoppingListItemView),
});

const slotCountSchema = z.number().int().nonnegative();

const TotalSlotsSchema = z
  .object({
    breakfast: slotCountSchema.optional(),
    lunch: slotCountSchema.optional(),
    dinner: slotCountSchema.optional(),
    snack: slotCountSchema.optional(),
    dessert: slotCountSchema.optional(),
  })
  .partial()
  .transform((value) => {
    const result: Partial<Record<MealTypeValue, number>> = {};
    (Object.entries(value) as [MealTypeValue, number | undefined][]).forEach(([key, quantity]) => {
      if (typeof quantity === 'number') {
        result[key] = quantity;
      }
    });
    return result;
  });

const GenerateRequestBase = z
  .object({
    name: z.string().trim().min(1),
    totalSlots: TotalSlotsSchema,
    filters: z
      .object({
        includeTags: z.array(DishTag).optional(),
      })
      .strict()
      .partial()
      .optional(),
    requiredDishes: z.array(z.string()).optional(),
    requiredIngredients: z.array(z.string()).optional(),
  })
  .strict();

export const GenerateRequest = GenerateRequestBase.superRefine((input, ctx) => {
  if (Object.keys(input.totalSlots).length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'totalSlots must not be empty',
      path: ['totalSlots'],
    });
  }
});

export const GenerateResponse = z.object({
  menu: Menu,
  items: z.array(MenuItem),
  shoppingList: ShoppingList.extend({
    items: z.array(ShoppingListItem),
  }),
});

export const PatchMenuStatusRequest = z
  .object({
    status: z.enum(StatusEnum),
  })
  .strict();

export const PatchMenuStatusResponse = Menu;

export type Unit = z.infer<typeof Unit>;
export type DishTag = z.infer<typeof DishTag>;
export type MealType = z.infer<typeof MealType>;
export type IngredientCreateInput = z.infer<typeof IngredientCreate>;
export type IngredientUpdateInput = z.infer<typeof IngredientUpdate>;
export type IngredientDto = z.infer<typeof Ingredient>;
export type DishIngredientInputDto = z.infer<typeof DishIngredientInput>;
export type DishIngredientDto = z.infer<typeof DishIngredient>;
export type DishCreateInput = z.infer<typeof DishCreate>;
export type DishUpdateInput = z.infer<typeof DishUpdate>;
export type DishDto = z.infer<typeof Dish>;
export type DishWithIngredientsDto = z.infer<typeof DishWithIngredients>;
export type FridgeItemCreateInput = z.infer<typeof FridgeItemCreate>;
export type FridgeItemUpdateInput = z.infer<typeof FridgeItemUpdate>;
export type FridgeItemDto = z.infer<typeof FridgeItem>;
export type MenuDto = z.infer<typeof Menu>;
export type MenuItemDto = z.infer<typeof MenuItem>;
export type ShoppingListItemDto = z.infer<typeof ShoppingListItem>;
export type ShoppingListDto = z.infer<typeof ShoppingList>;
export type ShoppingListWithItemsDto = z.infer<typeof ShoppingListWithItems>;
export type GenerateRequestInput = z.infer<typeof GenerateRequestBase>;
export type GenerateResponseDto = z.infer<typeof GenerateResponse>;
export type MenuListItemDto = z.infer<typeof MenuListItem>;
export type MenuItemViewDto = z.infer<typeof MenuItemView>;
export type MenuViewDto = z.infer<typeof MenuView>;
export type ShoppingListListItemDto = z.infer<typeof ShoppingListListItem>;
export type ShoppingListItemViewDto = z.infer<typeof ShoppingListItemView>;
export type ShoppingListViewDto = z.infer<typeof ShoppingListView>;
export type PatchMenuStatusRequestDto = z.infer<typeof PatchMenuStatusRequest>;
export type PatchMenuStatusResponseDto = z.infer<typeof PatchMenuStatusResponse>;

export const ErrorCode = z.enum([
  'VALIDATION_ERROR',
  'INVALID_DATA',
  'NOT_FOUND',
  'DUPLICATE_NAME',
  'HAS_DEPENDENCIES',
  'INSUFFICIENT_DISHES',
  'UNKNOWN',
]);

export const ErrorResponse = z.object({
  code: ErrorCode,
  message: z.string(),
});

export type ErrorCodeType = z.infer<typeof ErrorCode>;
export type ErrorResponseDto = z.infer<typeof ErrorResponse>;

const c = initContract();

export const contracts = c.router({
  health: {
    method: 'GET',
    path: '/api/health',
    responses: {
      200: z.object({ ok: z.literal(true) }),
    },
    summary: 'Health check endpoint',
  },
  ingredients: c.router({
    list: {
      method: 'GET',
      path: '/api/ingredients',
      query: z.object({
        active: z.enum(['true', 'false', 'all']).optional(),
      }),
      responses: {
        200: z.array(Ingredient),
        400: ErrorResponse,
      },
    },
    create: {
      method: 'POST',
      path: '/api/ingredients',
      body: IngredientCreate,
      responses: {
        201: Ingredient,
        400: ErrorResponse,
        409: ErrorResponse,
      },
    },
    update: {
      method: 'PATCH',
      path: '/api/ingredients/:id',
      body: IngredientUpdate,
      responses: {
        200: Ingredient,
        400: ErrorResponse,
        404: ErrorResponse,
        409: ErrorResponse,
      },
    },
    delete: {
      method: 'DELETE',
      path: '/api/ingredients/:id',
      responses: {
        204: z.null(),
        404: ErrorResponse,
        409: ErrorResponse,
      },
    },
  }),
  dishes: c.router({
    list: {
      method: 'GET',
      path: '/api/dishes',
      responses: {
        200: z.array(DishWithIngredients),
      },
    },
    create: {
      method: 'POST',
      path: '/api/dishes',
      body: DishCreate,
      responses: {
        201: Dish,
        400: ErrorResponse,
        409: ErrorResponse,
      },
    },
    update: {
      method: 'PATCH',
      path: '/api/dishes/:id',
      body: DishUpdate,
      responses: {
        200: Dish,
        400: ErrorResponse,
        404: ErrorResponse,
        409: ErrorResponse,
      },
    },
    delete: {
      method: 'DELETE',
      path: '/api/dishes/:id',
      responses: {
        204: z.null(),
        404: ErrorResponse,
        409: ErrorResponse,
      },
    },
  }),
  fridge: c.router({
    list: {
      method: 'GET',
      path: '/api/fridge',
      responses: {
        200: z.array(FridgeItem),
      },
    },
    upsert: {
      method: 'POST',
      path: '/api/fridge',
      body: FridgeItemCreate,
      responses: {
        200: FridgeItem,
        400: ErrorResponse,
        404: ErrorResponse,
      },
    },
    update: {
      method: 'PATCH',
      path: '/api/fridge/:id',
      body: FridgeItemUpdate,
      responses: {
        200: FridgeItem,
        400: ErrorResponse,
        404: ErrorResponse,
      },
    },
    delete: {
      method: 'DELETE',
      path: '/api/fridge/:id',
      responses: {
        204: z.null(),
        404: ErrorResponse,
      },
    },
  }),
  menus: c.router({
    list: {
      method: 'GET',
      path: '/api/menus',
      responses: {
        200: z.array(MenuListItem),
      },
    },
    generate: {
      method: 'POST',
      path: '/api/menus/generate',
      body: GenerateRequest,
      responses: {
        201: GenerateResponse,
        400: ErrorResponse,
        404: ErrorResponse,
        409: ErrorResponse,
      },
    },
    get: {
      method: 'GET',
      path: '/api/menus/:id',
      responses: {
        200: MenuView,
        404: ErrorResponse,
      },
    },
    regenerate: {
      method: 'POST',
      path: '/api/menus/:id/regenerate',
      body: GenerateRequest,
      responses: {
        200: GenerateResponse,
        400: ErrorResponse,
        404: ErrorResponse,
        409: ErrorResponse,
      },
    },
    patchItem: {
      method: 'PATCH',
      path: '/api/menus/:id/items/:itemId',
      body: z.object({ cooked: z.boolean() }),
      responses: {
        200: MenuItem,
        400: ErrorResponse,
        404: ErrorResponse,
      },
    },
    lockItems: {
      method: 'POST',
      path: '/api/menus/:id/lock',
      body: z.object({
        itemIds: z.array(z.string()),
        locked: z.boolean(),
      }),
      responses: {
        200: z.array(MenuItem),
        400: ErrorResponse,
        404: ErrorResponse,
      },
    },
    updateStatus: {
      method: 'PATCH',
      path: '/api/menus/:id/status',
      body: PatchMenuStatusRequest,
      responses: {
        200: PatchMenuStatusResponse,
        400: ErrorResponse,
        404: ErrorResponse,
        409: ErrorResponse,
      },
    },
    delete: {
      method: 'DELETE',
      path: '/api/menus/:id',
      responses: {
        204: z.null(),
        404: ErrorResponse,
      },
    },
  }),
  shoppingLists: c.router({
    list: {
      method: 'GET',
      path: '/api/shopping-lists',
      responses: {
        200: z.array(ShoppingListListItem),
      },
    },
    get: {
      method: 'GET',
      path: '/api/shopping-lists/:id',
      responses: {
        200: ShoppingListView,
        404: ErrorResponse,
      },
    },
    patchItem: {
      method: 'PATCH',
      path: '/api/shopping-lists/:id/items/:itemId',
      body: z.object({ bought: z.boolean() }),
      responses: {
        200: ShoppingListItem,
        400: ErrorResponse,
        404: ErrorResponse,
      },
    },
  }),
});

export type AppContract = typeof contracts;
