<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { tv } from 'tailwind-variants'
import { useStoreBuilderStore } from '@/stores/storeBuilder'
import StorePreloader from '@/components/storeBuilder/StorePreloader.vue'
import StoreProductCard from '@/components/storeBuilder/StoreProductCard.vue'
import ProductDetailDialog from '@/components/storeBuilder/ProductDetailDialog.vue'
import type { Product } from '@/types/types'

const router = useRouter()
const store = useStoreBuilderStore()

const ready = ref(false)
const search = ref('')
const activeTag = ref<string | null>(null)
const selectedProduct = ref<Product | null>(null)
const scrollRef = ref<HTMLElement | null>(null)
const sticky = ref(false)
const showTop = ref(false)

const allTags = computed(() => [...new Set(store.products.flatMap((p) => p.tags))])

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return store.products.filter((p) => {
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some((t) => t.includes(q))
    const matchTag = !activeTag.value || p.tags.includes(activeTag.value)
    return matchSearch && matchTag
  })
})

function onScroll() {
  const el = scrollRef.value
  if (!el) return
  sticky.value = el.scrollTop > 60
  showTop.value = el.scrollTop > 300
}

const styles = tv({
  slots: {
    wrap: 'relative h-screen overflow-y-auto bg-[var(--bg)] transition-[background] duration-300',
    backBtn:
      'fixed top-4 left-4 z-[100] flex items-center gap-1.5 px-3.5 py-2 bg-[var(--surface)] border border-[var(--border-color)] rounded-full text-[13px] font-semibold text-[var(--text)] shadow-[0_2px_12px_rgba(0,0,0,0.1)] transition-all duration-[180ms] hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)] stagger-in cursor-pointer',
    banner: 'relative h-[240px] overflow-hidden bg-[var(--surface-alt)]',
    bannerImg: 'w-full h-full object-contain',
    bannerPlaceholder:
      'w-full h-full bg-gradient-to-br from-[rgba(var(--accent-rgb),_0.15)] to-[rgba(var(--accent-rgb),_0.04)]',
    bannerOverlay:
      'absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end px-8 pb-7',
    bannerTitle: 'text-[32px] font-extrabold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.3)] stagger-in',
    bannerDomain: 'text-[13px] text-white/70 mt-1 stagger-in',
    stickyBar:
      'sticky top-0 z-50 bg-[var(--bg)] border-b border-transparent transition-[background,border-color,backdrop-filter] duration-200',
    stickyBarScrolled:
      'bg-[var(--bg)]/88 backdrop-blur-[12px] border-b-[var(--border-color)]',
    stickyInner: 'max-w-[1100px] mx-auto px-6 py-3.5 flex flex-col gap-2.5',
    searchWrap: 'relative',
    searchIcon:
      'absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)] pointer-events-none',
    searchInput:
      'w-full py-2.5 pl-[38px] pr-10 border border-[var(--border-color)] rounded-full text-sm text-[var(--text)] bg-[var(--surface)] transition-[border-color,box-shadow,background,color] duration-[180ms] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(var(--accent-rgb),_0.12)] outline-none',
    searchClear:
      'absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)] flex items-center p-[3px] transition-[color] duration-[180ms] hover:text-[var(--text)] fade-in cursor-pointer border-0 bg-transparent',
    tagRow: 'flex gap-1.5 overflow-x-auto pb-0.5',
    tagChip:
      'px-3.5 py-[5px] rounded-full text-xs font-semibold border-[1.5px] border-[var(--border-color)] text-[var(--text-sub)] bg-transparent whitespace-nowrap transition-all duration-[180ms] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[rgba(var(--accent-rgb),_0.06)] cursor-pointer',
    tagChipActive:
      'border-[var(--accent)] bg-[var(--accent)] text-white hover:text-white hover:bg-[var(--accent)]',
    main: 'max-w-[1100px] mx-auto px-6 py-7 pb-[60px]',
    grid: 'grid grid-store-cols gap-5',
    empty:
      'flex flex-col items-center gap-2.5 py-20 px-5 text-center text-[var(--text-sub)] fade-in',
    emptyTitle: 'text-lg font-semibold text-[var(--text)]',
    emptySmall: 'text-sm',
    scrollTopBtn:
      'fixed bottom-7 right-6 w-11 h-11 bg-[var(--text)] text-[var(--bg)] rounded-full flex items-center justify-center opacity-0 pointer-events-none transition-[opacity,transform] duration-200 shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:-translate-y-0.5',
    scrollTopBtnVisible: 'opacity-100 pointer-events-auto',
  },
})

const s = styles()
</script>

<template>
  <div :class="s.wrap()" ref="scrollRef" @scroll="onScroll">
    <!-- Preloader -->
    <StorePreloader
      v-if="!ready"
      :name="store.storeData.name || 'Магазин'"
      :photo="store.storeData.photo"
      @done="ready = true"
    />

    <!-- Back button -->
    <button :class="s.backBtn()" @click="router.push('/')">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Вернуться к редактору
    </button>

    <!-- Banner -->
    <div :class="s.banner()">
      <img
        v-if="store.storeData.photo"
        :src="store.storeData.photo"
        alt="banner"
        :class="s.bannerImg()"
      />
      <div v-else :class="s.bannerPlaceholder()" />
      <div :class="s.bannerOverlay()">
        <h1 :class="s.bannerTitle()">{{ store.storeData.name || 'Мой магазин' }}</h1>
        <div v-if="store.storeData.domain" :class="s.bannerDomain()">
          alwib.ru/{{ store.storeData.domain }}
        </div>
      </div>
    </div>

    <!-- Sticky search + filter -->
    <div :class="[s.stickyBar(), sticky && s.stickyBarScrolled()]">
      <div :class="s.stickyInner()">
        <div :class="s.searchWrap()">
          <svg
            :class="s.searchIcon()"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="search"
            :class="s.searchInput()"
            placeholder="Найти товар…"
          />
          <button v-if="search" :class="s.searchClear()" @click="search = ''">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div :class="s.tagRow()">
          <button
            :class="[s.tagChip(), !activeTag && s.tagChipActive()]"
            @click="activeTag = null"
          >
            Все
          </button>
          <button
            v-for="tag in allTags"
            :key="tag"
            :class="[s.tagChip(), activeTag === tag && s.tagChipActive()]"
            @click="activeTag = tag === activeTag ? null : tag"
          >
            {{ tag }}
          </button>
        </div>
      </div>
    </div>

    <!-- Product grid -->
    <div :class="s.main()">
      <div v-if="filtered.length === 0" :class="s.empty()">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-sub)"
          stroke-width="1"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <p :class="s.emptyTitle()">Ничего не найдено</p>
        <small :class="s.emptySmall()">Попробуйте другой запрос или тег</small>
      </div>

      <div v-else :class="s.grid()">
        <StoreProductCard
          v-for="(product, i) in filtered"
          :key="product.id"
          :product="product"
          :animIdx="i"
          @click="selectedProduct = product"
        />
      </div>
    </div>

    <!-- Scroll to top -->
    <button
      :class="[s.scrollTopBtn(), showTop && s.scrollTopBtnVisible()]"
      @click="scrollRef?.scrollTo({ top: 0, behavior: 'smooth' })"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  </div>

  <!-- Product detail dialog -->
  <ProductDetailDialog
    v-if="selectedProduct"
    :product="selectedProduct"
    @close="selectedProduct = null"
  />
</template>

<style lang="scss" scoped>
/* Hide scrollbars on tag filter row */
.overflow-x-auto::-webkit-scrollbar {
  display: none;
}
</style>
