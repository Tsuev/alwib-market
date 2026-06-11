<script setup lang="ts">
import { tv } from 'tailwind-variants'

defineEmits<{ close: [] }>()

const s = tv({
  slots: {
    overlay:
      'fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4',
    dialog:
      'w-full sm:max-w-[440px] bg-[var(--surface)] rounded-t-[24px] sm:rounded-[var(--radius)] shadow-2xl overflow-hidden',
    body: 'px-5 sm:px-7 pt-7 sm:pt-8 pb-6 sm:pb-7 text-center',
    iconWrap:
      'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(var(--accent-rgb),_0.12)] text-[var(--accent)]',
    title: 'text-[24px] sm:text-[26px] font-bold text-[var(--text)]',
    text: 'mt-2 text-[15px] leading-6 text-[var(--text-sub)]',
    action:
      'mt-6 w-full rounded-[var(--btn-radius)] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.99] border-0 cursor-pointer',
  },
})()
</script>

<template>
  <div :class="s.overlay()" @click.self="$emit('close')">
    <div :class="s.dialog()">
      <div :class="s.body()">
        <div :class="s.iconWrap()">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 :class="s.title()">Поздравляю!</h2>
        <p :class="s.text()">
          Подписка успешно оформлена!<br />
          Пользуйтесь всеми привелегиями pro!
        </p>
        <button :class="s.action()" @click="$emit('close')">Отлично</button>
      </div>
    </div>
  </div>
</template>
