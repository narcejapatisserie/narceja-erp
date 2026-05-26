import { supabase } from './supabase'
import type { Recipe } from '@/types'

export async function getRecipes() {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data as Recipe[]
}

export async function getRecipe(id: string) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Recipe
}

export async function createRecipe(recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('recipes')
    .insert(recipe)
    .select()
    .single()
  if (error) throw error
  return data as Recipe
}

export async function updateRecipe(id: string, recipe: Partial<Recipe>) {
  const { data, error } = await supabase
    .from('recipes')
    .update(recipe)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Recipe
}

export async function deleteRecipe(id: string) {
  const { error } = await supabase
    .from('recipes')
    .update({ is_active: false })
    .eq('id', id)
  if (error) throw error
}
