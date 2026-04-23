import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { getSession } from '@/services/authServices'

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
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/preview',
      name: 'preview',
      component: () => import('../views/StorefrontView.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  const session = await getSession()
  const isPublic = to.meta.public === true

  if (!session && !isPublic) return { name: 'auth' }
  if (session && to.name === 'auth') return { name: 'home' }
})

export default router
