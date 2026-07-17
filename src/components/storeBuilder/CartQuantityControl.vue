<script setup lang="ts">
import { computed } from 'vue'
import { tv } from 'tailwind-variants'

const props = withDefaults(defineProps<{
  quantity: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  floating?: boolean
}>(), {
  size: 'md',
  floating: false,
})

const emit = defineEmits<{
  increment: []
  decrement: []
}>()

const styles = tv({
  slots: {
    plusOnly:
      'inline-flex items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--surface)] text-[var(--text)] transition-[transform,border-color,background,color,box-shadow] duration-[180ms] hover:border-[var(--accent)] hover:text-[var(--accent)] active:scale-[0.97] cursor-pointer',
    counter:
      'inline-flex items-center rounded-full border border-[var(--border-color)] bg-[var(--surface)] text-[var(--text)] transition-[border-color,background,box-shadow] duration-[180ms] overflow-hidden',
    counterFloating: 'backdrop-blur-[10px] shadow-[0_12px_28px_rgba(0,0,0,0.16)]',
    btn:
      'inline-flex items-center justify-center text-[var(--text)] transition-[background,color,transform] duration-[180ms] hover:bg-[rgba(var(--accent-rgb),_0.08)] hover:text-[var(--accent)] active:scale-[0.96] cursor-pointer',
    value: 'min-w-[2.25rem] text-center font-bold tabular-nums',
  },
  variants: {
    size: {
      xs: {
        plusOnly: 'w-7.5 h-7.5',
        counter: 'h-7.5',
        btn: 'w-7.5 h-7.5',
        value: 'min-w-[1.6rem] px-1 text-[11px]',
      },
      sm: {
        plusOnly: 'w-8.5 h-8.5',
        counter: 'h-8.5',
        btn: 'w-8.5 h-8.5',
        value: 'min-w-[1.9rem] px-1.5 text-[12px]',
      },
      md: {
        plusOnly: 'w-10 h-10',
        counter: 'h-10',
        btn: 'w-10 h-10',
        value: 'min-w-[2.15rem] px-2 text-[13px]',
      },
      lg: {
        plusOnly: 'w-11 h-11',
        counter: 'h-11',
        btn: 'w-11 h-11',
        value: 'min-w-[2.3rem] px-2.5 text-[14px]',
      },
    },
  },
})

const s = styles({ size: props.size })

const countLabel = computed(() => `${props.quantity} шт`)
</script>

<template>
  <button
    v-if="props.quantity < 1"
    type="button"
    :class="[s.plusOnly(), props.floating && s.counterFloating()]"
    aria-label="Добавить в корзину"
    @click.stop="emit('increment')"
  >
    <svg :width="props.size === 'xs' ? 14 : 16" :height="props.size === 'xs' ? 14 : 16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  </button>

  <div
    v-else
    :class="[s.counter(), props.floating && s.counterFloating()]"
    role="group"
    :aria-label="`Количество в корзине: ${countLabel}`"
    @click.stop
  >
    <button
      type="button"
      :class="s.btn()"
      aria-label="Уменьшить количество"
      @click="emit('decrement')"
    >
      <svg :width="props.size === 'xs' ? 14 : 16" :height="props.size === 'xs' ? 14 : 16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
    <span :class="s.value()">{{ props.quantity }}</span>
    <button
      type="button"
      :class="s.btn()"
      aria-label="Увеличить количество"
      @click="emit('increment')"
    >
      <svg :width="props.size === 'xs' ? 14 : 16" :height="props.size === 'xs' ? 14 : 16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  </div>
</template>
