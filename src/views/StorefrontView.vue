<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { refDebounced } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { tv } from 'tailwind-variants'
import { useStoreBuilderStore } from '@/stores/storeBuilder'
import { loadStoreBySlug } from '@/services/storeService'
import { loadProducts } from '@/services/productService'
import { trackProductView, trackStoreView } from '@/services/analyticsService'
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
const displayDescription = computed(() =>
  props.slug ? publicStoreData.value?.description ?? '' : store.storeData.description,
)
const displayBanner = computed(() =>
  props.slug ? publicStoreData.value?.banner ?? null : store.storeData.banner,
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

const loading = ref(true)
const ready = ref(false)
const search = ref('')
const debouncedSearch = refDebounced(search, 300)
const activeTag = ref<string | null>(null)
const mobileGridMode = ref<'single' | 'double'>('single')
const selectedProduct = ref<Product | null>(null)
const scrollRef = ref<HTMLElement | null>(null)
const sticky = ref(false)
const showTop = ref(false)
const isMobileViewport = ref(false)

let observer: IntersectionObserver | null = null
let mobileMediaQuery: MediaQueryList | null = null

const MOBILE_GRID_STORAGE_KEY = 'alwib-storefront-mobile-grid'

function syncMobileViewport() {
  isMobileViewport.value = mobileMediaQuery?.matches ?? false
}

onMounted(async () => {
  if (props.slug) {
    try {
      const storeRow = await loadStoreBySlug(props.slug)
      if (!storeRow) {
        notFound.value = true
        loading.value = false
        ready.value = true
        return
      }
      const { id, theme, ...rest } = storeRow
      publicStoreData.value = { ...rest, theme }
      applyTheme(theme)
      applyPageMeta(rest.name, rest.photo)
      void trackStoreView(id)

      // Загружаем товары отдельно — прелоадер показывает магазин с именем/лого,
      // а товары доезжают чуть позже
      loading.value = false
      publicProducts.value = await loadProducts(id)
    } catch {
      notFound.value = true
      loading.value = false
      ready.value = true
    }
  } else {
    loading.value = false
  }

  mobileMediaQuery = window.matchMedia('(max-width: 540px)')
  syncMobileViewport()
  const savedGridMode = localStorage.getItem(MOBILE_GRID_STORAGE_KEY)
  if (savedGridMode === 'single' || savedGridMode === 'double') {
    mobileGridMode.value = savedGridMode
  }
  mobileMediaQuery.addEventListener('change', syncMobileViewport)

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
  mobileMediaQuery?.removeEventListener('change', syncMobileViewport)
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

function handleProductOpen(product: Product) {
  selectedProduct.value = product
  if (props.slug) {
    void trackProductView(product.id)
  }
}

function onScroll() {
  const el = scrollRef.value
  if (!el) return
  sticky.value = el.scrollTop > 60
  showTop.value = el.scrollTop > 300
}

function setMobileGridMode(mode: 'single' | 'double') {
  mobileGridMode.value = mode
  localStorage.setItem(MOBILE_GRID_STORAGE_KEY, mode)
}

const isCompactGrid = computed(() => isMobileViewport.value && mobileGridMode.value === 'double')
const gridStyle = computed(() => {
  if (!isMobileViewport.value) return undefined
  return {
    gridTemplateColumns: `repeat(${mobileGridMode.value === 'double' ? 2 : 1}, minmax(0, 1fr))`,
    gap: mobileGridMode.value === 'double' ? '0.75rem' : '1.25rem',
  }
})

const styles = tv({
  slots: {
    wrap: 'relative h-screen overflow-y-auto bg-[var(--bg)] transition-[background] duration-300',
    backBtn:
      'fixed top-4 left-4 z-[100] flex items-center gap-1.5 px-3.5 py-2 bg-[var(--surface)] border border-[var(--border-color)] rounded-full text-[13px] font-semibold text-[var(--text)] shadow-[0_2px_12px_rgba(0,0,0,0.1)] transition-all duration-[180ms] hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)] stagger-in cursor-pointer',
    banner:
      'relative h-[220px] sm:h-[280px] lg:h-[360px] overflow-hidden bg-gradient-to-br from-[rgba(var(--accent-rgb),_0.2)] to-[rgba(var(--accent-rgb),_0.05)]',
    bannerHasPhoto: 'bg-[var(--surface-alt)]',
    bannerBackdrop: 'absolute inset-0',
    bannerBackdropImg: 'w-full h-full object-cover scale-[1.08] blur-[12px] opacity-40',
    bannerMedia: 'absolute inset-0',
    bannerImg: 'w-full h-full object-cover object-center',
    bannerOverlay:
      'absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end px-6 sm:px-8 pb-7',
    bannerOverlayPhoto:
      'bg-[linear-gradient(90deg,rgba(8,6,3,0.84)_0%,rgba(8,6,3,0.56)_28%,rgba(8,6,3,0.14)_62%,rgba(8,6,3,0.1)_100%),linear-gradient(180deg,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.36)_100%)]',
    bannerHead: 'flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5',
    bannerCopy:
      'max-w-[560px] px-4 py-3 sm:px-5 sm:py-4 rounded-[24px] bg-black/28 backdrop-blur-[8px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.2)]',
    logoFrame:
      'w-[96px] h-[96px] sm:w-[116px] sm:h-[116px] rounded-full border border-white/35 bg-white/90 shadow-[0_12px_36px_rgba(0,0,0,0.22)] overflow-hidden shrink-0',
    logoImg: 'w-full h-full object-cover',
    logoPlaceholder:
      'w-full h-full bg-white/80 text-[var(--accent)] text-2xl font-black flex items-center justify-center',
    bannerTitle: 'text-[26px] sm:text-[32px] font-extrabold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.3)] stagger-in',
    bannerDescription:
      'max-w-[680px] mt-2 text-[14px] sm:text-[15px] leading-6 text-white/92 [text-shadow:0_1px_3px_rgba(0,0,0,0.26)] stagger-in',
    bannerDomain: 'text-[13px] text-white/80 mt-1 stagger-in',
    stickyBar:
      'sticky top-0 z-50 bg-[var(--bg)] border-b border-transparent transition-[background,border-color,backdrop-filter] duration-200',
    stickyBarScrolled:
      'bg-[var(--bg)]/88 backdrop-blur-[12px] border-b-[var(--border-color)]',
    stickyInner: 'max-w-[1100px] mx-auto px-6 py-3.5 flex flex-col gap-2.5',
    controlsRow: 'flex flex-col gap-2 sm:gap-2.5',
    searchWrap: 'relative',
    searchIcon:
      'absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)] pointer-events-none',
    searchInput:
      'w-full py-2.5 pl-[38px] pr-10 border border-[var(--border-color)] rounded-full text-sm text-[var(--text)] bg-[var(--surface)] transition-[border-color,box-shadow,background,color] duration-[180ms] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(var(--accent-rgb),_0.12)] outline-none',
    searchClear:
      'absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)] flex items-center p-[3px] transition-[color] duration-[180ms] hover:text-[var(--text)] fade-in cursor-pointer border-0 bg-transparent',
    tagRow: 'flex gap-1.5 overflow-x-auto pb-0.5',
    mobileViewSwitcher: 'flex items-center justify-between gap-3 min-[541px]:hidden',
    mobileViewLabel: 'text-[12px] font-semibold text-[var(--text-sub)]',
    mobileViewBtn:
      'inline-flex items-center justify-center w-10 h-10 rounded-full border border-[var(--border-color)] bg-[var(--surface)] text-[var(--text)] transition-[border-color,background,color,transform] duration-[180ms] cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent)] active:scale-[0.97]',
    tagChip:
      'px-3.5 py-[5px] rounded-full text-xs font-semibold border-[1.5px] border-[var(--border-color)] text-[var(--text-sub)]  whitespace-nowrap transition-all duration-[180ms] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[rgba(var(--accent-rgb),_0.06)] cursor-pointer',
    tagChipActive:
      'text-white hover:text-white hover:bg-[var(--accent)] bg-[var(--accent)] border-[var(--accent)]',
    main: 'max-w-[1100px] mx-auto px-6 py-7 pb-[96px]',
    grid: 'grid grid-store-cols gap-5',
    footer:
      'fixed w-full bottom-0 z-40 border-t border-[var(--border-color)] bg-[var(--surface)]/95 backdrop-blur-[10px] transition-[background,border-color] duration-300',
    footerCard:
      'max-w-[1100px] mx-auto px-6 py-3 flex items-center justify-center text-center',
    footerMadeWith: 'text-[13px] text-[var(--text-sub)]',
    footerMadeWithLink:
      'text-[var(--accent)] font-semibold hover:opacity-80 transition-opacity duration-[180ms]',
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
      :loading="loading"
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

    <!-- Store header -->
    <div :class="[s.banner(), displayBanner && s.bannerHasPhoto()]">
      <div v-if="displayBanner" :class="s.bannerBackdrop()">
        <img :src="displayBanner" alt="" aria-hidden="true" :class="s.bannerBackdropImg()" />
      </div>
      <div v-if="displayBanner" :class="s.bannerMedia()">
        <img :src="displayBanner" alt="Баннер магазина" :class="s.bannerImg()" />
      </div>
      <div :class="[s.bannerOverlay(), displayBanner && s.bannerOverlayPhoto()]">
        <div :class="[s.bannerHead(), displayBanner && s.bannerCopy()]">
          <div :class="s.logoFrame()">
            <img
              v-if="displayPhoto"
              :src="displayPhoto"
              alt="Логотип магазина"
              :class="s.logoImg()"
            />
            <div v-else :class="s.logoPlaceholder()">
              {{ (displayName || 'М').slice(0, 1).toUpperCase() }}
            </div>
          </div>
          <div>
            <h1 :class="s.bannerTitle()">{{ displayName || 'Мой магазин' }}</h1>
            <p v-if="displayDescription" :class="s.bannerDescription()">
              {{ displayDescription }}
            </p>
            <div v-if="displayDomain" :class="s.bannerDomain()">
              alwib.ru/{{ displayDomain }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sticky search + filter -->
    <div :class="[s.stickyBar(), sticky && s.stickyBarScrolled()]">
      <div :class="s.stickyInner()">
        <div :class="s.controlsRow()">
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

          <div v-if="isMobileViewport" :class="s.mobileViewSwitcher()">
            <span :class="s.mobileViewLabel()">Вид товаров</span>
            <button
              :class="s.mobileViewBtn()"
              :aria-label="mobileGridMode === 'double' ? 'Переключить на 1 товар в строке' : 'Переключить на 2 товара в строке'"
              :title="mobileGridMode === 'double' ? '1 товар в строке' : '2 товара в строке'"
              @click="setMobileGridMode(mobileGridMode === 'double' ? 'single' : 'double')"
            >
              <svg
                v-if="mobileGridMode === 'double'"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="4" y="5" width="16" height="14" rx="2" />
                <line x1="12" y1="5" x2="12" y2="19" />
              </svg>
              <svg
                v-else
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="5" y="5" width="14" height="14" rx="2" />
              </svg>
            </button>
          </div>
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

      <div v-else :class="s.grid()" :style="gridStyle">
        <StoreProductCard
          v-for="(product, i) in visibleProducts"
          :key="product.id"
          :product="product"
          :animIdx="i"
          :compact="isCompactGrid"
          @click="handleProductOpen(product)"
        />
      </div>

      <div ref="sentinelRef" style="height: 1px" />
    </div>

    <footer :class="s.footer()">
      <div :class="s.footerCard()">
        <p :class="s.footerMadeWith()">
          Сделано с помощью Alwib -
          <a
            :class="s.footerMadeWithLink()"
            href="https://alwib.ru"
            target="_blank"
            rel="noreferrer"
          >
            онлайн витрина
          </a>
        </p>
      </div>
    </footer>

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
