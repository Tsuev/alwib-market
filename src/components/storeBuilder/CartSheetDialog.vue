<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { tv } from 'tailwind-variants'
import Dialog from 'primevue/dialog'
import type { CartLine } from '@/types/types'
import { formatRub, placeholderSvg } from '@/composables/useImageToBase64'
import { buildCartMessage, createTelegramProfileLink, createWhatsappLink } from '@/composables/useStorefrontCart'
import CartQuantityControl from '@/components/storeBuilder/CartQuantityControl.vue'

const props = defineProps<{
  items: CartLine[]
  whatsapp?: string | null
  telegram?: string | null
}>()

const emit = defineEmits<{
  close: []
  increment: [productId: string]
  decrement: [productId: string]
  remove: [productId: string]
  clear: []
}>()

const visible = ref(false)
const tgCopied = ref(false)

onMounted(() => nextTick(() => { visible.value = true }))

const totalCount = computed(() =>
  props.items.reduce((sum, item) => sum + item.quantity, 0),
)
const totalAmount = computed(() =>
  props.items.reduce((sum, item) => sum + (item.product.salePrice ?? item.product.price) * item.quantity, 0),
)
const message = computed(() => buildCartMessage(props.items))
const whatsappLink = computed(() => createWhatsappLink(props.whatsapp, message.value))
const telegramLink = computed(() => createTelegramProfileLink(props.telegram))

async function openTelegram() {
  if (!telegramLink.value) return

  try {
    await navigator.clipboard.writeText(message.value)
    tgCopied.value = true
    window.setTimeout(() => {
      tgCopied.value = false
    }, 2200)
  } catch {
    tgCopied.value = false
  }

  window.open(telegramLink.value, '_blank', 'noopener')
}

function handleClose() {
  visible.value = false
  window.setTimeout(() => emit('close'), 260)
}

const styles = tv({
  slots: {
    overlay: 'bg-black/55 p-0 sm:p-4 items-end',
    box:
      'cart-sheet-dialog w-full max-w-[1040px] self-end rounded-t-[30px] sm:rounded-[32px] bg-[var(--surface)] shadow-[0_-12px_40px_rgba(0,0,0,0.22)] overflow-hidden max-h-[92dvh]',
    shell: 'flex flex-col max-h-[92dvh]',
    head: 'px-4 sm:px-6 pt-4 sm:pt-5 pb-4 border-b border-[var(--border-color)]',
    topRow: 'flex items-start justify-between gap-4',
    titleWrap: 'min-w-0',
    title: 'text-[24px] sm:text-[28px] font-black text-[var(--text)] tracking-[-0.02em]',
    subtitle: 'mt-1 text-[13px] sm:text-[14px] text-[var(--text-sub)]',
    closeBtn:
      'shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-full border border-[var(--border-color)] bg-[var(--surface)] text-[var(--text-sub)] transition-[border-color,color,transform] duration-[180ms] hover:border-[var(--accent)] hover:text-[var(--accent)] active:scale-[0.97] cursor-pointer',
    summary:
      'mt-4 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-[24px] border border-[var(--border-color)] bg-[var(--surface-alt)]/70 p-4 sm:p-5 items-center',
    summaryMeta: 'flex flex-col gap-1',
    summaryLabel: 'text-[12px] uppercase tracking-[0.14em] font-bold text-[var(--text-sub)]',
    summaryValue: 'text-[22px] sm:text-[26px] font-black text-[var(--text)]',
    summaryHint: 'text-[13px] text-[var(--text-sub)]',
    clearBtn:
      'inline-flex items-center justify-center px-4 py-3 rounded-full border border-[var(--border-color)] text-[13px] font-bold text-[var(--text-sub)] transition-[border-color,color,background] duration-[180ms] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[rgba(var(--accent-rgb),_0.08)] cursor-pointer h-10',
    body: 'flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5',
    list: 'flex flex-col gap-3.5',
    item:
      'grid grid-cols-[84px_minmax(0,1fr)] sm:grid-cols-[110px_minmax(0,1fr)] gap-3 sm:gap-4 rounded-[26px] border border-[var(--border-color)] bg-[var(--surface-alt)]/55 p-3 sm:p-4',
    itemImageWrap: 'relative aspect-square overflow-hidden rounded-[20px] bg-[var(--surface)]',
    itemImage: 'w-full h-full object-cover',
    itemContent: 'min-w-0 flex flex-col gap-3',
    itemTop: 'flex items-start justify-between gap-3',
    itemName: 'text-[16px] sm:text-[18px] font-bold text-[var(--text)] leading-snug',
    itemPrice: 'text-[13px] text-[var(--text-sub)]',
    itemTotal: 'text-[14px] sm:text-[15px] font-bold text-[var(--accent)] whitespace-nowrap',
    itemTags: 'flex flex-wrap gap-1.5',
    itemTag:
      'inline-flex items-center rounded-full bg-[rgba(var(--accent-rgb),_0.1)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent)]',
    itemBottom: 'flex flex-wrap items-center justify-between gap-2.5',
    removeBtn:
      'inline-flex items-center justify-center px-3 py-2 rounded-full text-[12px] font-bold text-[var(--text-sub)] transition-[color,background] duration-[180ms] hover:bg-[rgba(232,93,71,0.1)] hover:text-[#E85D47] cursor-pointer',
    empty:
      'flex flex-col items-center justify-center gap-3 rounded-[28px] border border-dashed border-[var(--border-color)] px-5 py-14 text-center',
    emptyIcon:
      'inline-flex items-center justify-center w-18 h-18 rounded-full bg-[rgba(var(--accent-rgb),_0.1)] text-[var(--accent)]',
    emptyTitle: 'text-[20px] font-bold text-[var(--text)]',
    emptyText: 'max-w-[360px] text-[14px] leading-6 text-[var(--text-sub)]',
    actions: 'border-t border-[var(--border-color)] px-4 sm:px-6 py-4 sm:py-5 bg-[var(--surface)]/96 backdrop-blur-[12px]',
    actionGrid: 'grid grid-cols-1 sm:grid-cols-2 gap-3',
    waBtn:
      'inline-flex items-center justify-center gap-2 rounded-[22px] bg-[#25D366] px-5 py-4 text-[15px] font-bold text-white transition-[transform,opacity] duration-[180ms] hover:opacity-90 active:scale-[0.99]',
    tgBtn:
      'inline-flex items-center justify-center gap-2 rounded-[22px] bg-[#229ED9] px-5 py-4 text-[15px] font-bold text-white transition-[transform,opacity] duration-[180ms] hover:opacity-90 active:scale-[0.99] cursor-pointer',
    disabledBtn:
      'inline-flex items-center justify-center rounded-[22px] border border-[var(--border-color)] bg-[var(--surface-alt)] px-5 py-4 text-[14px] font-bold text-[var(--text-sub)] cursor-not-allowed',
    actionNote: 'mt-3 text-[12px] text-[var(--text-sub)]',
  },
})

const s = styles()
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
      content: { class: 'p-0 overflow-hidden' },
      footer: { class: 'hidden' },
    }"
  >
    <div :class="s.shell()">
      <div :class="s.head()">
        <div :class="s.topRow()">
          <div :class="s.titleWrap()">
            <h2 :class="s.title()">Корзина</h2>
            <p :class="s.subtitle()">Меняйте количество и сразу отправляйте список продавцу.</p>
          </div>
          <button type="button" :class="s.closeBtn()" aria-label="Закрыть корзину" @click="handleClose">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div :class="s.summary()">
          <div :class="s.summaryMeta()">
            <span :class="s.summaryLabel()">Итого</span>
            <strong :class="s.summaryValue()">{{ totalCount }} шт · {{ formatRub(totalAmount) }}</strong>
            <span :class="s.summaryHint()">Сообщение соберётся автоматически в формате “Интересуюсь …”.</span>
          </div>
          <button
            v-if="props.items.length"
            type="button"
            :class="s.clearBtn()"
            @click="emit('clear')"
          >
            Очистить корзину
          </button>
        </div>
      </div>

      <div :class="s.body()">
        <div v-if="props.items.length" :class="s.list()">
          <article v-for="item in props.items" :key="item.product.id" :class="s.item()">
            <div :class="s.itemImageWrap()">
              <img
                :src="item.product.photo || placeholderSvg(item.product.name, 280, 280)"
                :alt="item.product.name"
                :class="s.itemImage()"
              />
            </div>

            <div :class="s.itemContent()">
              <div :class="s.itemTop()">
                <div class="min-w-0">
                  <h3 :class="s.itemName()">{{ item.product.name }}</h3>
                  <p :class="s.itemPrice()">
                    {{ formatRub(item.product.salePrice ?? item.product.price) }} за шт
                  </p>
                </div>
                <strong :class="s.itemTotal()">
                  {{ formatRub((item.product.salePrice ?? item.product.price) * item.quantity) }}
                </strong>
              </div>

              <div v-if="item.product.tags.length" :class="s.itemTags()">
                <span v-for="tag in item.product.tags.slice(0, 4)" :key="tag" :class="s.itemTag()">
                  {{ tag }}
                </span>
              </div>

              <div :class="s.itemBottom()">
                <CartQuantityControl
                  :quantity="item.quantity"
                  size="md"
                  @increment="emit('increment', item.product.id)"
                  @decrement="emit('decrement', item.product.id)"
                />
                <button
                  type="button"
                  :class="s.removeBtn()"
                  @click="emit('remove', item.product.id)"
                >
                  Удалить
                </button>
              </div>
            </div>
          </article>
        </div>

        <div v-else :class="s.empty()">
          <div :class="s.emptyIcon()">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="9" cy="20" r="1.6" />
              <circle cx="18" cy="20" r="1.6" />
              <path d="M3 4h2l2.3 10.2a1 1 0 0 0 .98.78h9.94a1 1 0 0 0 .98-.8L21 7H7.2" />
            </svg>
          </div>
          <h3 :class="s.emptyTitle()">Корзина пока пустая</h3>
          <p :class="s.emptyText()">Добавьте товары через плюс в карточке или в открытом товаре, и здесь появится готовый список для отправки продавцу.</p>
        </div>
      </div>

      <div :class="s.actions()">
        <div :class="s.actionGrid()">
          <a
            v-if="whatsappLink"
            :href="whatsappLink"
            target="_blank"
            rel="noopener"
            :class="s.waBtn()"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.852L.057 23.786a.5.5 0 0 0 .602.633l6.077-1.596A11.937 11.937 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.938 9.938 0 0 1-5.064-1.383l-.364-.215-3.761.988.998-3.651-.236-.373A9.953 9.953 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            WhatsApp
          </a>
          <button
            v-else
            type="button"
            disabled
            :class="s.disabledBtn()"
          >
            WhatsApp не подключён
          </button>

          <button
            v-if="telegramLink"
            type="button"
            :class="s.tgBtn()"
            @click="openTelegram"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.067l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.958.492z"/>
            </svg>
            {{ tgCopied ? 'Сообщение скопировано' : 'Telegram' }}
          </button>
          <button
            v-else
            type="button"
            disabled
            :class="s.disabledBtn()"
          >
            Telegram не подключён
          </button>
        </div>

        <p :class="s.actionNote()">
          Для Telegram текст копируется в буфер перед открытием чата продавца.
        </p>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
:deep(.cart-sheet-dialog) {
  will-change: transform, opacity, filter;
}

:deep(.cart-sheet-dialog.p-dialog-enter-active),
:deep(.cart-sheet-dialog.p-dialog-leave-active) {
  transition:
    transform 280ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 220ms ease,
    filter 280ms ease;
}

:deep(.cart-sheet-dialog.p-dialog-enter-from),
:deep(.cart-sheet-dialog.p-dialog-leave-to) {
  transform: translateY(28px) scale(0.985);
  opacity: 0;
  filter: blur(4px);
}

:deep(.cart-sheet-dialog.p-dialog-enter-to),
:deep(.cart-sheet-dialog.p-dialog-leave-from) {
  transform: translateY(0) scale(1);
  opacity: 1;
  filter: blur(0);
}

@media (prefers-reduced-motion: reduce) {
  :deep(.cart-sheet-dialog.p-dialog-enter-active),
  :deep(.cart-sheet-dialog.p-dialog-leave-active) {
    transition: opacity 140ms ease;
  }

  :deep(.cart-sheet-dialog.p-dialog-enter-from),
  :deep(.cart-sheet-dialog.p-dialog-leave-to) {
    transform: none;
    filter: none;
  }
}
</style>
