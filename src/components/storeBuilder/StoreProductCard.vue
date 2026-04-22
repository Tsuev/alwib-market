<script setup lang="ts">
import { tv } from 'tailwind-variants'
import type { Product } from '@/types/types'
import { formatRub, calcDiscount, placeholderSvg } from '@/composables/useImageToBase64'

const props = defineProps<{ product: Product; animIdx: number }>()
const emit = defineEmits<{ click: [product: Product] }>()

const styles = tv({
  slots: {
    root: 'bg-[var(--surface)] border border-[var(--border-color)] rounded-[var(--radius)] overflow-hidden cursor-pointer transition-[transform,box-shadow,background,border-color] duration-200 shadow-[var(--card-shadow)] hover:scale-[1.02] hover:shadow-[var(--card-shadow-hover)] stagger-in group',
    imgWrap: 'relative aspect-[4/3] overflow-hidden bg-[var(--surface-alt)]',
    img: 'w-full h-full object-cover transition-transform duration-[400ms] group-hover:scale-[1.04]',
    badge:
      'absolute top-2.5 right-2.5 bg-[#E85D47] text-white text-[11px] font-bold px-2 py-[3px] rounded-full',
    body: 'p-3.5 flex flex-col gap-1.5',
    tagsRow: 'flex gap-1 flex-wrap',
    tag: 'inline-flex px-[7px] py-[2px] bg-[rgba(var(--accent-rgb),_0.1)] text-[var(--accent)] rounded-full text-[11px] font-medium',
    name: 'text-[15px] font-bold text-[var(--text)] line-clamp-2 leading-snug',
    desc: 'text-[13px] text-[var(--text-sub)] line-clamp-2 leading-relaxed',
    footer: 'flex items-center justify-between gap-2 mt-0.5',
    priceWrap: 'flex items-baseline gap-1.5 flex-wrap',
    priceSale: 'font-bold text-[var(--accent)]',
    priceOrig: 'text-[13px] text-[var(--text-sub)] line-through ml-1',
    priceOnly: 'font-bold text-[15px] text-[var(--text)]',
    viewBtn:
      'py-[7px] px-3.5 rounded-[var(--btn-radius)] text-xs font-bold bg-[rgba(var(--accent-rgb),_0.1)] text-[var(--accent)] transition-[background,color] duration-[180ms] hover:bg-[var(--accent)] hover:text-white whitespace-nowrap shrink-0',
  },
})

const { root, imgWrap, img, badge, body, tagsRow, tag, name, desc, footer, priceWrap, priceSale, priceOrig, priceOnly, viewBtn } = styles()

const discount = calcDiscount(props.product.price, props.product.salePrice)
</script>

<template>
  <div
    :class="root()"
    :style="{ animationDelay: `${Math.min(animIdx, 5) * 60}ms` }"
    @click="emit('click', product)"
  >
    <div :class="imgWrap()">
      <img
        :src="product.photo || placeholderSvg(product.name)"
        :alt="product.name"
        :class="img()"
        loading="lazy"
      />
      <span v-if="discount > 0" :class="badge()">−{{ discount }}%</span>
    </div>

    <div :class="body()">
      <div v-if="product.tags.length" :class="tagsRow()">
        <span v-for="t in product.tags.slice(0, 3)" :key="t" :class="tag()">{{ t }}</span>
      </div>
      <div :class="name()">{{ product.name }}</div>
      <div :class="desc()">{{ product.description }}</div>
      <div :class="footer()">
        <div :class="priceWrap()">
          <template v-if="product.salePrice">
            <span :class="priceSale()">{{ formatRub(product.salePrice) }}</span>
            <span :class="priceOrig()">{{ formatRub(product.price) }}</span>
          </template>
          <span v-else :class="priceOnly()">{{ formatRub(product.price) }}</span>
        </div>
        <button :class="viewBtn()" @click.stop="emit('click', product)">Посмотреть</button>
      </div>
    </div>
  </div>
</template>
