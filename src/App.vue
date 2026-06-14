<template>
  <RouterView />
  <Toast />
  <ConfirmDialog />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

onMounted(() => {
  // Скрываем inline прелоадер из index.html после монтирования Vue
  const preloader = document.getElementById('app-preloader')
  if (preloader) {
    preloader.classList.add('hidden')
    // Удаляем элемент из DOM после анимации
    setTimeout(() => preloader.remove(), 500)
  }
})
</script>
