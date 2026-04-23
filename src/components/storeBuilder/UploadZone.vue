<script setup lang="ts">
import { ref } from 'vue'
import { tv } from 'tailwind-variants'

const props = defineProps<{ modelValue: string | null; uploading?: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  change: [file: File]
}>()

const dragging = ref(false)
const hovering = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const styles = tv({
  slots: {
    root: 'border-2 border-dashed border-[var(--border-color)] rounded-[var(--radius)] overflow-hidden cursor-pointer transition-[border-color,background] duration-200',
    rootDragging: 'border-[var(--accent)] bg-[rgba(var(--accent-rgb),_0.04)]',
    rootHovering: 'border-[var(--accent)] bg-[rgba(var(--accent-rgb),_0.04)]',
    rootHasPhoto: 'border-solid cursor-default',
    placeholder: 'flex flex-col items-center justify-center gap-2 py-9 px-5 text-[var(--text-sub)] text-center',
    placeholderText: 'text-sm font-medium',
    placeholderAccent: 'text-[var(--accent)]',
    placeholderSmall: 'text-xs opacity-70',
    preview: 'relative',
    previewImg: 'w-full h-[200px] object-cover block',
    removeBtn:
      'absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 text-white text-base flex items-center justify-center opacity-0 transition-opacity duration-[180ms] hover:opacity-100',
    removeBtnVisible: 'opacity-100',
    uploadingOverlay:
      'absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]',
    spinner:
      'w-7 h-7 border-[3px] border-white/30 border-t-white rounded-full animate-spin',
  },
})

const {
  root,
  rootDragging,
  rootHovering,
  rootHasPhoto,
  placeholder,
  placeholderText,
  placeholderAccent,
  placeholderSmall,
  preview,
  previewImg,
  removeBtn,
  removeBtnVisible,
  uploadingOverlay,
  spinner,
} = styles()

function handleFile(file: File | undefined) {
  if (!file) return
  if (!file.type.startsWith('image/')) return
  if (file.size > 5 * 1024 * 1024) return // 5 MB pre-check (service validates too)
  emit('change', file)
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  dragging.value = false
  handleFile(e.dataTransfer?.files[0])
}
</script>

<template>
  <div
    :class="[
      root(),
      dragging && rootDragging(),
      hovering && !props.modelValue && rootHovering(),
      props.modelValue && rootHasPhoto(),
    ]"
    @dragover.prevent="dragging = true"
    @dragleave="dragging = false"
    @drop="onDrop"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
    @click="!props.modelValue && !props.uploading && fileInput?.click()"
  >
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFile(($event.target as HTMLInputElement).files?.[0])"
    />

    <div v-if="props.modelValue" :class="preview()">
      <img :src="props.modelValue" alt="store" :class="previewImg()" />
      <button
        :class="[removeBtn(), hovering && !props.uploading && removeBtnVisible()]"
        @click.stop="emit('update:modelValue', null)"
      >
        ×
      </button>
      <div v-if="props.uploading" :class="uploadingOverlay()">
        <span :class="spinner()" />
      </div>
    </div>

    <div v-else :class="placeholder()">
      <template v-if="props.uploading">
        <span :class="spinner() + ' border-(--accent)/30 border-t-(--accent)'" />
        <p :class="placeholderText()">Загружаем…</p>
      </template>
      <template v-else>
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <rect x="3" y="3" width="18" height="18" rx="2.5" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <p :class="placeholderText()">
          Перетащите фото или
          <span :class="placeholderAccent()">выберите файл</span>
        </p>
        <small :class="placeholderSmall()">JPG, PNG, WebP · до 5 MB</small>
      </template>
    </div>
  </div>
</template>
