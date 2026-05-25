<template>
  <div class="relative h-full">

    <!-- ═══ LAYOUT DESKTOP ═══ -->
    <div class="hidden lg:flex gap-4 h-full min-h-0">
      <!-- Produtos -->
      <div class="flex-1 space-y-4 min-w-0">
        <div class="card p-4">
          <div class="relative">
            <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input v-model="search" type="text" class="input pl-9" placeholder="Buscar produto..." />
          </div>
        </div>
        <div class="grid grid-cols-3 xl:grid-cols-4 gap-3 max-h-[calc(100vh-220px)] overflow-y-auto">
          <button v-for="product in filteredProducts" :key="product.id" @click="addToCart(product)"
            :disabled="product.stock_quantity <= 0"
            class="card p-3 text-left hover:border-narceja-300 dark:hover:border-narceja-700 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-transparent">
            <div class="w-full aspect-square rounded-lg bg-narceja-50 dark:bg-narceja-900/20 flex items-center justify-center mb-2 overflow-hidden">
              <img v-if="product.image_url" :src="product.image_url" class="w-full h-full object-cover rounded-lg" />
              <i v-else class="pi pi-box text-narceja-400 text-2xl"></i>
            </div>
            <p class="text-xs font-medium text-gray-900 dark:text-white leading-tight">{{ product.name }}</p>
            <p class="text-sm font-bold text-narceja-700 dark:text-narceja-400 mt-1">{{ formatCurrency(product.sale_price) }}</p>
            <p class="text-xs text-gray-400">Estoque: {{ product.stock_quantity }}</p>
          </button>
        </div>
      </div>
      <!-- Carrinho desktop -->
      <div class="w-96 flex flex-col card overflow-hidden">
        <div class="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            Carrinho <span v-if="cart.totalItems > 0" class="badge-info badge ml-1">{{ cart.totalItems }}</span>
          </h3>
          <button v-if="cart.items.length > 0" @click="cart.clearCart()" class="text-xs text-red-500 hover:text-red-700">Limpar</button>
        </div>
        <div class="flex-1 overflow-y-auto p-3 space-y-2">
          <div v-if="cart.items.length === 0" class="flex flex-col items-center justify-center h-40 text-gray-400">
            <i class="pi pi-shopping-cart text-3xl mb-2"></i>
            <p class="text-sm">Carrinho vazio</p>
          </div>
          <div v-for="item in cart.items" :key="item.product_id" class="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ item.product_name }}</p>
              <p class="text-xs text-gray-500">{{ formatCurrency(item.unit_price) }} × {{ item.quantity }}</p>
            </div>
            <div class="flex items-center gap-1 flex-shrink-0">
              <button @click="cart.updateQuantity(item.product_id, item.quantity - 1)" class="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 hover:bg-narceja-100 hover:text-narceja-700">
                <i class="pi pi-minus text-xs"></i>
              </button>
              <span class="w-8 text-center text-sm font-medium">{{ item.quantity }}</span>
              <button @click="incrementItem(item)" class="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 hover:bg-narceja-100 hover:text-narceja-700">
                <i class="pi pi-plus text-xs"></i>
              </button>
            </div>
            <p class="w-20 text-right text-sm font-semibold text-narceja-700 dark:text-narceja-400 flex-shrink-0">{{ formatCurrency(item.total_price) }}</p>
          </div>
        </div>
        <div class="border-t border-gray-100 dark:border-gray-700 p-4 space-y-3">
          <div class="flex items-center gap-2">
            <select v-model="cart.discountType" class="input text-sm flex-1">
              <option value="">Sem desconto</option>
              <option value="percent">% Percentual</option>
              <option value="value">R$ Valor fixo</option>
            </select>
            <input v-if="cart.discountType" v-model.number="cart.discountValue" type="number" min="0" step="0.01" class="input text-sm w-24" placeholder="0" />
          </div>
          <input v-model="cart.customerName" type="text" class="input text-sm" placeholder="Nome do cliente (opcional)" />
          <div class="grid grid-cols-3 gap-1.5">
            <button v-for="pm in paymentMethods" :key="pm.value" type="button"
              @click="cart.paymentMethod = pm.value as PaymentMethod"
              :class="['py-1.5 px-2 rounded-lg text-xs font-medium border transition-all',
                cart.paymentMethod === pm.value ? 'bg-narceja-500 border-narceja-500 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-narceja-300']">
              {{ pm.label }}
            </button>
          </div>
          <div v-if="cart.paymentMethod === 'cash'" class="flex items-center gap-2">
            <label class="text-xs text-gray-500 whitespace-nowrap">Valor pago:</label>
            <input v-model.number="cart.amountPaid" type="number" step="0.01" min="0" class="input text-sm flex-1" />
            <span v-if="cart.changeAmount > 0" class="text-xs text-green-600 font-medium whitespace-nowrap">Troco: {{ formatCurrency(cart.changeAmount) }}</span>
          </div>
          <div class="space-y-1.5 text-sm">
            <div class="flex justify-between text-gray-500"><span>Subtotal</span><span>{{ formatCurrency(cart.subtotal) }}</span></div>
            <div v-if="cart.discountAmount > 0" class="flex justify-between text-red-500"><span>Desconto</span><span>-{{ formatCurrency(cart.discountAmount) }}</span></div>
            <div class="flex justify-between font-bold text-gray-900 dark:text-white text-base border-t border-gray-100 dark:border-gray-700 pt-1.5">
              <span>Total</span><span class="text-narceja-700 dark:text-narceja-400">{{ formatCurrency(cart.total) }}</span>
            </div>
          </div>
          <button @click="finalizeSale" :disabled="cart.items.length === 0 || saving" class="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50">
            <i v-if="saving" class="pi pi-spin pi-spinner"></i>
            <i v-else class="pi pi-check"></i>
            <span>{{ saving ? 'Finalizando...' : 'Finalizar Venda' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ═══ LAYOUT MOBILE ═══ -->
    <div class="lg:hidden flex flex-col h-full">
      <!-- Busca -->
      <div class="card p-3 mb-3">
        <div class="relative">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input v-model="search" type="text" class="input pl-9" placeholder="Buscar produto..." />
        </div>
      </div>

      <!-- Grid de produtos — ocupa a tela toda menos o botão do carrinho -->
      <div class="grid grid-cols-2 gap-3 overflow-y-auto pb-24">
        <button v-for="product in filteredProducts" :key="product.id" @click="addToCart(product)"
          :disabled="product.stock_quantity <= 0"
          class="card p-3 text-left active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed border border-transparent">
          <div class="w-full aspect-square rounded-lg bg-narceja-50 dark:bg-narceja-900/20 flex items-center justify-center mb-2 overflow-hidden">
            <img v-if="product.image_url" :src="product.image_url" class="w-full h-full object-cover rounded-lg" />
            <i v-else class="pi pi-box text-narceja-400 text-2xl"></i>
          </div>
          <p class="text-xs font-medium text-gray-900 dark:text-white leading-tight line-clamp-2">{{ product.name }}</p>
          <p class="text-sm font-bold text-narceja-700 dark:text-narceja-400 mt-1">{{ formatCurrency(product.sale_price) }}</p>
          <p class="text-xs text-gray-400">Estoque: {{ product.stock_quantity }}</p>
        </button>
      </div>

      <!-- Botão flutuante do carrinho -->
      <div class="fixed bottom-4 left-4 right-4 z-40">
        <button @click="showCart = true"
          class="w-full bg-narceja-600 hover:bg-narceja-700 text-white rounded-2xl py-4 px-5 flex items-center justify-between shadow-xl active:scale-95 transition-transform">
          <div class="flex items-center gap-3">
            <div class="relative">
              <i class="pi pi-shopping-cart text-xl"></i>
              <span v-if="cart.totalItems > 0"
                class="absolute -top-2 -right-2 bg-white text-narceja-700 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {{ cart.totalItems }}
              </span>
            </div>
            <span class="font-semibold">{{ cart.items.length === 0 ? 'Carrinho vazio' : `${cart.totalItems} ite${cart.totalItems === 1 ? 'm' : 'ns'}` }}</span>
          </div>
          <span class="font-bold text-lg">{{ formatCurrency(cart.total) }}</span>
        </button>
      </div>
    </div>

    <!-- ═══ DRAWER DO CARRINHO (mobile) ═══ -->
    <Transition name="drawer">
      <div v-if="showCart" class="fixed inset-0 z-50 lg:hidden">
        <!-- Overlay -->
        <div class="absolute inset-0 bg-black/50" @click="showCart = false"></div>
        <!-- Painel -->
        <div class="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl max-h-[92vh] flex flex-col overflow-hidden">
          <!-- Handle -->
          <div class="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
            <h3 class="font-semibold text-gray-900 dark:text-white text-base">
              Carrinho <span v-if="cart.totalItems > 0" class="badge-info badge ml-1">{{ cart.totalItems }}</span>
            </h3>
            <div class="flex items-center gap-3">
              <button v-if="cart.items.length > 0" @click="cart.clearCart()" class="text-xs text-red-500">Limpar</button>
              <button @click="showCart = false" class="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
                <i class="pi pi-times text-sm"></i>
              </button>
            </div>
          </div>

          <!-- Itens -->
          <div class="flex-1 overflow-y-auto p-3 space-y-2">
            <div v-if="cart.items.length === 0" class="flex flex-col items-center justify-center py-10 text-gray-400">
              <i class="pi pi-shopping-cart text-3xl mb-2"></i>
              <p class="text-sm">Carrinho vazio</p>
            </div>
            <div v-for="item in cart.items" :key="item.product_id"
              class="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ item.product_name }}</p>
                <p class="text-xs text-gray-500">{{ formatCurrency(item.unit_price) }} × {{ item.quantity }}</p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <button @click="cart.updateQuantity(item.product_id, item.quantity - 1)"
                  class="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 active:bg-narceja-100">
                  <i class="pi pi-minus text-xs"></i>
                </button>
                <span class="w-6 text-center text-sm font-bold">{{ item.quantity }}</span>
                <button @click="incrementItem(item)"
                  class="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 active:bg-narceja-100">
                  <i class="pi pi-plus text-xs"></i>
                </button>
              </div>
              <p class="w-16 text-right text-sm font-semibold text-narceja-700 dark:text-narceja-400 flex-shrink-0">
                {{ formatCurrency(item.total_price) }}
              </p>
            </div>
          </div>

          <!-- Pagamento -->
          <div class="border-t border-gray-100 dark:border-gray-700 p-4 space-y-3 flex-shrink-0">
            <!-- Desconto -->
            <div class="flex items-center gap-2">
              <select v-model="cart.discountType" class="input text-sm flex-1">
                <option value="">Sem desconto</option>
                <option value="percent">% Percentual</option>
                <option value="value">R$ Valor fixo</option>
              </select>
              <input v-if="cart.discountType" v-model.number="cart.discountValue" type="number" min="0" step="0.01" class="input text-sm w-24" placeholder="0" />
            </div>
            <!-- Cliente -->
            <input v-model="cart.customerName" type="text" class="input text-sm" placeholder="Nome do cliente (opcional)" />
            <!-- Pagamento -->
            <div class="grid grid-cols-3 gap-1.5">
              <button v-for="pm in paymentMethods" :key="pm.value" type="button"
                @click="cart.paymentMethod = pm.value as PaymentMethod"
                :class="['py-2 px-2 rounded-xl text-xs font-medium border transition-all',
                  cart.paymentMethod === pm.value
                    ? 'bg-narceja-500 border-narceja-500 text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400']">
                {{ pm.label }}
              </button>
            </div>
            <!-- Troco -->
            <div v-if="cart.paymentMethod === 'cash'" class="flex items-center gap-2">
              <label class="text-xs text-gray-500 whitespace-nowrap">Valor pago:</label>
              <input v-model.number="cart.amountPaid" type="number" step="0.01" min="0" class="input text-sm flex-1" />
              <span v-if="cart.changeAmount > 0" class="text-xs text-green-600 font-medium whitespace-nowrap">Troco: {{ formatCurrency(cart.changeAmount) }}</span>
            </div>
            <!-- Resumo -->
            <div class="space-y-1 text-sm">
              <div class="flex justify-between text-gray-500">
                <span>Subtotal</span><span>{{ formatCurrency(cart.subtotal) }}</span>
              </div>
              <div v-if="cart.discountAmount > 0" class="flex justify-between text-red-500">
                <span>Desconto</span><span>-{{ formatCurrency(cart.discountAmount) }}</span>
              </div>
              <div class="flex justify-between font-bold text-gray-900 dark:text-white text-base border-t border-gray-100 dark:border-gray-700 pt-2">
                <span>Total</span>
                <span class="text-narceja-700 dark:text-narceja-400">{{ formatCurrency(cart.total) }}</span>
              </div>
            </div>
            <button @click="finalizeSale" :disabled="cart.items.length === 0 || saving"
              class="w-full btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50 text-base rounded-xl">
              <i v-if="saving" class="pi pi-spin pi-spinner"></i>
              <i v-else class="pi pi-check"></i>
              <span>{{ saving ? 'Finalizando...' : 'Finalizar Venda' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>

  <!-- Receipt Modal -->
  <Dialog v-model:visible="showReceipt" header="Venda Finalizada! 🎉" modal :style="{ width: '400px' }">
    <div class="text-center space-y-4">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <i class="pi pi-check text-green-600 text-2xl"></i>
      </div>
      <div>
        <p class="font-semibold text-gray-900 dark:text-white">Venda #{{ lastSale?.sale_number }}</p>
        <p class="text-2xl font-bold text-narceja-700 dark:text-narceja-400">{{ formatCurrency(lastSale?.total || 0) }}</p>
        <p v-if="lastSale?.change_amount && lastSale.change_amount > 0" class="text-sm text-green-600 mt-1">
          Troco: {{ formatCurrency(lastSale.change_amount) }}
        </p>
      </div>
      <div class="flex gap-3">
        <button @click="showReceipt = false" class="flex-1 btn-secondary">Fechar</button>
        <RouterLink to="/vendas" class="flex-1 btn-primary text-center">Ver Vendas</RouterLink>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import { useCartStore } from '@/stores/cart'
import { useSalesStore } from '@/stores/sales'
import { useProductsStore } from '@/stores/products'
import { useAuthStore } from '@/stores/auth'
import { formatCurrency } from '@/utils/formatters'
import { useToast } from '@/composables/useToast'
import type { Product, Sale, PaymentMethod } from '@/types'

const cart = useCartStore()
const salesStore = useSalesStore()
const productsStore = useProductsStore()
const authStore = useAuthStore()
const toast = useToast()

const search = ref('')
const saving = ref(false)
const showReceipt = ref(false)
const showCart = ref(false)
const lastSale = ref<Sale | null>(null)

const paymentMethods = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'credit_card', label: 'Crédito' },
  { value: 'debit_card', label: 'Débito' },
  { value: 'voucher', label: 'Voucher' },
  { value: 'mixed', label: 'Misto' },
]

const filteredProducts = computed(() => {
  const q = search.value.toLowerCase()
  return productsStore.products.filter(p =>
    !q || p.name.toLowerCase().includes(q) || p.barcode?.includes(q) || p.sku?.toLowerCase().includes(q)
  )
})

function incrementItem(item: { product_id: string; quantity: number }) {
  const product = productsStore.products.find(p => p.id === item.product_id)
  if (product && item.quantity >= product.stock_quantity) {
    toast.error(`Estoque insuficiente. Disponível: ${product.stock_quantity}`)
    return
  }
  cart.updateQuantity(item.product_id, item.quantity + 1)
}

function addToCart(product: Product) {
  const existingItem = cart.items.find(i => i.product_id === product.id)
  const currentQty = existingItem?.quantity ?? 0
  if (currentQty >= product.stock_quantity) {
    toast.error(`Estoque insuficiente. Disponível: ${product.stock_quantity}`)
    return
  }
  cart.addItem({
    product_id: product.id,
    product_name: product.name,
    product_barcode: product.barcode,
    unit_price: product.sale_price,
    cost_price: product.cost_price,
    quantity: 1,
    discount_value: 0,
    image_url: product.image_url,
  })
}


async function finalizeSale() {
  if (cart.items.length === 0) return
  saving.value = true
  try {
    const sale = await salesStore.create({
      items: [...cart.items],
      customerName: cart.customerName || undefined,
      discountType: cart.discountType || undefined,
      discountValue: cart.discountValue,
      discountAmount: cart.discountAmount,
      subtotal: cart.subtotal,
      total: cart.total,
      paymentMethod: cart.paymentMethod,
      amountPaid: cart.paymentMethod === 'cash' ? cart.amountPaid : cart.total,
      changeAmount: cart.changeAmount,
      soldBy: authStore.profile?.id,
    })
    lastSale.value = sale
    cart.clearCart()
    showCart.value = false
    showReceipt.value = true

    // Atualizar estoque dos produtos no estado local
    await productsStore.fetchProducts()
  } catch (err: unknown) {
    const e = err as { message?: string }
    toast.error(e?.message || 'Erro ao finalizar venda.')
  } finally {
    saving.value = false
  }
}

onMounted(() => productsStore.fetchProducts())
</script>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.25s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-active .absolute.bottom-0,
.drawer-leave-active .absolute.bottom-0 {
  transition: transform 0.3s ease;
}
.drawer-enter-from .absolute.bottom-0,
.drawer-leave-to .absolute.bottom-0 {
  transform: translateY(100%);
}
</style>
