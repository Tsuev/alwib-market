<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { tv } from 'tailwind-variants'
import Dialog from 'primevue/dialog'
import ConfirmDialog from 'primevue/confirmdialog'
import InputText from 'primevue/inputtext'
import { useConfirm } from 'primevue/useconfirm'
import { useStoreBuilderStore } from '@/stores/storeBuilder'
import type { StoreTag } from '@/types/types'

const emit = defineEmits<{ close: [] }>()

const store = useStoreBuilderStore()
const confirm = useConfirm()
const visible = ref(false)
const draftName = ref('')
const createError = ref('')
const saving = ref(false)
const editingId = ref<string | null>(null)
const editDraft = ref('')
const rowLoadingId = ref<string | null>(null)
const rowError = ref('')

onMounted(() => nextTick(() => { visible.value = true }))

const usageCountByTag = computed(() => {
  const map = new Map<string, number>()

  for (const tag of store.storeTags) {
    map.set(tag.id, 0)
  }

  for (const product of store.products) {
    for (const tagName of product.tags) {
      const matched = store.storeTags.find((tag) => tag.name === tagName)
      if (!matched) continue
      map.set(matched.id, (map.get(matched.id) ?? 0) + 1)
    }
  }

  return map
})

const styles = tv({
  slots: {
    overlay: 'bg-black/50 p-2 sm:p-4 items-start sm:items-center',
    box: 'bg-[var(--surface)] rounded-[calc(var(--radius)+4px)] w-full max-w-[640px] max-h-[calc(100dvh-1rem)] sm:max-h-[88vh] flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.2)]',
    header: 'flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-0 shrink-0',
    titleWrap: 'min-w-0',
    title: 'text-[17px] font-bold text-[var(--text)]',
    subtitle: 'mt-1 text-xs text-[var(--text-sub)]',
    closeBtn: 'w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-sub)] hover:bg-[var(--surface-alt)] transition-colors duration-[180ms]',
    content: 'flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5',
    createCard: 'p-3 sm:p-4 rounded-[var(--radius)] border border-[var(--border-color)] bg-[var(--surface-alt)] mb-4',
    createRow: 'flex flex-col sm:flex-row gap-2',
    input: 'w-full px-3.5 py-2.5 border border-[var(--border-color)] rounded-[var(--radius)] text-sm text-[var(--text)] bg-[var(--surface)] transition-[border-color,box-shadow] duration-[180ms] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(var(--accent-rgb),_0.12)] outline-none',
    addBtn: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--accent)] text-white rounded-[var(--btn-radius)] text-sm font-semibold hover:opacity-85 disabled:opacity-60 disabled:cursor-not-allowed transition-[opacity] duration-[180ms] whitespace-nowrap',
    helper: 'mt-2 text-xs text-[var(--text-sub)]',
    error: 'mt-2 text-xs text-[#E85D47]',
    empty: 'py-10 px-4 text-center border border-dashed border-[var(--border-color)] rounded-[var(--radius)] text-[var(--text-sub)]',
    list: 'flex flex-col gap-2',
    row: 'border border-[var(--border-color)] rounded-[var(--radius)] p-3 bg-[var(--surface)]',
    rowTop: 'flex items-start justify-between gap-3',
    name: 'text-sm font-semibold text-[var(--text)] break-words',
    meta: 'mt-1 text-xs text-[var(--text-sub)]',
    actions: 'flex items-center gap-1 shrink-0',
    iconBtn: 'w-8 h-8 inline-flex items-center justify-center rounded-lg text-[var(--text-sub)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)] transition-colors duration-[180ms]',
    iconBtnDanger: 'hover:bg-[#E85D4712] hover:text-[#E85D47]',
    editWrap: 'flex flex-col sm:flex-row gap-2',
    editActions: 'flex items-center gap-2',
    secondaryBtn: 'px-3.5 py-2 text-sm font-medium text-[var(--text-sub)] rounded-[var(--btn-radius)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)] transition-[background,color] duration-[180ms]',
    saveBtn: 'px-3.5 py-2 text-sm font-semibold text-white bg-[var(--accent)] rounded-[var(--btn-radius)] hover:opacity-85 disabled:opacity-60 disabled:cursor-not-allowed transition-[opacity] duration-[180ms]',
    footer: 'flex justify-end px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--border-color)]',
    closeFooterBtn: 'px-4 py-2.5 text-sm font-medium text-[var(--text-sub)] rounded-[var(--btn-radius)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)] transition-[background,color] duration-[180ms]',
    confirmIcon: 'w-11 h-11 rounded-full bg-[#E85D4714] text-[#E85D47] flex items-center justify-center mx-auto mb-3',
    confirmTitle: 'text-[18px] font-bold text-[var(--text)] text-center',
    confirmText: 'mt-2 text-sm leading-6 text-[var(--text-sub)] text-center',
    confirmActions: 'flex items-center justify-center gap-2 mt-5',
    confirmCancelBtn: 'px-4 py-2.5 text-sm font-medium text-[var(--text-sub)] rounded-[var(--btn-radius)] border border-[var(--border-color)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)] transition-[background,color,border-color] duration-[180ms]',
    confirmDeleteBtn: 'px-4 py-2.5 text-sm font-semibold text-white bg-[#E85D47] rounded-[var(--btn-radius)] hover:opacity-90 transition-[opacity] duration-[180ms]',
  },
})

const s = styles()

function handleClose() {
  visible.value = false
  setTimeout(() => emit('close'), 260)
}

async function handleCreate() {
  createError.value = ''
  saving.value = true

  try {
    await store.createTag(draftName.value)
    draftName.value = ''
  } catch (err) {
    createError.value = err instanceof Error ? err.message : 'Ошибка при создании тега'
  } finally {
    saving.value = false
  }
}

function startEdit(tag: StoreTag) {
  editingId.value = tag.id
  editDraft.value = tag.name
  rowError.value = ''
}

function cancelEdit() {
  editingId.value = null
  editDraft.value = ''
  rowError.value = ''
}

async function handleSaveEdit(tag: StoreTag) {
  rowError.value = ''
  rowLoadingId.value = tag.id

  try {
    await store.updateTag(tag.id, editDraft.value)
    cancelEdit()
  } catch (err) {
    rowError.value = err instanceof Error ? err.message : 'Ошибка при сохранении'
  } finally {
    rowLoadingId.value = null
  }
}

async function handleDelete(tag: StoreTag) {
  rowError.value = ''
  confirm.require({
    group: 'store-tags-delete',
    message: `Тег «${tag.name}» будет удалён из справочника и исчезнет из всех товаров магазина.`,
    header: 'Удалить тег?',
    acceptLabel: 'Удалить',
    rejectLabel: 'Отмена',
    accept: async () => {
      rowLoadingId.value = tag.id

      try {
        await store.deleteTag(tag.id)
      } catch (err) {
        rowError.value = err instanceof Error ? err.message : 'Ошибка при удалении'
      } finally {
        rowLoadingId.value = null
      }
    },
  })
}
</script>

<template>
  <ConfirmDialog group="store-tags-delete" :pt="{ root: { class: 'border border-[var(--border-color)] bg-[var(--surface)] text-[var(--text)] rounded-[calc(var(--radius)+6px)] shadow-[0_20px_60px_rgba(0,0,0,0.22)] overflow-hidden max-w-[420px] w-[calc(100vw-1.5rem)]' }, header: { class: 'hidden' }, content: { class: 'px-5 sm:px-6 pt-6 pb-2' }, footer: { class: 'px-5 sm:px-6 pb-5 pt-0' }, mask: { class: 'bg-black/50 backdrop-blur-[2px]' } }">
    <template #container="{ message, acceptCallback, rejectCallback }">
      <div class="px-5 sm:px-6 pt-6 pb-5">
        <div :class="s.confirmIcon()">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18" />
            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </div>
        <h3 :class="s.confirmTitle()">{{ message.header }}</h3>
        <p :class="s.confirmText()">{{ message.message }}</p>
        <div :class="s.confirmActions()">
          <button :class="s.confirmCancelBtn()" @click="rejectCallback">Отмена</button>
          <button :class="s.confirmDeleteBtn()" @click="acceptCallback">Удалить</button>
        </div>
      </div>
    </template>
  </ConfirmDialog>

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
    <div :class="s.header()">
      <div :class="s.titleWrap()">
        <h3 :class="s.title()">Теги магазина</h3>
        <p :class="s.subtitle()">Отдельный справочник тегов для быстрого выбора в карточках товаров.</p>
      </div>
      <button :class="s.closeBtn()" @click="handleClose">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <div :class="s.content()">
      <div :class="s.createCard()">
        <div :class="s.createRow()">
          <InputText
            v-model="draftName"
            placeholder="Например: Новинка"
            maxlength="32"
            :pt="{ root: { class: s.input() } }"
            @keydown.enter.prevent="handleCreate"
          />
          <button :class="s.addBtn()" :disabled="saving" @click="handleCreate">
            {{ saving ? 'Сохраняем…' : 'Добавить тег' }}
          </button>
        </div>
        <p :class="s.helper()">Тег можно создать здесь или прямо внутри карточки товара. Новые теги потом появятся в общем списке.</p>
        <p v-if="createError" :class="s.error()">{{ createError }}</p>
      </div>

      <div v-if="store.storeTags.length === 0" :class="s.empty()">
        Тегов пока нет. Создайте первый тег, и он будет доступен во всех товарах этого магазина.
      </div>

      <div v-else :class="s.list()">
        <div v-for="tag in store.storeTags" :key="tag.id" :class="s.row()">
          <template v-if="editingId === tag.id">
            <div :class="s.editWrap()">
              <InputText
                v-model="editDraft"
                placeholder="Название тега"
                maxlength="32"
                :pt="{ root: { class: s.input() } }"
                @keydown.enter.prevent="handleSaveEdit(tag)"
              />
              <div :class="s.editActions()">
                <button :class="s.saveBtn()" :disabled="rowLoadingId === tag.id" @click="handleSaveEdit(tag)">
                  {{ rowLoadingId === tag.id ? 'Сохраняем…' : 'Сохранить' }}
                </button>
                <button :class="s.secondaryBtn()" :disabled="rowLoadingId === tag.id" @click="cancelEdit">
                  Отмена
                </button>
              </div>
            </div>
          </template>

          <template v-else>
            <div :class="s.rowTop()">
              <div class="min-w-0">
                <div :class="s.name()">{{ tag.name }}</div>
                <div :class="s.meta()">
                  Используется в {{ usageCountByTag.get(tag.id) ?? 0 }} товарах
                </div>
              </div>

              <div :class="s.actions()">
                <button :class="s.iconBtn()" :disabled="rowLoadingId === tag.id" @click="startEdit(tag)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                  </svg>
                </button>
                <button :class="[s.iconBtn(), s.iconBtnDanger()]" :disabled="rowLoadingId === tag.id" @click="handleDelete(tag)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>

      <p v-if="rowError" :class="s.error()">{{ rowError }}</p>
    </div>

    <div :class="s.footer()">
      <button :class="s.closeFooterBtn()" @click="handleClose">Закрыть</button>
    </div>
  </Dialog>
</template>

<style lang="scss" scoped>
:deep(.p-dialog-mask) {
  align-items: center;
  justify-content: center;
}
</style>
