<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tv } from 'tailwind-variants'
import InputText from 'primevue/inputtext'
import InputMask from 'primevue/inputmask'
import Textarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'
import { useSupabase } from '@/composables/useSupabase'
import { useStoreBuilderStore } from '@/stores/storeBuilder'
import { THEMES } from '@/constants/constants'
import { uploadPhoto } from '@/composables/useStorageUpload'
import { getSession, signOut } from '@/services/authServices'
import UploadZone from '@/components/storeBuilder/UploadZone.vue'
import AdminProductCard from '@/components/storeBuilder/AdminProductCard.vue'
import ProductFormDialog from '@/components/storeBuilder/ProductFormDialog.vue'
import PlanDialog from '@/components/storeBuilder/PlanDialog.vue'
import SubscriptionSuccessDialog from '@/components/storeBuilder/SubscriptionSuccessDialog.vue'
import { FREE_THEME_IDS } from '@/constants/constants'
import { clearPendingCheckout, getPendingCheckout } from '@/services/subscriptionService'
import type { Product } from '@/types/types'
import { useStoreBuilderTour } from '@/composables/useStoreBuilderTour'

const router = useRouter()
const route = useRoute()
const store = useStoreBuilderStore()
const toast = useToast()

const nameError = ref('')
const domainError = ref('')
const contactError = ref('')
const whatsappError = ref('')
const showModal = ref(false)
const showPlanDialog = ref(false)
const editProduct = ref<Product | null>(null)
const domainStatus = ref<'idle' | 'checking' | 'available' | 'taken'>('idle')
const domainFocused = ref(false)
const logoUploading = ref(false)
const coverUploading = ref(false)
const copied = ref(false)
const userEmailLabel = ref('')
const showSubscriptionSuccessDialog = ref(false)
let domainTimer: ReturnType<typeof setTimeout> | null = null
let domainRequestId = 0
const viewsFormatter = new Intl.NumberFormat('ru-RU')

const styles = tv({
  slots: {
    wrap: 'h-screen flex flex-col bg-[var(--bg)] transition-[background] duration-300',
    topbar:
      'bg-[var(--surface)] border-b border-[var(--border-color)] relative z-10 shrink-0 transition-[background,border-color] duration-300',
    topbarInner:
      'max-w-[900px] mx-auto px-4 sm:px-8 py-3 sm:py-0 min-h-14 flex flex-col items-center sm:flex-row sm:items-center justify-between gap-3 sm:gap-4',
    brand:
      'flex items-center justify-center gap-2.5 font-bold text-[15px] text-[var(--text)] shrink min-w-0 text-center',
    topbarActions: 'flex items-center flex-wrap justify-center sm:justify-end gap-2 min-w-0',
    userBadge:
      'inline-flex items-center px-3 py-1.5 rounded-[var(--btn-radius)] text-xs font-semibold text-[var(--text)] bg-[var(--surface-alt)] border border-[var(--border-color)] max-w-[140px] sm:max-w-[220px] truncate transition-[background,border-color] duration-300',
    supportLink:
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--btn-radius)] text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--accent)] hover:bg-[var(--surface-alt)] transition-[color,background] duration-[180ms]',
    guideBtn:
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--btn-radius)] text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--surface-alt)] transition-[color,background] duration-[180ms] border-0 bg-transparent cursor-pointer',
    logoutBtn:
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--btn-radius)] text-xs font-semibold text-[var(--text-sub)] hover:text-[#E85D47] hover:bg-[#E85D4712] transition-[color,background] duration-[180ms] border-0 bg-transparent cursor-pointer',
    themeTabs:
      'flex gap-[3px] bg-[var(--surface-alt)] rounded-[10px] p-[3px] overflow-x-auto transition-[background] duration-300',
    themeTab:
      'flex items-center gap-1.5 px-[11px] py-[5px] rounded-[7px] text-xs font-medium transition-all duration-[180ms] whitespace-nowrap shrink-0 cursor-pointer border-0',
    themeDot: 'w-2 h-2 rounded-full shrink-0',
    loadingWrap: 'flex-1 flex items-center justify-center',
    loadingSpinner:
      'w-8 h-8 border-[3px] border-[rgba(var(--accent-rgb),_0.2)] border-t-[var(--accent)] rounded-full animate-spin',
    scrollArea: 'flex-1 overflow-y-auto',
    contentInner: 'max-w-[900px] mx-auto px-4 sm:px-8 py-6 sm:py-8 pb-[132px] sm:pb-[120px]',
    section: 'mb-10',
    sectionTitle: 'text-lg font-bold text-[var(--text)]',
    sectionHeader: 'flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5',
    statsChip:
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--surface)] text-[12px] text-[var(--text-sub)]',
    statsValue: 'font-bold text-[var(--text)]',
    countBadge:
      'inline-flex items-center justify-center min-w-5 h-5 px-1.5 bg-[rgba(var(--accent-rgb),_0.12)] text-[var(--accent)] rounded-full text-[11px] font-bold ml-2',
    formGroup: 'mb-5',
    storeLogo: 'flex justify-center',
    label:
      'block text-[13px] sm:text-[14px] font-extrabold text-[var(--text)] uppercase tracking-[.08em] mb-2.5',
    input:
      'w-full px-3.5 py-2.5 border border-[var(--border-color)] rounded-[var(--radius)] text-base text-[var(--text)] bg-[var(--surface)] transition-[border-color,box-shadow,background,color] duration-[180ms] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(var(--accent-rgb),_0.12)] outline-none',
    inputInvalid: 'border-[#E85D47]',
    inputMeta: 'flex justify-between items-center min-h-5 mt-1',
    charCount: 'text-[11px] text-[var(--text-sub)] ml-auto',
    fieldError: 'text-xs text-[#E85D47] fade-in',
    fieldHint: 'text-xs mt-1',
    fieldHintGreen: 'text-[#5b8c5a]',
    fieldHintError: 'text-[#e85d47]',
    domainWrap:
      'flex items-center border border-[var(--border-color)] rounded-[var(--radius)] overflow-hidden transition-[border-color,box-shadow] duration-[180ms]',
    domainWrapFocus:
      'border-[var(--accent)] shadow-[0_0_0_3px_rgba(var(--accent-rgb),_0.12)]',
    domainPrefix:
      'px-3 py-2.5 bg-[var(--surface-alt)] border-r border-[var(--border-color)] text-[13px] text-[var(--text-sub)] whitespace-nowrap font-medium transition-[background,border-color] duration-300',
    domainInput:
      'flex-1 px-3 py-2.5 text-sm text-[var(--text)] bg-transparent border-none outline-none',
    domainStatusSlot: 'px-3 flex items-center',
    statusOk: 'text-[#5b8c5a] text-[15px] font-bold',
    statusErr: 'text-[#e85d47] text-[15px] font-bold',
    spinner:
      'w-3.5 h-3.5 border-2 border-[rgba(var(--accent-rgb),_0.2)] border-t-[var(--accent)] rounded-full animate-spin inline-block',
    addBtn:
      'inline-flex items-center justify-center gap-[7px] px-4 py-2 border-[1.5px] border-[var(--accent)] text-[var(--accent)] rounded-[var(--btn-radius)] text-[13px] font-semibold transition-[background] duration-[180ms] hover:bg-[rgba(var(--accent-rgb),_0.07)] w-full sm:w-auto',
    emptyProducts:
      'flex flex-col items-center justify-center gap-2.5 py-12 px-5 text-[var(--text-sub)] text-center border border-dashed border-[var(--border-color)] rounded-[var(--radius)] fade-in',
    emptyText: 'text-[15px] font-medium',
    productList: 'flex flex-col gap-2',
    footer:
      'shrink-0 border-t border-[var(--border-color)] bg-[var(--surface)] px-4 sm:px-8 py-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 transition-[background,border-color] duration-300',
    previewBtn:
      'inline-flex items-center justify-center gap-[7px] px-4 py-2.5 text-sm font-medium text-[var(--text-sub)] rounded-[var(--btn-radius)] hover:text-[var(--text)] hover:bg-[var(--surface-alt)] transition-[color,background] duration-[180ms] border-0 bg-transparent cursor-pointer w-full sm:w-auto',
    publishBtn:
      'inline-flex items-center justify-center gap-2 px-[22px] py-2.5 bg-[var(--accent)] text-white rounded-[var(--btn-radius)] text-sm font-semibold hover:opacity-85 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-[opacity,transform] duration-[180ms] border-0 cursor-pointer w-full sm:w-auto',
    publishSpinner:
      'w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block',
    copyBtn:
      'px-2.5 flex items-center self-stretch border-l border-[var(--border-color)] text-[var(--text-sub)] transition-[color,background] duration-[180ms] hover:bg-[var(--surface-alt)] hover:text-[var(--text)]',
    copyBtnDone: 'text-[#5b8c5a]',
    planBadge:
      'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border cursor-pointer transition-colors duration-150',
    planBadgeFree:
      'border-[var(--border-color)] text-[var(--text-sub)] bg-transparent hover:border-[var(--accent)] hover:text-[var(--accent)]',
    planBadgePro:
      'border-[var(--accent)] text-[var(--accent)] bg-[rgba(var(--accent-rgb),_0.08)] hover:bg-[rgba(var(--accent-rgb),_0.14)]',
    lockedHint: 'text-[11px] text-[var(--text-sub)] mt-1.5 flex items-center gap-1',
  },
})
const { supabase } = useSupabase()

const s = styles()

function closeProductDialog() {
  showModal.value = false
  editProduct.value = null
}

const { startTour, maybeStartTour, destroyTour } = useStoreBuilderTour({
  openProductDialog: openAdd,
  closeProductDialog,
})

onMounted(async () => {
  const session = await getSession()
  if (session) {
    userEmailLabel.value = session.user.email?.split('@')[0] || session.user.email || ''
    await store.loadData(session.user.id)
    await resolvePendingSubscription(session.user.id)
    if (!showSubscriptionSuccessDialog.value) {
      await maybeStartTour()
    }
  }
})

onBeforeUnmount(() => {
  destroyTour()
})

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function resolvePendingSubscription(userId: string): Promise<void> {
  const pendingCheckout = getPendingCheckout()
  if (!pendingCheckout) return

  if (Date.now() - pendingCheckout.startedAt > 1000 * 60 * 30) {
    clearPendingCheckout()
    return
  }

  if (store.isPro) {
    clearPendingCheckout()
    await clearSubscriptionQuery()
    showSubscriptionSuccessDialog.value = true
    return
  }

  const shouldCheckImmediately = route.query.subscription === 'success'
  const attempts = shouldCheckImmediately ? 6 : 3

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (attempt > 0 || shouldCheckImmediately) {
      await sleep(1500)
    }

    await store.loadData(userId)

    if (store.isPro) {
      clearPendingCheckout()
      await clearSubscriptionQuery()
      showSubscriptionSuccessDialog.value = true
      return
    }
  }
}

async function clearSubscriptionQuery(): Promise<void> {
  if (!('subscription' in route.query)) return

  const nextQuery = { ...route.query }
  delete nextQuery.subscription

  await router.replace({ query: nextQuery })
}

async function handleBannerUpload(file: File) {
  const session = await getSession()
  if (!session) return
  logoUploading.value = true
  try {
    store.storeData.photo = await uploadPhoto(file, session.user.id, 'store')
    await store.publishStore()
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка загрузки',
      detail: err instanceof Error ? err.message : 'Не удалось загрузить фото',
      life: 4000,
    })
  } finally {
    logoUploading.value = false
  }
}

async function handleStorePhotoChange(value: string | null) {
  store.storeData.photo = value
  try {
    await store.publishStore()
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка сохранения',
      detail: err instanceof Error ? err.message : 'Не удалось сохранить фото магазина',
      life: 4000,
    })
  }
}

async function handleStoreBannerUpload(file: File) {
  const session = await getSession()
  if (!session) return
  coverUploading.value = true
  try {
    store.storeData.banner = await uploadPhoto(file, session.user.id, 'banner')
    await store.publishStore()
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка загрузки',
      detail: err instanceof Error ? err.message : 'Не удалось загрузить баннер',
      life: 4000,
    })
  } finally {
    coverUploading.value = false
  }
}

async function handleStoreBannerChange(value: string | null) {
  store.storeData.banner = value
  try {
    await store.publishStore()
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка сохранения',
      detail: err instanceof Error ? err.message : 'Не удалось сохранить баннер магазина',
      life: 4000,
    })
  }
}

function handleDomainInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const clean = raw.replace(/[^a-z0-9-]/g, '').toLowerCase()
  store.storeData.domain = clean
  domainError.value = ''
  domainStatus.value = 'checking'
  if (domainTimer) clearTimeout(domainTimer)
  if (!clean) {
    domainStatus.value = 'idle'
    return
  }
  domainTimer = setTimeout(async () => {
    const requestId = ++domainRequestId
    const available = await checkSlugAvailable(clean)
    if (requestId !== domainRequestId || clean !== store.storeData.domain.trim().toLowerCase()) {
      return
    }
    if (available === null) {
      domainStatus.value = 'idle'
      return
    }
    domainStatus.value = available ? 'available' : 'taken'
  }, 600)
}

async function checkSlugAvailable(slug: string): Promise<boolean | null> {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  const { data, error } = await supabase.functions.invoke('check-slug', {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
    body: {
      slug,
      currentStoreId: store.storeData.id ?? null,
    },
  })

  if (error || !data || typeof data.available !== 'boolean') {
    return null
  }

  return data.available
}

function validateWhatsapp(val: string | null): boolean {
  if (!val) return true
  const digits = val.replace(/\D/g, '')
  return digits.length === 11
}

async function handlePublish() {
  let hasError = false

  if (store.storeData.name.trim().length < 3) {
    nameError.value = store.storeData.name.length === 0 ? 'Обязательное поле' : 'Минимум 3 символа'
    hasError = true
  }
  if (!store.storeData.domain.trim()) {
    domainError.value = 'Обязательное поле'
    hasError = true
  }
  if (!validateWhatsapp(store.storeData.whatsapp)) {
    whatsappError.value = 'Введите корректный номер'
    hasError = true
  }
  const hasContact =
    (store.storeData.whatsapp && store.storeData.whatsapp.replace(/\D/g, '').length === 11) ||
    !!store.storeData.telegram?.trim()
  if (!hasContact) {
    contactError.value = 'Укажите WhatsApp или Telegram для связи с покупателями'
    hasError = true
  }

  if (hasError) return

  const cleanSlug = store.storeData.domain.trim().toLowerCase()
  domainRequestId++
  if (domainTimer) {
    clearTimeout(domainTimer)
    domainTimer = null
  }

  const available = await checkSlugAvailable(cleanSlug)
  if (available === false) {
    domainStatus.value = 'taken'
    domainError.value = 'Занят, попробуйте другой'
    return
  }
  if (available === null) {
    domainStatus.value = 'idle'
    domainError.value = 'Не удалось проверить домен, попробуйте снова'
    return
  }

  try {
    store.storeData.domain = cleanSlug
    await store.publishStore()
    domainStatus.value = 'available'
    domainError.value = ''
    toast.add({
      severity: 'success',
      summary: 'Готово',
      detail: 'Магазин успешно сохранён!',
      life: 3000,
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: err instanceof Error ? err.message : 'Ошибка сохранения',
      life: 4000,
    })
  }
}

function copyLink() {
  const domain = store.storeData.domain
  if (!domain) return
  navigator.clipboard.writeText(`${window.location.origin}/${domain}`)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

function openAdd() {
  editProduct.value = null
  showModal.value = true
}
function openEdit(p: Product) {
  editProduct.value = p
  showModal.value = true
}

async function handleSignOut() {
  await signOut()
  await router.push('/auth')
}
</script>

<template>
  <div :class="s.wrap()">
    <!-- Topbar -->
    <header :class="s.topbar()">
      <div :class="s.topbarInner()">
        <div :class="s.brand()">
          <img src="/logo.png" alt="Альвиб" class="w-[22px] h-[22px] object-contain" />
          <span>Онлайн Витрина</span>
        </div>

        <div :class="s.topbarActions()">
          <span v-if="userEmailLabel" :class="s.userBadge()" :title="userEmailLabel">
            {{ userEmailLabel }}
          </span>
          <a
            :class="s.supportLink()"
            href="https://t.me/Qarimansur"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M21.94 4.35 18.62 20c-.25 1.1-.9 1.37-1.82.85l-5.04-3.72-2.43 2.34c-.27.27-.5.5-1.02.5l.36-5.13 9.35-8.45c.41-.36-.09-.56-.63-.2L5.83 13.47.86 11.91c-1.08-.34-1.1-1.08.22-1.6L20.5 2.83c.9-.34 1.68.2 1.44 1.52Z" />
            </svg>
            Поддержка
          </a>
          <button :class="s.guideBtn()" @click="startTour">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Инструкция
          </button>
          <button
            :class="[s.planBadge(), store.isPro ? s.planBadgePro() : s.planBadgeFree()]"
            @click="showPlanDialog = true"
          >
            {{ store.isPro ? '✦ Pro' : 'Free' }}
          </button>
          <button :class="s.logoutBtn()" @click="handleSignOut">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Выйти
          </button>

        </div>
      </div>
    </header>

    <!-- Loading state -->
    <div v-if="store.loading" :class="s.loadingWrap()">
      <span :class="s.loadingSpinner()" />
    </div>

    <!-- Scrollable content -->
    <div v-else :class="s.scrollArea()">
      <div :class="s.contentInner()">
        <!-- Store meta section -->
        <section :class="s.section() + ' stagger-in'">
          <div :class="s.sectionHeader()">
            <h2 :class="s.sectionTitle() + ' mb-0'">Оформление магазина</h2>
            <div :class="s.statsChip()" title="Общее число открытий магазина">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>Просмотры магазина</span>
              <span :class="s.statsValue()">{{ viewsFormatter.format(store.storeData.views) }}</span>
            </div>
          </div>

          <div :class="s.formGroup()">
            <label :class="s.label()">Тема</label>
            <div :class="s.themeTabs()" data-tour="theme-tabs">
              <button
                v-for="theme in THEMES"
                :key="theme.id"
                :disabled="!store.isPro && !FREE_THEME_IDS.has(theme.id)"
                :class="[
                  s.themeTab(),
                  store.theme === theme.id
                    ? 'bg-(--surface) text-(--accent) shadow-[0_1px_4px_rgba(0,0,0,0.1)]'
                    : 'bg-transparent text-(--text-sub)',
                  !store.isPro && !FREE_THEME_IDS.has(theme.id) && 'opacity-35 cursor-not-allowed',
                ]"
                @click="!store.isPro && !FREE_THEME_IDS.has(theme.id) ? (showPlanDialog = true) : store.setTheme(theme.id)"
              >
                <span :class="s.themeDot()" :style="{ background: theme['--accent'] }" />
                {{ theme.name }}
              </button>
            </div>
            <p v-if="!store.isPro" :class="s.lockedHint()">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Pro-темы доступны на тарифе
              <button class="underline cursor-pointer bg-transparent border-0 p-0 text-[11px] text-(--text-sub) hover:text-(--accent)" @click="showPlanDialog = true">Pro</button>
            </p>
          </div>

          <div :class="s.formGroup()">
            <label :class="[s.label(), 'flex justify-center']">Логотип магазина</label>
            <div :class="s.storeLogo()" data-tour="store-logo">
            <UploadZone
              :modelValue="store.storeData.photo"
              :uploading="logoUploading"
              title="Загрузите логотип 1:1 или"
              hint="JPG, PNG, WebP, HEIC · квадрат лучше всего · исходник до 20 MB"
              @update:modelValue="handleStorePhotoChange"
              @change="handleBannerUpload"
            />
            </div>
          </div>

          <div :class="s.formGroup()">
            <label :class="[s.label(), 'flex justify-center']">Баннер магазина</label>
            <div :class="s.storeLogo()">
              <UploadZone
                :modelValue="store.storeData.banner"
                :uploading="coverUploading"
                aspect="banner"
                imageClass="object-cover"
                title="Загрузите широкий баннер 21:9 или"
                hint="Рекомендуем 2520×1080 или 2560×1080 · WebP или JPG · до 20 MB"
                @update:modelValue="handleStoreBannerChange"
                @change="handleStoreBannerUpload"
              />
            </div>
            <p :class="[s.fieldHint(), 'text-center']">
              Лучше всего подходят широкие изображения 21:9. Оптимальный размер для витрины — 2560×1080.
              Для максимального сжатия с минимальной потерей качества используйте WebP, запасной вариант — JPG.
            </p>
          </div>

          <div :class="s.formGroup()">
            <label :class="s.label()">Название магазина</label>
            <div data-tour="store-name">
              <InputText
                v-model="store.storeData.name"
                placeholder="Например: Мастерская Берёзка"
                :maxlength="60"
                :pt="{
                  root: {
                    class: [s.input(), nameError && s.inputInvalid()],
                  },
                }"
                @input="nameError = ''"
                @blur="
                  store.storeData.name.trim().length < 3 && store.storeData.name.length > 0
                    ? (nameError = 'Минимум 3 символа')
                    : undefined
                "
              />
            </div>
            <div :class="s.inputMeta()">
              <span v-if="nameError" :class="s.fieldError()">{{ nameError }}</span>
              <span :class="s.charCount()">{{ store.storeData.name.length }}/60</span>
            </div>
          </div>

          <div :class="s.formGroup()">
            <label :class="s.label()">Описание магазина</label>
            <div data-tour="store-description">
              <Textarea
                v-model="store.storeData.description"
                placeholder="Коротко расскажите, что вы продаёте и чем магазин полезен покупателю"
                :rows="3"
                :maxlength="160"
                :pt="{ root: { class: s.input() + ' resize-none min-h-[88px]' } }"
              />
            </div>
            <div :class="s.inputMeta()">
              <span />
              <span :class="s.charCount()">{{ store.storeData.description.length }}/160</span>
            </div>
          </div>

          <!-- Domain field -->
          <div :class="s.formGroup()">
            <label :class="s.label()">Адрес магазина</label>
            <div :class="[s.domainWrap(), domainFocused && s.domainWrapFocus(), domainError && 'border-[#E85D47]']" data-tour="store-domain">
              <span :class="s.domainPrefix()">alwib.ru/</span>
              <input
                :class="s.domainInput()"
                placeholder="Название магазина на Английском языке"
                :value="store.storeData.domain"
                @input="handleDomainInput"
                @focus="domainFocused = true"
                @blur="domainFocused = false"
              />
              <span :class="s.domainStatusSlot()">
                <span v-if="domainStatus === 'checking'" :class="s.spinner()" />
                <span v-else-if="domainStatus === 'available'" :class="s.statusOk()">✓</span>
                <span v-else-if="domainStatus === 'taken'" :class="s.statusErr()">✕</span>
              </span>
              <button
                v-if="store.storeData.domain"
                :class="[s.copyBtn(), copied && s.copyBtnDone()]"
                :title="copied ? 'Скопировано!' : 'Скопировать ссылку'"
                @click="copyLink"
              >
                <svg v-if="!copied" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            </div>
            <div v-if="domainError" :class="s.fieldError() + ' fade-in'">{{ domainError }}</div>
            <div
              v-else-if="domainStatus === 'available'"
              :class="[s.fieldHint(), s.fieldHintGreen(), 'fade-in']"
            >
              Домен свободен
            </div>
            <div
              v-else-if="domainStatus === 'taken'"
              :class="[s.fieldHint(), s.fieldHintError(), 'fade-in']"
            >
              Занят, попробуйте другой
            </div>
          </div>
          <!-- Contacts -->
          <div :class="s.formGroup()">
            <label :class="s.label()">WhatsApp</label>
            <div data-tour="store-whatsapp">
              <InputMask
                v-model="store.storeData.whatsapp"
                mask="+7 (999) 999-99-99"
                placeholder="+7 (999) 999-99-99"
                :pt="{
                  root: { class: [s.input(), whatsappError && s.inputInvalid()] },
                }"
                @blur="whatsappError = validateWhatsapp(store.storeData.whatsapp) ? '' : 'Введите корректный номер'"
                @input="whatsappError = ''; contactError = ''"
              />
            </div>
            <div v-if="whatsappError" :class="s.fieldError()">{{ whatsappError }}</div>
          </div>

          <div :class="s.formGroup()">
            <label :class="s.label()">Telegram</label>
            <div v-if="!store.isPro" class="relative" data-tour="store-telegram">
              <InputText
                disabled
                placeholder="@username"
                :pt="{ root: { class: s.input() + ' opacity-40 cursor-not-allowed' } }"
              />
              <button
                class="absolute inset-0 w-full cursor-pointer bg-transparent border-0"
                @click="showPlanDialog = true"
              />
            </div>
            <div v-else data-tour="store-telegram">
              <InputText
                v-model="store.storeData.telegram"
                placeholder="@username"
                :pt="{ root: { class: s.input() } }"
                @input="contactError = ''"
              />
            </div>
            <p v-if="!store.isPro" :class="s.lockedHint()">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Доступно на тарифе
              <button class="underline cursor-pointer bg-transparent border-0 p-0 text-[11px] text-(--text-sub) hover:text-(--accent)" @click="showPlanDialog = true">Pro</button>
            </p>
            <div v-else-if="contactError" :class="s.fieldError() + ' fade-in'">{{ contactError }}</div>
          </div>
        </section>

        <!-- Products section -->
        <section :class="s.section() + ' stagger-in'" style="animation-delay: 80ms">
          <div :class="s.sectionHeader()">
            <h2 :class="s.sectionTitle() + ' mb-0'">
              Товары
              <span :class="s.countBadge()">{{ store.products.length }}</span>
            </h2>
            <button :class="s.addBtn()" data-tour="add-product" @click="openAdd">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Добавить товар
            </button>
          </div>

          <div v-if="store.products.length === 0" :class="s.emptyProducts()">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-sub)"
              stroke-width="1"
            >
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <p :class="s.emptyText()">Товары ещё не добавлены</p>
          </div>

          <div v-else :class="s.productList()">
            <AdminProductCard
              v-for="(product, i) in store.products"
              :key="product.id"
              :product="product"
              :animIdx="i"
              @edit="openEdit"
              @delete="store.deleteProduct"
            />
          </div>
        </section>
      </div>
    </div>

    <!-- Footer -->
    <footer :class="s.footer()">
      <button :class="s.previewBtn()" data-tour="preview-store" @click="router.push('/preview')">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        Превью
      </button>
      <button :class="s.publishBtn()" data-tour="publish-store" :disabled="store.saving" @click="handlePublish">
        <span v-if="store.saving" :class="s.publishSpinner()" />
        <span v-else>Опубликовать</span>
      </button>
    </footer>
  </div>

  <!-- Product modal -->
  <ProductFormDialog
    v-if="showModal"
    :product="editProduct"
    @close="closeProductDialog"
  />

  <!-- Plan modal -->
  <PlanDialog v-if="showPlanDialog" @close="showPlanDialog = false" />

  <SubscriptionSuccessDialog
    v-if="showSubscriptionSuccessDialog"
    @close="showSubscriptionSuccessDialog = false"
  />
</template>

<style lang="scss" scoped>
/* Hide scrollbar on theme tabs row */
.overflow-x-auto::-webkit-scrollbar {
  display: none;
}
</style>
