import { computed } from 'vue'
import type { Ref } from 'vue'
import type { RecipeItem, RawMaterial } from '@/types'

export function useCostCalculator(
  recipe: Ref<RecipeItem[]>,
  salePrice: Ref<number>,
  rawMaterials: Ref<RawMaterial[]>
) {
  const costPrice = computed(() => {
    return recipe.value.reduce((total, item) => {
      const rm = rawMaterials.value.find(m => m.id === item.raw_material_id)
      if (!rm) return total
      return total + rm.cost_per_unit * item.quantity
    }, 0)
  })

  const profitValue = computed(() => salePrice.value - costPrice.value)

  const marginPercent = computed(() => {
    if (salePrice.value <= 0) return 0
    return (profitValue.value / salePrice.value) * 100
  })

  const markupPercent = computed(() => {
    if (costPrice.value <= 0) return 0
    return (profitValue.value / costPrice.value) * 100
  })

  return { costPrice, profitValue, marginPercent, markupPercent }
}
