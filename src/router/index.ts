import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { getSession } from '@/services/authServices'
import { trackPageView } from '@/services/yandexMetrika'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth',
      name: 'auth',
      component: () => import('../views/AuthView.vue'),
      meta: { public: true },
    },
    {
      path: '/documents/:slug(terms|privacy|offer|consent|cookies)',
      name: 'document',
      component: () => import('../views/DocumentsView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/preview',
      name: 'preview',
      component: () => import('../views/StorefrontView.vue'),
    },
    {
      path: '/:slug',
      name: 'storefront',
      component: () => import('../views/StorefrontView.vue'),
      meta: { public: true },
      props: true,
    },
  ],
})

router.beforeEach(async (to) => {
  const session = await getSession()
  const isPublic = to.meta.public === true

  if (!session && !isPublic) return { name: 'auth' }
  if (session && to.name === 'auth') return { name: 'home' }
})

router.afterEach((to, from) => {
  if (typeof window === 'undefined') {
    return
  }

  const currentUrl = new URL(to.fullPath, window.location.origin).href
  const previousUrl = from.fullPath
    ? new URL(from.fullPath, window.location.origin).href
    : document.referrer

  trackPageView(currentUrl, previousUrl)
})

export default router
