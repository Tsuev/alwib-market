<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { tv } from 'tailwind-variants'
import Dialog from 'primevue/dialog'
import type { Product } from '@/types/types'
import { formatRub, calcDiscount, placeholderSvg } from '@/composables/useImageToBase64'

const props = defineProps<{ product: Product }>()
const emit = defineEmits<{ close: [] }>()

const visible = ref(false)

onMounted(() => nextTick(() => { visible.value = true }))

const discount = calcDiscount(props.product.price, props.product.salePrice)

const styles = tv({
  slots: {
    overlay: 'bg-black/50',
    box: 'bg-[var(--surface)] rounded-[calc(var(--radius)+4px)] w-full max-w-[780px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] transition-[background] duration-300 relative overflow-hidden',
    inner: 'grid grid-cols-2',
    imgWrap: 'relative aspect-square overflow-hidden bg-[var(--surface-alt)]',
    img: 'w-full h-full object-cover',
    badge: 'absolute top-2.5 right-2.5 bg-[#E85D47] text-white text-[13px] font-bold px-2.5 py-1 rounded-full',
    closeBtn: 'absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--surface)]/80 backdrop-blur-sm text-[var(--text-sub)] hover:bg-[var(--surface-alt)] transition-[background,color] duration-[180ms]',
    info: 'p-7 pl-6 flex flex-col gap-3.5 overflow-y-auto max-h-[80vh]',
    tagsRow: 'flex gap-1.5 flex-wrap',
    tag: 'inline-flex items-center gap-1 px-2.5 py-[3px] bg-[rgba(var(--accent-rgb),_0.1)] text-[var(--accent)] rounded-full text-xs font-medium',
    name: 'text-[22px] font-extrabold text-[var(--text)] leading-snug',
    desc: 'text-sm text-[var(--text-sub)] leading-[1.7]',
    priceRow: 'flex items-baseline gap-2.5',
    priceSale: 'font-bold text-[var(--accent)] text-[22px]',
    priceOrig: 'text-sm text-[var(--text-sub)] line-through',
    priceOnly: 'font-bold text-[22px] text-[var(--text)]',
    wantBtn: 'w-full py-3.5 text-[15px] font-bold bg-[var(--accent)] text-white rounded-[var(--btn-radius)] mt-auto hover:opacity-85 active:scale-[0.98] transition-[opacity,transform] duration-[180ms]',
  },
})

const s = styles()

function handleClose() {
  visible.value = false
  setTimeout(() => emit('close'), 260)
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :modal="true"
    :closable="false"
    :draggable="false"
    :dismissableMask="true"
    @hide="emit('close')"
    :pt="{
      mask: { class: s.overlay() },
      root: { class: s.box() },
      header: { class: 'hidden' },
      content: { class: 'p-0' },
      footer: { class: 'hidden' },
    }"
  >
    <button :class="s.closeBtn()" @click="handleClose">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>

    <div :class="s.inner()">
      <div :class="s.imgWrap()">
        <img
          :src="product.photo || placeholderSvg(product.name, 500, 500)"
          :alt="product.name"
          :class="s.img()"
        />
        <span v-if="discount > 0" :class="s.badge()">−{{ discount }}%</span>
      </div>

      <div :class="s.info()">
        <div v-if="product.tags.length" :class="s.tagsRow()">
          <span v-for="t in product.tags" :key="t" :class="s.tag()">{{ t }}</span>
        </div>

        <h2 :class="s.name()">{{ product.name }}</h2>
        <p :class="s.desc()">{{ product.description }}</p>

        <div :class="s.priceRow()">
          <template v-if="product.salePrice">
            <span :class="s.priceSale()">{{ formatRub(product.salePrice) }}</span>
            <span :class="s.priceOrig()">{{ formatRub(product.price) }}</span>
          </template>
          <span v-else :class="s.priceOnly()">{{ formatRub(product.price) }}</span>
        </div>

        <button :class="s.wantBtn()">Хочу это →</button>
      </div>
    </div>
  </Dialog>
</template>

<style lang="scss" scoped>
@media (max-width: 640px) {
  :deep(.p-dialog) {
    .grid { grid-template-columns: 1fr; }
    .aspect-square { aspect-ratio: 16/9; }
  }
}
</style>
