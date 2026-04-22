<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { tv } from 'tailwind-variants'

defineProps<{ name: string; photo: string | null }>()
const emit = defineEmits<{ done: [] }>()

const fading = ref(false)

const styles = tv({
  slots: {
    root: 'fixed inset-0 z-[9999] bg-[var(--surface)] flex flex-col items-center justify-center gap-5 transition-opacity duration-500',
    rootFading: 'opacity-0 pointer-events-none',
    logo: 'max-w-[120px] max-h-20 object-contain stagger-in rounded-[var(--radius)]',
    storeName: 'text-[28px] font-extrabold text-[var(--text)] stagger-in',
    spinnerWrap: 'fade-in',
    ring: 'w-8 h-8 border-[2.5px] border-[rgba(var(--accent-rgb),_0.2)] border-t-[var(--accent)] rounded-full spin-anim',
  },
})

const { root, rootFading, logo, storeName, spinnerWrap, ring } = styles()

onMounted(() => {
  const t = setTimeout(() => {
    fading.value = true
    setTimeout(() => emit('done'), 500)
  }, 900)
  return () => clearTimeout(t)
})
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
