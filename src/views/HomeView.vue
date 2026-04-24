<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { tv } from 'tailwind-variants'
import InputText from 'primevue/inputtext'
import InputMask from 'primevue/inputmask'
import { useToast } from 'primevue/usetoast'
import { useSupabase } from '@/composables/useSupabase'
import { useStoreBuilderStore } from '@/stores/storeBuilder'
import { THEMES } from '@/constants/constants'
import { uploadPhoto } from '@/composables/useStorageUpload'
import { getSession } from '@/services/authServices'
import UploadZone from '@/components/storeBuilder/UploadZone.vue'
import AdminProductCard from '@/components/storeBuilder/AdminProductCard.vue'
import ProductFormDialog from '@/components/storeBuilder/ProductFormDialog.vue'
import type { Product } from '@/types/types'

const router = useRouter()
const store = useStoreBuilderStore()
const toast = useToast()

const nameError = ref('')
const domainError = ref('')
const contactError = ref('')
const whatsappError = ref('')
const showModal = ref(false)
const editProduct = ref<Product | null>(null)
const domainStatus = ref<'idle' | 'checking' | 'available' | 'taken'>('idle')
const domainFocused = ref(false)
const bannerUploading = ref(false)
const copied = ref(false)
let domainTimer: ReturnType<typeof setTimeout> | null = null

const styles = tv({
  slots: {
    wrap: 'h-screen flex flex-col bg-[var(--bg)] transition-[background] duration-300',
    topbar:
      'bg-[var(--surface)] border-b border-[var(--border-color)] relative z-10 shrink-0 transition-[background,border-color] duration-300',
    topbarInner:
      'max-w-[900px] mx-auto px-8 h-14 flex items-center justify-between gap-4',
    brand:
      'flex items-center gap-2.5 font-bold text-[15px] text-[var(--text)] shrink-0',
    themeTabs:
      'flex gap-[3px] bg-[var(--surface-alt)] rounded-[10px] p-[3px] overflow-x-auto transition-[background] duration-300',
    themeTab:
      'flex items-center gap-1.5 px-[11px] py-[5px] rounded-[7px] text-xs font-medium text-[var(--text-sub)] transition-all duration-[180ms] whitespace-nowrap shrink-0 cursor-pointer border-0 bg-transparent',
    themeTabActive:
      'bg-[var(--surface)] text-[var(--text)] shadow-[0_1px_4px_rgba(0,0,0,0.1)]',
    themeDot: 'w-2 h-2 rounded-full shrink-0',
    loadingWrap: 'flex-1 flex items-center justify-center',
    loadingSpinner:
      'w-8 h-8 border-[3px] border-[rgba(var(--accent-rgb),_0.2)] border-t-[var(--accent)] rounded-full animate-spin',
    scrollArea: 'flex-1 overflow-y-auto',
    contentInner: 'max-w-[900px] mx-auto px-8 py-8 pb-[120px]',
    section: 'mb-10',
    sectionTitle: 'text-lg font-bold text-[var(--text)] mb-5',
    sectionHeader: 'flex items-center justify-between mb-5',
    countBadge:
      'inline-flex items-center justify-center min-w-5 h-5 px-1.5 bg-[rgba(var(--accent-rgb),_0.12)] text-[var(--accent)] rounded-full text-[11px] font-bold ml-2',
    formGroup: 'mb-5',
    label:
      'block text-[11px] font-bold text-[var(--text-sub)] uppercase tracking-[.07em] mb-2',
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
      'inline-flex items-center gap-[7px] px-4 py-2 border-[1.5px] border-[var(--accent)] text-[var(--accent)] rounded-[var(--btn-radius)] text-[13px] font-semibold transition-[background] duration-[180ms] hover:bg-[rgba(var(--accent-rgb),_0.07)]',
    emptyProducts:
      'flex flex-col items-center justify-center gap-2.5 py-12 px-5 text-[var(--text-sub)] text-center border border-dashed border-[var(--border-color)] rounded-[var(--radius)] fade-in',
    emptyText: 'text-[15px] font-medium',
    productList: 'flex flex-col gap-2',
    footer:
      'shrink-0 border-t border-[var(--border-color)] bg-[var(--surface)] px-8 py-3 flex items-center justify-end gap-2 transition-[background,border-color] duration-300',
    previewBtn:
      'inline-flex items-center gap-[7px] px-4 py-2.5 text-sm font-medium text-[var(--text-sub)] rounded-[var(--btn-radius)] hover:text-[var(--text)] hover:bg-[var(--surface-alt)] transition-[color,background] duration-[180ms] border-0 bg-transparent cursor-pointer',
    publishBtn:
      'inline-flex items-center justify-center gap-2 px-[22px] py-2.5 bg-[var(--accent)] text-white rounded-[var(--btn-radius)] text-sm font-semibold hover:opacity-85 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-[opacity,transform] duration-[180ms] border-0 cursor-pointer',
    publishSpinner:
      'w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block',
    copyBtn:
      'px-2.5 flex items-center self-stretch border-l border-[var(--border-color)] text-[var(--text-sub)] transition-[color,background] duration-[180ms] hover:bg-[var(--surface-alt)] hover:text-[var(--text)]',
    copyBtnDone: 'text-[#5b8c5a]',
  },
})
const { supabase } = useSupabase()

const s = styles()

onMounted(async () => {
  const session = await getSession()
  if (session) {
    await store.loadData(session.user.id)
  }
})

async function handleBannerUpload(file: File) {
  const session = await getSession()
  if (!session) return
  bannerUploading.value = true
  try {
    store.storeData.photo = await uploadPhoto(file, session.user.id, 'store')
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка загрузки',
      detail: err instanceof Error ? err.message : 'Не удалось загрузить фото',
      life: 4000,
    })
  } finally {
    bannerUploading.value = false
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
    const { data, error } = await supabase.functions.invoke('check-slug', {
      body: { slug: clean },
    })
    if (error || !data) {
      domainStatus.value = 'idle'
      return
    }
    domainStatus.value = data.available ? 'available' : 'taken'
  }, 600)
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
  try {
    await store.publishStore()
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
</script>

<template>
  <div :class="s.wrap()">
    <!-- Topbar -->
    <header :class="s.topbar()">
      <div :class="s.topbarInner()">
        <div :class="s.brand()">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="3" width="20" height="14" rx="2" fill="var(--accent)" opacity=".15" />
            <rect
              x="2"
              y="3"
              width="20"
              height="14"
              rx="2"
              stroke="var(--accent)"
              stroke-width="1.5"
            />
            <path d="M8 21h8M12 17v4" stroke="var(--accent)" stroke-width="1.5" />
          </svg>
          <span>Онлайн Витрина</span>
        </div>

        <div :class="s.themeTabs()">
          <button
            v-for="theme in THEMES"
            :key="theme.id"
            :class="[s.themeTab(), store.theme === theme.id && s.themeTabActive()]"
            @click="store.setTheme(theme.id)"
          >
            <span :class="s.themeDot()" :style="{ background: theme['--accent'] }" />
            {{ theme.name }}
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
          <h2 :class="s.sectionTitle()">Оформление магазина</h2>

          <div :class="s.formGroup()">
            <label :class="s.label()">Фото / баннер магазина</label>
            <UploadZone
              :modelValue="store.storeData.photo"
              :uploading="bannerUploading"
              @update:modelValue="(v) => (store.storeData.photo = v)"
              @change="handleBannerUpload"
            />
          </div>

          <div :class="s.formGroup()">
            <label :class="s.label()">Название магазина</label>
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
            <div :class="s.inputMeta()">
              <span v-if="nameError" :class="s.fieldError()">{{ nameError }}</span>
              <span :class="s.charCount()">{{ store.storeData.name.length }}/60</span>
            </div>
          </div>

          <!-- Domain field -->
          <div :class="s.formGroup()">
            <label :class="s.label()">Адрес магазина</label>
            <div :class="[s.domainWrap(), domainFocused && s.domainWrapFocus(), domainError && 'border-[#E85D47]']">
              <span :class="s.domainPrefix()">alwib.ru/</span>
              <input
                :class="s.domainInput()"
                placeholder="your-shop"
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
            <div v-if="whatsappError" :class="s.fieldError()">{{ whatsappError }}</div>
          </div>

          <div :class="s.formGroup()">
            <label :class="s.label()">Telegram</label>
            <InputText
              v-model="store.storeData.telegram"
              placeholder="@username"
              :pt="{ root: { class: s.input() } }"
              @input="contactError = ''"
            />
            <div v-if="contactError" :class="s.fieldError() + ' fade-in'">{{ contactError }}</div>
          </div>
        </section>

        <!-- Products section -->
        <section :class="s.section() + ' stagger-in'" style="animation-delay: 80ms">
          <div :class="s.sectionHeader()">
            <h2 :class="s.sectionTitle() + ' mb-0'">
              Товары
              <span :class="s.countBadge()">{{ store.products.length }}</span>
            </h2>
            <button :class="s.addBtn()" @click="openAdd">
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
      <button :class="s.previewBtn()" @click="router.push('/preview')">
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
      <button :class="s.publishBtn()" :disabled="store.saving" @click="handlePublish">
        <span v-if="store.saving" :class="s.publishSpinner()" />
        <span v-else>Опубликовать</span>
      </button>
    </footer>
  </div>

  <!-- Product modal -->
  <ProductFormDialog
    v-if="showModal"
    :product="editProduct"
    @close="showModal = false; editProduct = null"
  />
</template>

<style lang="scss" scoped>
/* Hide scrollbar on theme tabs row */
.overflow-x-auto::-webkit-scrollbar {
  display: none;
}
</style>
