<script setup lang="ts">
import { ref } from 'vue'
import { tv } from 'tailwind-variants'
import Button from 'primevue/button'
import type { Product } from '@/types/types'
import { formatRub, calcDiscount, placeholderSvg } from '@/composables/useImageToBase64'

const props = defineProps<{ product: Product; animIdx: number }>()
const emit = defineEmits<{ edit: [product: Product]; delete: [id: number] }>()

const leaving = ref(false)

const styles = tv({
  slots: {
    root: 'flex items-center gap-3.5 p-3 border border-[var(--border-color)] rounded-[var(--radius)] bg-[var(--surface)] transition-[box-shadow,background,border-color,opacity,transform] duration-200 stagger-in hover:shadow-[0_2px_10px_rgba(0,0,0,0.08)]',
    rootLeaving: 'opacity-0 scale-[0.96]',
    thumb: 'w-14 h-14 rounded-[calc(var(--radius)-2px)] overflow-hidden shrink-0',
    thumbImg: 'w-full h-full object-cover',
    body: 'flex-1 min-w-0',
    name: 'text-sm font-semibold text-[var(--text)] truncate',
    priceRow: 'flex items-center gap-2 mt-0.5',
    priceMain: 'font-bold text-[var(--text)] text-sm',
    priceStrike: 'text-xs text-[var(--text-sub)] line-through',
    pricePct:
      'text-[11px] font-bold text-white bg-[#E85D47] px-1.5 py-[1px] rounded',
    tagsRow: 'flex gap-1 flex-wrap mt-1',
    tag: 'inline-flex px-[7px] py-[2px] bg-[rgba(var(--accent-rgb),_0.1)] text-[var(--accent)] rounded-full text-[11px] font-medium',
    actions: 'flex gap-1 shrink-0',
  },
})

const { root, rootLeaving, thumb, thumbImg, body, name, priceRow, priceMain, priceStrike, pricePct, tagsRow, tag, actions } = styles()

function handleDelete() {
  leaving.value = true
  setTimeout(() => emit('delete', props.product.id), 260)
}
</script>

<template>
  <div
    :class="[root(), leaving && rootLeaving()]"
    :style="{ animationDelay: `${Math.min(animIdx, 5) * 60}ms` }"
  >
    <div :class="thumb()">
      <img
        :src="product.photo || placeholderSvg(product.name)"
        :alt="product.name"
        :class="thumbImg()"
      />
    </div>

    <div :class="body()">
      <div :class="name()">{{ product.name }}</div>
      <div :class="priceRow()">
        <template v-if="product.salePrice">
          <span :class="priceMain()">{{ formatRub(product.salePrice) }}</span>
          <span :class="priceStrike()">{{ formatRub(product.price) }}</span>
          <span :class="pricePct()">−{{ calcDiscount(product.price, product.salePrice) }}%</span>
        </template>
        <span v-else :class="priceMain()">{{ formatRub(product.price) }}</span>
      </div>
      <div :class="tagsRow()">
        <span v-for="t in product.tags.slice(0, 3)" :key="t" :class="tag()">{{ t }}</span>
      </div>
    </div>

    <div :class="actions()">
      <Button
        title="Редактировать"
        text
        rounded
        :pt="{
          root: {
            class:
              'w-[30px] h-[30px] flex items-center justify-center rounded-md text-[var(--text-sub)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)] transition-[background,color] duration-[180ms]',
          },
        }"
        @click="emit('edit', product)"
      >
        <template #icon>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </template>
      </Button>
      <Button
        title="Удалить"
        text
        rounded
        :pt="{
          root: {
            class:
              'w-[30px] h-[30px] flex items-center justify-center rounded-md text-[var(--text-sub)] hover:bg-[rgba(232,93,71,_0.15)] hover:text-[#E85D47] transition-[background,color] duration-[180ms]',
          },
        }"
        @click="handleDelete"
      >
        <template #icon>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </template>
      </Button>
    </div>
  </div>
</template>
