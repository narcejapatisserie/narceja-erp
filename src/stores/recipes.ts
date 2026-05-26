import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Recipe } from '@/types'
import { getRecipes, createRecipe, updateRecipe, deleteRecipe } from '@/services/recipeService'

export const useRecipesStore = defineStore('recipes', () => {
  const recipes = ref<Recipe[]>([])
  const loading = ref(false)

  async function fetchRecipes() {
    loading.value = true
    try {
      recipes.value = await getRecipes()
    } finally {
      loading.value = false
    }
  }

  async function addRecipe(recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>) {
    const created = await createRecipe(recipe)
    recipes.value.push(created)
    return created
  }

  async function editRecipe(id: string, recipe: Partial<Recipe>) {
    const updated = await updateRecipe(id, recipe)
    const idx = recipes.value.findIndex(r => r.id === id)
    if (idx !== -1) recipes.value[idx] = updated
    return updated
  }

  async function removeRecipe(id: string) {
    await deleteRecipe(id)
    recipes.value = recipes.value.filter(r => r.id !== id)
  }

  return { recipes, loading, fetchRecipes, addRecipe, editRecipe, removeRecipe }
})
