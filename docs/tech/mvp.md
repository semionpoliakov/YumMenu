# YumMenu — Technical Specification

## 1. Data Model

### 1.1 User (один пользователь на все приложение)

- `id` — unique identifier

---

### 1.2 Ingredient

**Fields:**

- `id` — unique identifier
- `userId` — owner reference
- `name` — ingredient name (unique per user)
- `unit` — measurement unit (`pcs` | `g` | `ml`)
- `isActive` — boolean flag

**Rules:**

- Can only be deleted if not used in any dish
- `isActive=false` excludes from generation process
- Name must be unique within user scope

---

### 1.3 Dish

**Fields:**

- `id` — unique identifier
- `userId` — owner reference
- `name` — dish name
- `mealType` — meal category (`breakfast` | `lunch` | `dinner` | `snack` | `dessert`)
- `isActive` — boolean flag

**Relations:**

- `mealType` — dish types (`soup` | `garnish` | `main` | `experiment`)
- `tags` — custom tags (e.g., `vegan`, `meat`, `spicy`)
- `ingredients` — array of:
  - `ingredientId` — reference to Ingredient
  - `qtyPerServing` — quantity per serving (in ingredient's `unit`)

**Rules:**

- Can only be deleted if not used in any menu
- Quantities are specified per single serving
- Must have at least one ingredient

---

### 1.4 FridgeItem

**Fields:**

- `id` — unique identifier
- `userId` — owner reference
- `ingredientId` — reference to Ingredient
- `quantity` — current stock (in ingredient's `unit`)

**API response:** `{ id, name, quantity, unit, createdAt }`

**Rules:**

- Upsert by composite key `(userId, ingredientId)`
- Setting `quantity=0` deletes the record
- Cannot have negative quantity

---

### 1.5 Menu

**Fields:**

- `id` — unique identifier
- `userId` — owner reference
- `status` — generation status (`draft` | `final`)

**Menu Items:**

- `id` — unique identifier
- `menuId` — parent menu reference
- `dishId` — reference to Dish
- `mealType` — meal category
- `locked` — boolean (prevents regeneration)
- `cooked` — boolean (marks dish as prepared)

---

### 1.6 ShoppingList

**Fields:**

- `id` — unique identifier
- `menuId` — one-to-one relationship with Menu
- `status` — list status (`draft` | `final`)

**Shopping List Items:**

- `id` — unique identifier
- `shoppingListId` — parent list reference
- `ingredientId` — reference to Ingredient
- `quantity` — amount needed (in ingredient's `unit`)
- `bought` — boolean (marks item as purchased)

**API response:** `{ id, name, quantity, unit, bought }`

---

## 2. Menu Generation Algorithm

### 2.1 Input Parameters

```json
{
  "name": "Weekly plan",
  "perDay": {
    "breakfast": 2,
    "lunch": 3,
    "dinner": 2
  },
  "filters": {
    "includeTags": ["vegan"]
  },
  "requiredDishes": ["dishId1", "dishId2"],
  "requiredIngredients": ["ingredientId1"]
}
```

### 2.2 Generation Steps

1. **Create Slot Structure**
   - Generate empty slots based on `perDay` configuration
   - Each slot contains: `mealType`, `position`

2. **Build Dish Pool**
   - Filter active dishes (`isActive=true`)
   - Apply tag filters from `includeTags`
   - Match dishes by `mealType`

3. **Add Required Dishes**
   - Insert `requiredDishes` first
   - Validate they match slot `mealType`

4. **Fill Remaining Slots**
   - Randomly select from dish pool
   - Ensure no duplicate dishes in menu
   - Skip if insufficient dishes available

5. **Calculate Shopping List**
   - Sum ingredient requirements from all dishes
   - Subtract current fridge quantities
   - Only include ingredients with positive delta
   - Include `requiredIngredients` regardless of fridge stock

6. **Save Results**
   - Create `Menu` with `status=draft`
   - Create `ShoppingList` with `status=draft`
   - Link shopping list to menu

### 2.3 Guarantees

- No dish appears twice in same menu
- Partial menu if insufficient dishes available
- Shopping list only contains needed items
- Required dishes always included if valid

---

## 3. Allowed Modifications

### 3.1 Ingredient Changes

- Update `name`
- Update `unit` (only if not used in dishes)
- Toggle `isActive`

### 3.2 Dish Changes

- Update `name`, `mealType`, `tags`
- Modify ingredient list
- Toggle `isActive`

### 3.3 Menu Item Changes

- Toggle `cooked` status
- Toggle `locked` status

### 3.4 Shopping List Item Changes

- Toggle `bought` status

### 3.5 Fridge Item Changes

- Update `quantity`

---

## 4. API Endpoints

### 4.1 Ingredients

## List all ingredients

```json
GET /ingredients
```

## Create ingredient

```json
POST /ingredients
Body: { "name": string, "unit": "pcs"|"g"|"ml" }
```

## Update ingredient

```json
PATCH /ingredients/:id
Body: { "name"?: string, "unit"?: string, "isActive"?: boolean }
```

## Delete ingredient

```json
DELETE /ingredients/:id
```

---

### 4.2 Dishes

## List all dishes

```json
GET /dishes
```

## Create dish

```json
POST /dishes
Body: {
  "name": string,
  "mealType": string,
  "tags": string[],
  "ingredients": [
    { "ingredientId": string, "qtyPerServing": number }
  ]
}
```

## Update dish

```json
PATCH /dishes/:id
Body: { /* same fields as create */ }
```

## Delete dish

```json
DELETE /dishes/:id
```

---

### 4.3 Fridge

## Get fridge contents

```json
GET /fridge
```

## Add/update fridge item

```json
POST /fridge
Body: { "ingredientId": string, "quantity": number }
```

## Update fridge item

```json
PATCH /fridge/:id
Body: { "quantity": number }
```

## Delete fridge item

```json
DELETE /fridge/:id
```

---

### 4.4 Menus

## Generate new menu

```json
POST /menus/generate
Body: {
  "name": string,
  "perDay": { [mealType]: number },
  "filters": { "includeTags": string[] },
  "requiredDishes": string[],
  "requiredIngredients": string[]
}
```

## Regenerate menu

```json
POST /menus/:id/regenerate
Body: { /* same as generate */ }
```

## Update menu item

```json
PATCH /menus/:id/items/:itemId
Body: { "cooked": boolean }
```

## Lock/unlock menu items

```json
POST /menus/:id/lock
Body: { "itemIds": string[], "locked": boolean }
```

---

### 4.5 Shopping Lists

## Get shopping list

```json
GET /shopping-lists/:id
```

## Update shopping list item

```json
PATCH /shopping-lists/:id/items/:itemId
Body: { "bought": boolean }
```

---

## 5. Validation & Error Handling

### 5.1 Validation Rules

## Duplicate Name (409 Conflict)

- Ingredient name already exists for user
- Dish name already exists for user

## Delete With Dependencies (409 Conflict)

- Ingredient used in active dishes
- Dish used in active menus

## Invalid Data (422 Unprocessable Entity)

- Dish without ingredients
- Negative quantity values
- Invalid unit type

## Insufficient Resources (409 Conflict)

- Required dishes exceed available slots
- Not enough active dishes for generation

### 5.2 Error Response Format

```json
{
  "error": {
    "code": "DUPLICATE_NAME",
    "message": "Ingredient with this name already exists"
  }
}
```

**Error Codes:**

- `DUPLICATE_NAME` — resource name conflict
- `HAS_DEPENDENCIES` — cannot delete due to references
- `INVALID_DATA` — validation failed
- `INSUFFICIENT_DISHES` — not enough dishes for generation
- `NOT_FOUND` — resource does not exist

---

## 6. Glossary

**unit** — Base measurement unit for ingredient (`pcs`, `g`, `ml`). All operations use the ingredient's defined unit.

**locked** — Menu slot cannot be changed during regeneration. Protects specific meal choices.

**cooked** — Dish has been prepared. Marks completion status.

**bought** — Shopping list item has been purchased. Tracks shopping progress.

**isActive** — Resource is available for menu generation. Inactive items are hidden but not deleted.

**perDay** — Number of meals per meal type. Defines menu structure.

**mealType** — Time-based meal category. Determines when dish is eaten.

**qtyPerServing** — Ingredient amount for one serving. Used to calculate total needs.
