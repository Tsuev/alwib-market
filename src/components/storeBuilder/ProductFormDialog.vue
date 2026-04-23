<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { tv } from 'tailwind-variants'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputChips from 'primevue/inputchips'
import type { Product } from '@/types/types'
import { placeholderSvg, calcDiscount } from '@/composables/useImageToBase64'
import { uploadPhoto } from '@/composables/useStorageUpload'
import { getSession } from '@/services/authServices'
import { useStoreBuilderStore } from '@/stores/storeBuilder'

const props = defineProps<{ product: Product | null }>()
const emit = defineEmits<{ close: [] }>()

const store = useStoreBuilderStore()
const isEdit = computed(() => !!props.product)
const visible = ref(false)
const saving = ref(false)
const photoUploading = ref(false)
const saveError = ref('')
const errors = ref<{ name?: string; price?: string }>({})

const form = ref({
  name: props.product?.name ?? '',
  description: props.product?.description ?? '',
  price: props.product?.price?.toString() ?? '',
  salePrice: props.product?.salePrice?.toString() ?? '',
  tags: [...(props.product?.tags ?? [])] as string[],
  photo: props.product?.photo ?? null,
})

onMounted(() => nextTick(() => { visible.value = true }))

const discount = computed(() => {
  const p = Number(form.value.price)
  const s = Number(form.value.salePrice)
  return p && s ? calcDiscount(p, s) : 0
})

const styles = tv({
  slots: {
    overlay: 'bg-black/50',
    box: 'bg-[var(--surface)] rounded-[calc(var(--radius)+4px)] w-full max-w-[680px] max-h-[90vh] flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.2)] transition-[background] duration-300',
    header: 'flex items-center justify-between px-6 pt-5 pb-0 shrink-0',
    headerTitle: 'text-[17px] font-bold text-[var(--text)]',
    closeBtn: 'w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-sub)] hover:bg-[var(--surface-alt)] transition-colors duration-[180ms]',
    content: 'flex-1 overflow-y-auto px-6 py-5',
    cols: 'grid grid-cols-[200px_1fr] gap-6',
    photoZone: 'rounded-[var(--radius)] overflow-hidden border border-[var(--border-color)] transition-[border-color] duration-300',
    photoImg: 'w-full aspect-square object-cover',
    photoBtn: 'flex items-center justify-center gap-1.5 w-full py-[9px] text-xs font-semibold text-[var(--text-sub)] bg-[var(--surface-alt)] border-t border-[var(--border-color)] cursor-pointer transition-[background,color] duration-[180ms] hover:bg-[rgba(var(--accent-rgb),_0.08)] hover:text-[var(--accent)]',
    photoBtnDisabled: 'opacity-50 pointer-events-none',
    formCol: 'flex flex-col',
    label: 'block text-[11px] font-bold text-[var(--text-sub)] uppercase tracking-[.07em] mb-2',
    req: 'text-[var(--accent)]',
    input: 'w-full px-3.5 py-2.5 border border-[var(--border-color)] rounded-[var(--radius)] text-sm text-[var(--text)] bg-[var(--surface)] transition-[border-color,box-shadow] duration-[180ms] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(var(--accent-rgb),_0.12)] outline-none',
    inputInvalid: 'border-[#E85D47]',
    formGroup: 'mb-5',
    formRow2: 'grid grid-cols-2 gap-4',
    fieldError: 'text-xs text-[#E85D47] mt-1 fade-in',
    fieldHint: 'text-xs text-[var(--text-sub)] mt-1',
    priceWrap: 'relative',
    discountBadge: 'absolute right-[-4px] top-1/2 translate-x-full -translate-y-1/2 bg-[#E85D47] text-white text-[11px] font-bold px-[7px] py-[3px] rounded-full whitespace-nowrap fade-in',
    saveErrBox: 'mx-6 mb-0 mt-3 px-3 py-2.5 bg-[rgba(232,93,71,0.08)] border border-[#E85D47]/30 rounded-[var(--radius)] text-xs text-[#E85D47]',
    footer: 'flex justify-end items-center gap-2.5 px-6 py-4 border-t border-[var(--border-color)] shrink-0 transition-[border-color] duration-300',
    cancelBtn: 'px-4 py-2.5 text-sm font-medium text-[var(--text-sub)] rounded-[var(--btn-radius)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)] transition-[background,color] duration-[180ms]',
    saveBtn: 'inline-flex items-center justify-center gap-2 px-[22px] py-2.5 bg-[var(--accent)] text-white rounded-[var(--btn-radius)] text-sm font-semibold hover:opacity-85 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-[opacity,transform] duration-[180ms]',
    spinner: 'w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block',
  },
})

const s = styles()

function validate() {
  const e: typeof errors.value = {}
  if (!form.value.name.trim()) e.name = 'Введите название товара'
  if (!form.value.price || isNaN(Number(form.value.price)) || Number(form.value.price) <= 0)
    e.price = 'Укажите корректную цену'
  return e
}

async function handleSave() {
  const e = validate()
  if (Object.keys(e).length) { errors.value = e; return }
  saveError.value = ''
  saving.value = true
  try {
    await store.saveProduct({
      ...(props.product?.id ? { id: props.product.id } : {}),
      name: form.value.name,
      description: form.value.description,
      price: Number(form.value.price),
      salePrice: form.value.salePrice ? Number(form.value.salePrice) : null,
      tags: form.value.tags,
      photo: form.value.photo,
    })
    handleClose()
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : 'Ошибка при сохранении'
    saving.value = false
  }
}

function handleClose() {
  visible.value = false
  setTimeout(() => emit('close'), 260)
}

async function handlePhotoUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  photoUploading.value = true
  try {
    const session = await getSession()
    if (!session) throw new Error('Не авторизован')
    form.value.photo = await uploadPhoto(file, session.user.id, 'product')
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : 'Ошибка загрузки фото'
  } finally {
    photoUploading.value = false
    // reset input so the same file can be re-selected after an error
    ;(e.target as HTMLInputElement).value = ''
  }
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
      content: { class: 'p-0 flex-1 overflow-hidden flex flex-col' },
      footer: { class: 'hidden' },
    }"
  >
    <!-- Custom header -->
    <div :class="s.header()">
      <h3 :class="s.headerTitle()">{{ isEdit ? 'Редактировать товар' : 'Новый товар' }}</h3>
      <button :class="s.closeBtn()" @click="handleClose">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- Body -->
    <div :class="s.content()">
      <div :class="s.cols()">
        <!-- Photo column -->
        <div>
          <div :class="s.photoZone()">
            <div class="relative">
              <img
                :src="form.photo || placeholderSvg(form.name || 'Фото товара', 300, 300)"
                alt="product"
                :class="s.photoImg()"
              />
              <div
                v-if="photoUploading"
                class="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
              >
                <span class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            </div>
            <label :class="[s.photoBtn(), photoUploading && s.photoBtnDisabled()]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {{ photoUploading ? 'Загружаем…' : 'Загрузить фото' }}
              <input
                type="file"
                accept="image/*"
                class="hidden"
                :disabled="photoUploading"
                @change="handlePhotoUpload"
              />
            </label>
          </div>
        </div>

        <!-- Form column -->
        <div :class="s.formCol()">
          <div :class="s.formGroup()">
            <label :class="s.label()">Название <span :class="s.req()">*</span></label>
            <InputText
              v-model="form.name"
              placeholder="Например: Керамическая кружка"
              maxlength="80"
              :pt="{
                root: {
                  class: [s.input(), errors.name && s.inputInvalid()],
                  onInput: () => (errors.name = ''),
                },
              }"
            />
            <div v-if="errors.name" :class="s.fieldError()">{{ errors.name }}</div>
          </div>

          <div :class="s.formGroup()">
            <label :class="s.label()">Описание</label>
            <Textarea
              v-model="form.description"
              placeholder="Расскажите о товаре…"
              :rows="3"
              :pt="{ root: { class: s.input() + ' resize-none min-h-[80px]' } }"
            />
          </div>

          <div :class="s.formRow2()">
            <div :class="s.formGroup()">
              <label :class="s.label()">Цена, ₽ <span :class="s.req()">*</span></label>
              <InputText
                v-model="form.price"
                type="number"
                min="0"
                placeholder="2 400"
                :pt="{
                  root: {
                    class: [s.input(), errors.price && s.inputInvalid()],
                    onInput: () => (errors.price = ''),
                  },
                }"
              />
              <div v-if="errors.price" :class="s.fieldError()">{{ errors.price }}</div>
            </div>

            <div :class="s.formGroup()">
              <label :class="s.label()">Цена со скидкой, ₽</label>
              <div :class="s.priceWrap()">
                <InputText
                  v-model="form.salePrice"
                  type="number"
                  min="0"
                  placeholder="1 800"
                  :pt="{
                    root: {
                      class: s.input() + (form.salePrice ? ' text-[var(--accent)]' : ''),
                    },
                  }"
                />
                <span v-if="discount > 0" :class="s.discountBadge()">−{{ discount }}%</span>
              </div>
            </div>
          </div>

          <div :class="s.formGroup()">
            <label :class="s.label()">Теги</label>
            <InputChips
              v-model="form.tags"
              placeholder="Добавить тег…"
              :max="5"
              separator=","
              :pt="{
                root: {
                  class:
                    'flex flex-wrap gap-1.5 items-center px-2.5 py-2 border border-[var(--border-color)] rounded-[var(--radius)] min-h-[42px] bg-[var(--surface)] transition-[border-color,box-shadow] duration-[180ms] focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_3px_rgba(var(--accent-rgb),_0.12)]',
                },
                inputText: {
                  class:
                    'flex-1 min-w-[80px] border-none outline-none text-[13px] font-[inherit] bg-transparent text-[var(--text)] placeholder:text-[var(--text-sub)]',
                },
                chip: {
                  class:
                    'inline-flex items-center gap-1.5 px-2.5 py-[3px] bg-[rgba(var(--accent-rgb),_0.1)] text-[var(--accent)] rounded-full text-xs font-medium',
                },
                chipIcon: {
                  class: 'w-4 h-4 rounded-full text-[var(--accent)] opacity-70 hover:opacity-100',
                },
              }"
            />
            <div :class="s.fieldHint()">Нажмите Enter чтобы добавить тег · максимум 5</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Save error -->
    <div v-if="saveError" :class="s.saveErrBox()">{{ saveError }}</div>

    <!-- Custom footer -->
    <div :class="s.footer()">
      <button :class="s.cancelBtn()" @click="handleClose">Отмена</button>
      <button :class="s.saveBtn()" :disabled="saving || photoUploading" @click="handleSave">
        <span v-if="saving" :class="s.spinner()" />
        <span v-else>Сохранить товар</span>
      </button>
    </div>
  </Dialog>
</template>

<style lang="scss" scoped>
/* Tailwind v4 doesn't pierce PrimeVue shadow DOM — use :deep for Dialog teleport overrides */
:deep(.p-dialog-mask) {
  align-items: center;
  justify-content: center;
}
</style>
