<script setup lang="ts">
import { ref } from 'vue'
import { tv } from 'tailwind-variants'
import Button from 'primevue/button'
import type { Product } from '@/types/types'
import { formatRub, calcDiscount, placeholderSvg } from '@/composables/useImageToBase64'

const props = withDefaults(defineProps<{ product: Product; animIdx: number; locked?: boolean }>(), {
  locked: false,
})
const emit = defineEmits<{
  edit: [product: Product]
  duplicate: [product: Product]
  delete: [id: string]
  lockedClick: []
}>()

const leaving = ref(false)
const viewsFormatter = new Intl.NumberFormat('ru-RU')

const styles = tv({
  slots: {
    root: 'flex items-center gap-3.5 p-3 border border-[var(--border-color)] rounded-[var(--radius)] bg-[var(--surface)] transition-[box-shadow,background,border-color,opacity,transform] duration-200 stagger-in hover:shadow-[0_2px_10px_rgba(0,0,0,0.08)]',
    rootLeaving: 'opacity-0 scale-[0.96]',
    rootLocked: 'relative overflow-hidden bg-[var(--surface-alt)]',
    thumb: 'w-14 h-14 rounded-[calc(var(--radius)-2px)] overflow-hidden shrink-0',
    thumbImg: 'w-full h-full object-cover',
    thumbLocked: 'opacity-45 blur-[1px]',
    body: 'flex-1 min-w-0',
    bodyLocked: 'opacity-55',
    head: 'flex items-start gap-2',
    name: 'text-sm font-semibold text-[var(--text)] truncate',
    views: 'inline-flex items-center gap-1 text-[11px] text-[var(--text-sub)] whitespace-nowrap shrink-0',
    priceRow: 'flex items-center gap-2 mt-0.5',
    priceMain: 'font-bold text-[var(--text)] text-sm',
    priceStrike: 'text-xs text-[var(--text-sub)] line-through',
    pricePct:
      'text-[11px] font-bold text-white bg-[#E85D47] px-1.5 py-[1px] rounded',
    tagsRow: 'flex gap-1 flex-wrap mt-1',
    tag: 'inline-flex px-[7px] py-[2px] bg-[rgba(var(--accent-rgb),_0.1)] text-[var(--accent)] rounded-full text-[11px] font-medium',
    actions: 'flex gap-1 shrink-0',
    lockOverlay:
      'absolute inset-0 flex items-center justify-center bg-[rgba(10,10,10,0.36)] backdrop-blur-[2px]',
    lockButton:
      'inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/70 px-4 py-2 text-xs font-bold text-white cursor-pointer',
  },
})

const {
  root,
  rootLeaving,
  rootLocked,
  thumb,
  thumbImg,
  thumbLocked,
  body,
  bodyLocked,
  head,
  name,
  views,
  priceRow,
  priceMain,
  priceStrike,
  pricePct,
  tagsRow,
  tag,
  actions,
  lockOverlay,
  lockButton,
} = styles()

function handleDelete() {
  leaving.value = true
  setTimeout(() => emit('delete', props.product.id), 260)
}
</script>

<template>
  <div
    :class="[root(), props.locked && rootLocked(), leaving && rootLeaving()]"
    :style="{ animationDelay: `${Math.min(animIdx, 5) * 60}ms` }"
  >
    <div :class="thumb()">
      <img
        :src="product.photo || placeholderSvg(product.name)"
        :alt="product.name"
        :class="[thumbImg(), props.locked && thumbLocked()]"
      />
    </div>

    <div :class="[body(), props.locked && bodyLocked()]">
      <div :class="head()">
        <div :class="name()">{{ product.name }}</div>
        <div :class="views()" title="Просмотры карточки">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>{{ viewsFormatter.format(product.views) }}</span>
        </div>
      </div>
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

    <div v-if="!props.locked" :class="actions()">
      <Button
        title="Дублировать"
        text
        rounded
        :pt="{
          root: {
            class:
              'w-[30px] h-[30px] flex items-center justify-center rounded-md text-[var(--text-sub)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)] transition-[background,color] duration-[180ms]',
          },
        }"
        @click="emit('duplicate', product)"
      >
        <template #icon>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </template>
      </Button>
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

    <div v-if="props.locked" :class="lockOverlay()">
      <button type="button" :class="lockButton()" @click="emit('lockedClick')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <path d="M7 11V8a5 5 0 0 1 10 0v3" />
        </svg>
        Открыть в Pro
      </button>
    </div>
  </div>
</template>
