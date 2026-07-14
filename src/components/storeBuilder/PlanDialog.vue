<script setup lang="ts">
import { ref } from 'vue'
import { tv } from 'tailwind-variants'
import { useToast } from 'primevue/usetoast'
import { useStoreBuilderStore } from '@/stores/storeBuilder'
import { createProCheckout, rememberPendingCheckout } from '@/services/subscriptionService'

const emit = defineEmits<{ close: [] }>()

const store = useStoreBuilderStore()
const toast = useToast()
const checkoutLoading = ref(false)

const s = tv({
  slots: {
    overlay: 'fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4',
    dialog: 'w-full sm:max-w-[620px] bg-[var(--surface)] rounded-t-[24px] sm:rounded-[var(--radius)] shadow-2xl overflow-hidden max-h-[92dvh] sm:max-h-[90vh] flex flex-col',
    header: 'px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-[var(--border-color)]',
    title: 'text-[20px] font-bold text-[var(--text)]',
    subtitle: 'text-sm text-[var(--text-sub)] mt-1 pr-8 sm:pr-10',
    closeBtn: 'absolute top-3 sm:top-4 right-3 sm:right-4 w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-sub)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)] transition-colors border-0 bg-transparent cursor-pointer',
    body: 'p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 overflow-y-auto',
    card: 'relative rounded-[20px] border-2 p-4 sm:p-5 flex flex-col gap-4 transition-all duration-200',
    cardFree: 'border-[var(--border-color)] bg-[var(--surface-alt)]',
    cardPro: 'border-[var(--accent)] bg-[linear-gradient(180deg,rgba(var(--accent-rgb),_0.11),rgba(var(--accent-rgb),_0.03))]',
    cardCurrentBadge: 'absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
    cardCurrentBadgeFree: 'bg-[var(--border-color)] text-[var(--text-sub)]',
    cardCurrentBadgePro: 'bg-[var(--accent)] text-white',
    planHeader: 'flex items-start justify-between gap-3',
    planName: 'text-[16px] font-bold text-[var(--text)]',
    planDescription: 'mt-1 text-[12px] leading-5 text-[var(--text-sub)]',
    priceBlock: 'shrink-0 text-right min-w-[92px] sm:min-w-[108px]',
    price: 'flex items-baseline justify-end gap-1 whitespace-nowrap',
    priceAmount: 'text-[30px] sm:text-[32px] leading-none font-bold text-[var(--text)]',
    priceCurrency: 'text-[30px] sm:text-[32px] leading-none font-bold text-[var(--text)]',
    pricePeriod: 'mt-1 text-sm leading-4 text-[var(--text-sub)]',
    featureList: 'flex flex-col gap-2 flex-1',
    feature: 'flex items-start gap-2 text-[13px] sm:text-sm text-[var(--text)] leading-5',
    featureIcon: 'w-4 h-4 shrink-0',
    featureIconOk: 'text-[#5b8c5a]',
    featureIconNo: 'text-[var(--text-sub)] opacity-40',
    note: 'rounded-[16px] border border-[rgba(var(--accent-rgb),_0.16)] bg-[rgba(var(--accent-rgb),_0.05)] px-3 py-2.5 text-[12px] leading-5 text-[var(--text-sub)]',
    btn: 'w-full py-3 rounded-[var(--btn-radius)] text-sm font-semibold transition-all duration-200 border-0 cursor-pointer',
    btnFree: 'bg-[var(--surface)] border border-[var(--border-color)] text-[var(--text-sub)] cursor-default',
    btnPro: 'bg-[var(--accent)] text-white hover:opacity-85 active:scale-[0.98] disabled:opacity-65 disabled:cursor-not-allowed',
    btnCurrent: 'bg-[var(--surface-alt)] text-[var(--text-sub)] cursor-default',
    btnInline: 'inline-flex items-center justify-center gap-2',
    spinner: 'w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin',
  },
})()

const FREE_FEATURES = [
  { text: 'До 10 товаров', ok: true },
  { text: '3 темы оформления', ok: true },
  { text: 'WhatsApp для связи', ok: true },
  { text: 'Telegram для связи', ok: false },
  { text: 'Все темы оформления', ok: false },
  { text: 'Товары с 11-го скрыты', ok: false },
]

const PRO_FEATURES = [
  { text: 'До 100 товаров', ok: true },
  { text: 'Все темы оформления', ok: true },
  { text: 'WhatsApp для связи', ok: true },
  { text: 'Telegram для связи', ok: true },
  { text: 'Приоритетная поддержка', ok: true },
  { text: 'Ранний доступ к функциям', ok: true },
]

async function handleCheckout() {
  if (store.isPro || checkoutLoading.value) return

  checkoutLoading.value = true

  try {
    const { confirmationUrl, paymentId } = await createProCheckout()
    rememberPendingCheckout(paymentId)
    window.location.href = confirmationUrl
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Не удалось начать оплату',
      detail: error instanceof Error ? error.message : 'Попробуйте ещё раз',
      life: 4500,
    })
  } finally {
    checkoutLoading.value = false
  }
}
</script>

<template>
  <div :class="s.overlay()" @click.self="$emit('close')">
    <div :class="s.dialog()">
      <div :class="s.header()" style="position: relative">
        <p :class="s.title()">Тарифный план</p>
        <p :class="s.subtitle()">Подключите Pro, чтобы открыть все темы, Telegram и расширенные лимиты.</p>
        <button :class="s.closeBtn()" @click="emit('close')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div :class="s.body()">
        <!-- Free card -->
        <div :class="[s.card(), s.cardFree()]">
          <div :class="s.planHeader()">
            <div>
            <p :class="s.planName()">Free</p>
            <p :class="s.planDescription()">Для старта и базовой витрины</p>
            </div>
            <div :class="s.priceBlock()">
              <div :class="s.price()">
                <span :class="s.priceAmount()">0</span>
                <span :class="s.priceCurrency()">₽</span>
              </div>
              <div :class="s.pricePeriod()">/ всегда</div>
            </div>
          </div>

          <ul :class="s.featureList()">
            <li v-for="f in FREE_FEATURES" :key="f.text" :class="s.feature()">
              <svg v-if="f.ok" :class="[s.featureIcon(), s.featureIconOk()]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <svg v-else :class="[s.featureIcon(), s.featureIconNo()]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span :style="f.ok ? '' : 'opacity: 0.45'">{{ f.text }}</span>
            </li>
          </ul>

          <button :class="[s.btn(), store.isPro ? s.btnFree() : s.btnCurrent()]" disabled>
            {{ store.isPro ? 'Базовый тариф' : 'Текущий план' }}
          </button>
        </div>

        <!-- Pro card -->
        <div :class="[s.card(), s.cardPro()]">
          <span
            v-if="store.isPro"
            :class="[s.cardCurrentBadge(), s.cardCurrentBadgePro()]"
          >Текущий</span>

          <div :class="s.planHeader()">
            <div>
            <p :class="s.planName()">Pro</p>
            <p :class="s.planDescription()">Полный доступ для рабочего магазина</p>
            </div>
            <div :class="s.priceBlock()">
              <div :class="s.price()">
                <span :class="s.priceAmount()">690</span>
                <span :class="s.priceCurrency()">₽</span>
              </div>
              <div :class="s.pricePeriod()">/ месяц</div>
            </div>
          </div>

          <ul :class="s.featureList()">
            <li v-for="f in PRO_FEATURES" :key="f.text" :class="s.feature()">
              <svg :class="[s.featureIcon(), s.featureIconOk()]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {{ f.text }}
            </li>
          </ul>

          <div :class="s.note()">
            Безопасная оплата через ЮKassa. После первой оплаты карта может быть сохранена для автопродления. Если продление не пройдет, магазин вернется на Free.
          </div>

          <button
            :class="[s.btn(), s.btnInline(), store.isPro ? s.btnCurrent() : s.btnPro()]"
            :disabled="store.isPro || checkoutLoading"
            @click="handleCheckout"
          >
            <span v-if="checkoutLoading" :class="s.spinner()" />
            {{ store.isPro ? 'Текущий план' : checkoutLoading ? 'Переходим к оплате…' : 'Перейти на Pro' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
