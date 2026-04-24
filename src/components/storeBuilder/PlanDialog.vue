<script setup lang="ts">
import { tv } from 'tailwind-variants'
import { useStoreBuilderStore } from '@/stores/storeBuilder'

defineEmits<{ close: [] }>()

const store = useStoreBuilderStore()

const s = tv({
  slots: {
    overlay: 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4',
    dialog: 'w-full max-w-[580px] bg-[var(--surface)] rounded-[var(--radius)] shadow-2xl overflow-hidden',
    header: 'px-6 pt-6 pb-4 border-b border-[var(--border-color)]',
    title: 'text-[18px] font-bold text-[var(--text)]',
    subtitle: 'text-sm text-[var(--text-sub)] mt-0.5',
    closeBtn: 'absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-sub)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)] transition-colors border-0 bg-transparent cursor-pointer',
    body: 'p-6 grid grid-cols-2 gap-4',
    card: 'relative rounded-[var(--radius)] border-2 p-5 flex flex-col gap-4 transition-all duration-200',
    cardFree: 'border-[var(--border-color)] bg-[var(--surface-alt)]',
    cardPro: 'border-[var(--accent)] bg-[rgba(var(--accent-rgb),_0.04)]',
    cardCurrentBadge: 'absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
    cardCurrentBadgeFree: 'bg-[var(--border-color)] text-[var(--text-sub)]',
    cardCurrentBadgePro: 'bg-[var(--accent)] text-white',
    planName: 'text-[15px] font-bold text-[var(--text)]',
    price: 'flex items-baseline gap-1',
    priceAmount: 'text-[28px] font-bold text-[var(--text)]',
    pricePeriod: 'text-sm text-[var(--text-sub)]',
    featureList: 'flex flex-col gap-2 flex-1',
    feature: 'flex items-center gap-2 text-sm text-[var(--text)]',
    featureIcon: 'w-4 h-4 shrink-0',
    featureIconOk: 'text-[#5b8c5a]',
    featureIconNo: 'text-[var(--text-sub)] opacity-40',
    btn: 'w-full py-2.5 rounded-[var(--btn-radius)] text-sm font-semibold transition-all duration-200 border-0 cursor-pointer',
    btnFree: 'bg-[var(--surface)] border border-[var(--border-color)] text-[var(--text-sub)] cursor-default',
    btnPro: 'bg-[var(--accent)] text-white hover:opacity-85 active:scale-[0.98]',
    btnCurrent: 'bg-[var(--surface-alt)] text-[var(--text-sub)] cursor-default',
  },
})()

const FREE_FEATURES = [
  { text: 'До 5 товаров', ok: true },
  { text: '3 темы оформления', ok: true },
  { text: 'WhatsApp для связи', ok: true },
  { text: 'Telegram для связи', ok: false },
  { text: 'Все темы оформления', ok: false },
  { text: 'До 100 товаров', ok: false },
]

const PRO_FEATURES = [
  { text: 'До 100 товаров', ok: true },
  { text: 'Все темы оформления', ok: true },
  { text: 'WhatsApp для связи', ok: true },
  { text: 'Telegram для связи', ok: true },
  { text: 'Приоритетная поддержка', ok: true },
  { text: 'Ранний доступ к функциям', ok: true },
]
</script>

<template>
  <div :class="s.overlay()" @click.self="$emit('close')">
    <div :class="s.dialog()">
      <div :class="s.header()" style="position: relative">
        <p :class="s.title()">Тарифный план</p>
        <p :class="s.subtitle()">Выберите подходящий план для вашего магазина</p>
        <button :class="s.closeBtn()" @click="$emit('close')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div :class="s.body()">
        <!-- Free card -->
        <div :class="[s.card(), s.cardFree()]">
          <span
            v-if="!store.isPro"
            :class="[s.cardCurrentBadge(), s.cardCurrentBadgeFree()]"
          >Текущий</span>

          <div>
            <p :class="s.planName()">Free</p>
            <div :class="s.price()">
              <span :class="s.priceAmount()">0 ₽</span>
              <span :class="s.pricePeriod()">/ всегда</span>
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

          <div>
            <p :class="s.planName()">Pro</p>
            <div :class="s.price()">
              <span :class="s.priceAmount()">690 ₽</span>
              <span :class="s.pricePeriod()">/ месяц</span>
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

          <button :class="[s.btn(), store.isPro ? s.btnCurrent() : s.btnPro()]" :disabled="store.isPro">
            {{ store.isPro ? 'Текущий план' : 'Перейти на Pro' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
