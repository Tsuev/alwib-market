<script setup lang="ts">
import { ref } from 'vue'

const STORAGE_KEY = 'alwib-cookie-notice-seen'
const visible = ref(localStorage.getItem(STORAGE_KEY) !== '1')

function acknowledge() {
  localStorage.setItem(STORAGE_KEY, '1')
  visible.value = false
}
</script>

<template>
  <Transition name="cookie-notice">
    <aside
      v-if="visible"
      class="fixed bottom-4 left-4 right-4 z-[100] mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.16)] backdrop-blur sm:bottom-6 sm:left-auto sm:right-6 sm:px-5"
      aria-label="Уведомление об использовании cookie"
    >
      <p class="min-w-0 flex-1 text-xs leading-5 text-slate-600 sm:text-sm">
        Мы используем cookie, чтобы сайт работал корректно и становился удобнее.
        <RouterLink to="/documents/cookies" class="font-semibold text-emerald-700 hover:text-emerald-800">
          Подробнее
        </RouterLink>
      </p>
      <button
        type="button"
        class="shrink-0 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700 sm:text-sm"
        @click="acknowledge"
      >
        Понятно
      </button>
    </aside>
  </Transition>
</template>

<style scoped>
.cookie-notice-enter-active,
.cookie-notice-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.cookie-notice-enter-from,
.cookie-notice-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
