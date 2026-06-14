<script setup lang="ts">
import { ref, watch } from 'vue'
import { tv } from 'tailwind-variants'

const props = defineProps<{ name: string; photo: string | null; loading: boolean }>()
const emit = defineEmits<{ done: [] }>()

const fading = ref(false)

const styles = tv({
  slots: {
    root: 'fixed inset-0 z-[9999] bg-[var(--surface)] flex flex-col items-center justify-center gap-5 transition-opacity duration-500',
    rootFading: 'opacity-0 pointer-events-none',
    logo:
      'w-24 h-24 object-cover stagger-in rounded-full overflow-hidden border border-[var(--border-color)]',
    storeName: 'text-[28px] font-extrabold text-[var(--text)] stagger-in',
    spinnerWrap: 'fade-in',
    ring: 'w-8 h-8 border-[2.5px] border-[rgba(var(--accent-rgb),_0.2)] border-t-[var(--accent)] rounded-full spin-anim',
  },
})

const { root, rootFading, logo, storeName, spinnerWrap, ring } = styles()

// Запускаем fade-out когда данные загружены (loading → false)
watch(
  () => props.loading,
  (val) => {
    if (!val) {
      fading.value = true
      setTimeout(() => emit('done'), 500)
    }
  },
)
</script>

<template>
  <div :class="[root(), fading && rootFading()]">
    <img v-if="photo" :src="photo" :alt="name" :class="logo()" />
    <div v-else :class="storeName()">{{ name }}</div>
    <div :class="spinnerWrap()">
      <div :class="ring()" />
    </div>
  </div>
</template>