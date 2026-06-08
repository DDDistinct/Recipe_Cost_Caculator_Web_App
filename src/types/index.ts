export type Unit = 'g' | 'ml' | 'pc' | 'L' | 'kg'

export interface Ingredient {
  rowIndex: number
  ingredientNo: number
  name: string
  unit: Unit
  purchasedQty: number
  purchasedPrice: number
  costPerUnit: number
}

export interface IngredientRow {
  ingredient: string
  quantityUsed: number
  unitCost: number
  totalCost: number
}

export interface RecipeResult {
  recipeName: string
  description: string
  markupPercent: number
  rows: IngredientRow[]
  totalCost: number
  markupAmount: number
  sellingPrice: number
}

export interface SavedRecipe {
  rowIndex: number
  itemNo: number
  itemName: string
  description: string
  sellingPrice: number
  totalCost: number
}

export interface UserProfile {
  email: string
  name: string
  picture: string
}

export interface NotificationState {
  message: string
  type: 'success' | 'error' | 'info'
  visible: boolean
}
