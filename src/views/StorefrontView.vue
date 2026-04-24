<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { refDebounced } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { tv } from 'tailwind-variants'
import { useStoreBuilderStore } from '@/stores/storeBuilder'
import { loadStoreBySlug } from '@/services/storeService'
import { loadProducts } from '@/services/productService'
import { applyTheme } from '@/composables/useTheme'
import StorePreloader from '@/components/storeBuilder/StorePreloader.vue'
import StoreProductCard from '@/components/storeBuilder/StoreProductCard.vue'
import ProductDetailDialog from '@/components/storeBuilder/ProductDetailDialog.vue'
import type { Product, StoreData } from '@/types/types'

const props = defineProps<{ slug?: string }>()

const originalTitle = document.title

function setMetaTag(attr: string, key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

const originalFavicon = (document.querySelector<HTMLLinkElement>('link[rel="icon"]'))?.href ?? ''

function setFavicon(url: string | null) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'icon'
    document.head.appendChild(el)
  }
  el.href = url ?? ''
  el.type = 'image/png'
}

function applyPageMeta(name: string, photo: string | null) {
  document.title = name || 'Магазин'
  setMetaTag('property', 'og:title', name)
  setMetaTag('name', 'twitter:title', name)
  if (photo) {
    setMetaTag('property', 'og:image', photo)
    setMetaTag('name', 'twitter:image', photo)
    setFavicon(photo)
  }
}

onUnmounted(() => {
  document.title = originalTitle
  setFavicon(originalFavicon || null)
})

const router = useRouter()
const store = useStoreBuilderStore()

// Public mode state (only used when slug prop is present)
const publicStoreData = ref<(StoreData & { theme: string }) | null>(null)
const publicProducts = ref<Product[]>([])
const notFound = ref(false)

// Unified accessors — template always uses these
const displayName = computed(() =>
  props.slug ? publicStoreData.value?.name ?? '' : store.storeData.name,
)
const displayPhoto = computed(() =>
  props.slug ? publicStoreData.value?.photo ?? null : store.storeData.photo,
)
const displayDomain = computed(() =>
  props.slug ? publicStoreData.value?.domain ?? '' : store.storeData.domain,
)
const displayWhatsapp = computed(() =>
  props.slug ? publicStoreData.value?.whatsapp ?? null : store.storeData.whatsapp,
)
const displayTelegram = computed(() =>
  props.slug ? publicStoreData.value?.telegram ?? null : store.storeData.telegram,
)
const displayProducts = computed(() =>
  props.slug ? publicProducts.value : store.products,
)

const ready = ref(false)
const search = ref('')
const debouncedSearch = refDebounced(search, 300)
const activeTag = ref<string | null>(null)
const selectedProduct = ref<Product | null>(null)
const scrollRef = ref<HTMLElement | null>(null)
const sticky = ref(false)
const showTop = ref(false)

let observer: IntersectionObserver | null = null

onMounted(async () => {
  if (props.slug) {
    try {
      const storeRow = await loadStoreBySlug(props.slug)
      if (!storeRow) {
        notFound.value = true
        ready.value = true
        return
      }
      const { id, theme, ...rest } = storeRow
      publicStoreData.value = { ...rest, theme }
      publicProducts.value = await loadProducts(id)
      applyTheme(theme)
      applyPageMeta(rest.name, rest.photo)
    } catch {
      notFound.value = true
    } finally {
      ready.value = true
    }
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore.value) {
        visibleCount.value += PAGE_SIZE
      }
    },
    { root: scrollRef.value, rootMargin: '200px' },
  )
  if (sentinelRef.value) observer.observe(sentinelRef.value)
})

onUnmounted(() => {
  observer?.disconnect()
})

const allTags = computed(() => [...new Set(displayProducts.value.flatMap((p) => p.tags))])

const filtered = computed(() => {
  const q = debouncedSearch.value.toLowerCase()
  return displayProducts.value.filter((p) => {
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some((t) => t.includes(q))
    const matchTag = !activeTag.value || p.tags.includes(activeTag.value)
    return matchSearch && matchTag
  })
})

const PAGE_SIZE = 16
const visibleCount = ref(PAGE_SIZE)
const visibleProducts = computed(() => filtered.value.slice(0, visibleCount.value))
const hasMore = computed(() => visibleCount.value < filtered.value.length)
const sentinelRef = ref<HTMLElement | null>(null)

watch(filtered, () => { visibleCount.value = PAGE_SIZE })

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
      'px-3.5 py-[5px] rounded-full text-xs font-semibold border-[1.5px] border-[var(--border-color)] text-[var(--text-sub)]  whitespace-nowrap transition-all duration-[180ms] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[rgba(var(--accent-rgb),_0.06)] cursor-pointer',
    tagChipActive:
      'text-white hover:text-white hover:bg-[var(--accent)] bg-[var(--accent)] border-[var(--accent)]',
    main: 'max-w-[1100px] mx-auto px-6 py-7 pb-[60px]',
    grid: 'grid grid-store-cols gap-5',
    empty:
      'flex flex-col items-center gap-2.5 py-20 px-5 text-center text-[var(--text-sub)] fade-in',
    emptyTitle: 'text-lg font-semibold text-[var(--text)]',
    emptySmall: 'text-sm',
    notFound:
      'h-screen flex flex-col items-center justify-center gap-4 text-center px-6',
    notFoundCode: 'text-[80px] font-extrabold text-[var(--accent)] leading-none',
    notFoundTitle: 'text-2xl font-bold text-[var(--text)]',
    notFoundSub: 'text-[var(--text-sub)] text-sm',
    scrollTopBtn:
      'fixed bottom-7 right-6 w-11 h-11 bg-[var(--text)] text-[var(--bg)] rounded-full flex items-center justify-center opacity-0 pointer-events-none transition-[opacity,transform] duration-200 shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:-translate-y-0.5',
    scrollTopBtnVisible: 'opacity-100 pointer-events-auto',
  },
})

const s = styles()
</script>

<template>
  <!-- Not found (public mode only) -->
  <div v-if="notFound" :class="s.notFound()">
    <div :class="s.notFoundCode()">404</div>
    <h1 :class="s.notFoundTitle()">Магазин не найден</h1>
    <p :class="s.notFoundSub()">Страница <b>alwib.ru/{{ props.slug }}</b> не существует</p>
  </div>

  <div v-else :class="s.wrap()" ref="scrollRef" @scroll="onScroll">
    <!-- Preloader (preview mode always shows it; public mode shows until data is loaded) -->
    <StorePreloader
      v-if="!ready"
      :name="displayName || 'Магазин'"
      :photo="displayPhoto"
      @done="ready = true"
    />

    <!-- Back button — only in preview mode -->
    <button v-if="!props.slug" :class="s.backBtn()" @click="router.push('/')">
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
        v-if="displayPhoto"
        :src="displayPhoto"
        alt="banner"
        :class="s.bannerImg()"
      />
      <div v-else :class="s.bannerPlaceholder()" />
      <div :class="s.bannerOverlay()">
        <h1 :class="s.bannerTitle()">{{ displayName || 'Мой магазин' }}</h1>
        <div v-if="displayDomain" :class="s.bannerDomain()">
          alwib.ru/{{ displayDomain }}
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
          v-for="(product, i) in visibleProducts"
          :key="product.id"
          :product="product"
          :animIdx="i"
          @click="selectedProduct = product"
        />
      </div>

      <div ref="sentinelRef" style="height: 1px" />
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
    :whatsapp="displayWhatsapp"
    :telegram="displayTelegram"
    @close="selectedProduct = null"
  />
</template>

<style lang="scss" scoped>
/* Hide scrollbars on tag filter row */
.overflow-x-auto::-webkit-scrollbar {
  display: none;
}
</style>
