<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { tv } from 'tailwind-variants'
import Dialog from 'primevue/dialog'
import type { Product } from '@/types/types'
import { formatRub, calcDiscount, placeholderSvg } from '@/composables/useImageToBase64'

const props = defineProps<{ product: Product; whatsapp?: string | null; telegram?: string | null }>()
const emit = defineEmits<{ close: [] }>()

const visible = ref(false)

onMounted(() => nextTick(() => { visible.value = true }))

const discount = calcDiscount(props.product.price, props.product.salePrice)

function contactMessage() {
  const price = props.product.salePrice
    ? formatRub(props.product.salePrice)
    : formatRub(props.product.price)
  return `${props.product.name}\n${props.product.description}\n${price}\nЕсть в наличии?`
}

function waLink() {
  const phone = (props.whatsapp ?? '').replace(/\D/g, '')
  return `https://wa.me/${phone}?text=${encodeURIComponent(contactMessage())}`
}

const tgCopied = ref(false)

async function openTelegram() {
  await navigator.clipboard.writeText(contactMessage())
  tgCopied.value = true
  setTimeout(() => (tgCopied.value = false), 2000)
  const username = (props.telegram ?? '').replace(/^@/, '')
  window.open(`https://t.me/${username}`, '_blank', 'noopener')
}

const styles = tv({
  slots: {
    overlay: 'bg-black/50',
    box: 'bg-[var(--surface)] rounded-[calc(var(--radius)+4px)] w-full max-w-[780px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] transition-[background] duration-300 relative overflow-hidden',
    inner: 'grid grid-cols-2',
    imgWrap: 'relative aspect-square overflow-hidden bg-[var(--surface-alt)]',
    img: 'w-full h-full object-cover',
    badge: 'absolute top-2.5 right-2.5 bg-[#E85D47] text-white text-[13px] font-bold px-2.5 py-1 rounded-full',
    closeBtn: 'absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--surface)]/80 backdrop-blur-sm text-[var(--text-sub)] hover:bg-[var(--surface-alt)] transition-[background,color] duration-[180ms]',
    info: 'px-7 pt-5 pl-6 flex flex-col gap-3.5 overflow-y-auto max-h-[80vh]',
    tagsRow: 'flex gap-1.5 flex-wrap',
    tag: 'inline-flex items-center gap-1 px-2.5 py-[3px] bg-[rgba(var(--accent-rgb),_0.1)] text-[var(--accent)] rounded-full text-xs font-medium',
    name: 'text-[22px] font-extrabold text-[var(--text)] leading-snug',
    desc: 'text-sm text-[var(--text-sub)] leading-[1.7]',
    priceRow: 'flex items-baseline gap-2.5',
    priceSale: 'font-bold text-[var(--accent)] text-[22px]',
    priceOrig: 'text-sm text-[var(--text-sub)] line-through',
    priceOnly: 'font-bold text-[22px] text-[var(--text)]',
    contactWrap: 'flex flex-col gap-2 mt-auto',
    contactLabel: 'text-[11px] font-bold text-[var(--text-sub)] uppercase tracking-[.07em]',
    contactRow: 'flex gap-2.5',
    waBtn: 'flex-1 flex items-center justify-center gap-2 py-3.5 text-[15px] font-bold bg-[#25D366] text-white rounded-[var(--btn-radius)] hover:opacity-85 active:scale-[0.98] transition-[opacity,transform] duration-[180ms]',
    tgBtn: 'flex-1 flex items-center justify-center gap-2 py-3.5 text-[15px] font-bold bg-[#229ED9] text-white rounded-[var(--btn-radius)] hover:opacity-85 active:scale-[0.98] transition-[opacity,transform] duration-[180ms]',
  },
})

const s = styles()

function handleClose() {
  visible.value = false
  setTimeout(() => emit('close'), 260)
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
      content: { class: 'p-0' },
      footer: { class: 'hidden' },
    }"
  >
    <button :class="s.closeBtn()" @click="handleClose">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>

    <div :class="s.inner()">
      <div :class="s.imgWrap()">
        <img
          :src="product.photo || placeholderSvg(product.name, 500, 500)"
          :alt="product.name"
          :class="s.img()"
        />
        <span v-if="discount > 0" :class="s.badge()">−{{ discount }}%</span>
      </div>

      <div :class="s.info()">
        <div v-if="product.tags.length" :class="s.tagsRow()">
          <span v-for="t in product.tags" :key="t" :class="s.tag()">{{ t }}</span>
        </div>

        <h2 :class="s.name()">{{ product.name }}</h2>
        <p :class="s.desc()">{{ product.description }}</p>

        <div :class="s.priceRow()">
          <template v-if="product.salePrice">
            <span :class="s.priceSale()">{{ formatRub(product.salePrice) }}</span>
            <span :class="s.priceOrig()">{{ formatRub(product.price) }}</span>
          </template>
          <span v-else :class="s.priceOnly()">{{ formatRub(product.price) }}</span>
        </div>
        
        <div :class="s.contactWrap()">
          <span :class="s.contactLabel()">Связаться</span>
        <div :class="s.contactRow()">
          <a
            v-if="props.whatsapp"
            :href="waLink()"
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
            v-if="props.telegram"
            :class="s.tgBtn()"
            @click="openTelegram"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.067l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.958.492z"/>
            </svg>
            {{ tgCopied ? 'Сообщение скопировано!' : 'Telegram' }}
          </button>
          <button v-if="!props.whatsapp && !props.telegram" disabled class="flex-1 py-3.5 text-[15px] font-bold bg-(--surface-alt) text-(--text-sub) rounded-(--btn-radius) cursor-default">
            Связаться
          </button>
        </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<style lang="scss" scoped>
@media (max-width: 640px) {
  :deep(.p-dialog) {
    .grid { grid-template-columns: 1fr; }
    .aspect-square { aspect-ratio: 16/9; }
  }
}
</style>
