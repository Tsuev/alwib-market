<script setup lang="ts">
import { tv } from 'tailwind-variants'
import type { Product } from '@/types/types'
import { formatRub, calcDiscount, placeholderSvg } from '@/composables/useImageToBase64'
import CartQuantityControl from '@/components/storeBuilder/CartQuantityControl.vue'

const props = withDefaults(defineProps<{
  product: Product
  animIdx: number
  compact?: boolean
  quantity?: number
}>(), {
  compact: false,
  quantity: 0,
})
const emit = defineEmits<{
  click: [product: Product]
  increment: [productId: string]
  decrement: [productId: string]
}>()

const styles = tv({
  slots: {
    root: 'bg-[var(--surface)] border border-[var(--border-color)] rounded-[var(--radius)] overflow-hidden cursor-pointer transition-[transform,box-shadow,background,border-color] duration-200 shadow-[var(--card-shadow)] hover:scale-[1.02] hover:shadow-[var(--card-shadow-hover)] stagger-in group',
    rootCompact: 'rounded-[22px]',
    imgWrap: 'relative aspect-[4/3] overflow-hidden bg-[var(--surface-alt)]',
    imgWrapCompact: 'aspect-square',
    img: 'w-full h-full object-cover transition-transform duration-[400ms] group-hover:scale-[1.04]',
    cartControl: 'absolute top-2.5 left-2.5 z-10',
    cartControlCompact: 'top-2 left-2',
    badge:
      'absolute top-2.5 right-2.5 bg-[#E85D47] text-white text-[11px] font-bold px-2 py-[3px] rounded-full',
    badgeCompact: 'top-2 right-2 text-[10px] px-1.5 py-[2px]',
    body: 'p-3.5 flex flex-col gap-1.5',
    bodyCompact: 'p-2.5 gap-1.5',
    tagsRow: 'flex gap-1 flex-wrap',
    tag: 'inline-flex px-[7px] py-[2px] bg-[rgba(var(--accent-rgb),_0.1)] text-[var(--accent)] rounded-full text-[11px] font-medium',
    tagCompact: 'px-1.5 py-[1px] text-[10px]',
    name: 'text-[15px] font-bold text-[var(--text)] line-clamp-2 leading-snug',
    nameCompact: 'text-[13px] leading-[1.25]',
    desc: 'text-[13px] text-[var(--text-sub)] line-clamp-2 leading-relaxed whitespace-pre-wrap break-words [tab-size:4]',
    descCompact: 'hidden',
    footer: 'flex items-center justify-between gap-2 mt-0.5',
    footerCompact: 'flex-col items-stretch gap-2 mt-1',
    priceWrap: 'flex items-baseline gap-1.5 flex-wrap',
    priceWrapCompact: 'gap-1',
    priceSale: 'font-bold text-[var(--accent)]',
    priceSaleCompact: 'text-[13px]',
    priceOrig: 'text-[13px] text-[var(--text-sub)] line-through ml-1',
    priceOrigCompact: 'text-[11px] ml-0',
    priceOnly: 'font-bold text-[15px] text-[var(--text)]',
    priceOnlyCompact: 'text-[13px]',
    viewBtn:
      'py-[7px] px-3.5 rounded-[var(--btn-radius)] text-xs font-bold bg-[rgba(var(--accent-rgb),_0.1)] text-[var(--accent)] transition-[background,color] duration-[180ms] hover:bg-[var(--accent)] hover:text-white whitespace-nowrap shrink-0',
    viewBtnCompact: 'w-full px-2.5 py-2 text-[11px] justify-center',
  },
})

const {
  root,
  rootCompact,
  imgWrap,
  imgWrapCompact,
  img,
  cartControl,
  cartControlCompact,
  badge,
  badgeCompact,
  body,
  bodyCompact,
  tagsRow,
  tag,
  tagCompact,
  name,
  nameCompact,
  desc,
  descCompact,
  footer,
  footerCompact,
  priceWrap,
  priceWrapCompact,
  priceSale,
  priceSaleCompact,
  priceOrig,
  priceOrigCompact,
  priceOnly,
  priceOnlyCompact,
  viewBtn,
  viewBtnCompact,
} = styles()

const discount = calcDiscount(props.product.price, props.product.salePrice)
</script>

<template>
  <div
    :class="[root(), props.compact && rootCompact()]"
    :style="{ animationDelay: `${Math.min(animIdx, 5) * 60}ms` }"
    @click="emit('click', product)"
  >
    <div :class="[imgWrap(), props.compact && imgWrapCompact()]">
      <img
        :src="product.photo || placeholderSvg(product.name)"
        :alt="product.name"
        :class="img()"
        loading="lazy"
      />
      <div :class="[cartControl(), props.compact && cartControlCompact()]">
        <CartQuantityControl
          :quantity="props.quantity"
          :size="props.compact ? 'xs' : 'sm'"
          floating
          @increment="emit('increment', product.id)"
          @decrement="emit('decrement', product.id)"
        />
      </div>
      <span v-if="discount > 0" :class="[badge(), props.compact && badgeCompact()]">−{{ discount }}%</span>
    </div>

    <div :class="[body(), props.compact && bodyCompact()]">
      <div v-if="product.tags.length" :class="tagsRow()">
        <span
          v-for="t in product.tags.slice(0, props.compact ? 2 : 3)"
          :key="t"
          :class="[tag(), props.compact && tagCompact()]"
        >
          {{ t }}
        </span>
      </div>
      <div :class="[name(), props.compact && nameCompact()]">{{ product.name }}</div>
      <div :class="[desc(), props.compact && descCompact()]">{{ product.description }}</div>
      <div :class="[footer(), props.compact && footerCompact()]">
        <div :class="[priceWrap(), props.compact && priceWrapCompact()]">
          <template v-if="product.salePrice">
            <span :class="[priceSale(), props.compact && priceSaleCompact()]">{{ formatRub(product.salePrice) }}</span>
            <span :class="[priceOrig(), props.compact && priceOrigCompact()]">{{ formatRub(product.price) }}</span>
          </template>
          <span v-else :class="[priceOnly(), props.compact && priceOnlyCompact()]">{{ formatRub(product.price) }}</span>
        </div>
        <button :class="[viewBtn(), props.compact && viewBtnCompact()]" @click.stop="emit('click', product)">Посмотреть</button>
      </div>
    </div>
  </div>
</template>
