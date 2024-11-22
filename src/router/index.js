import { createRouter, createWebHashHistory } from 'vue-router'
import Style from '@/views/StyleView.vue'
// import Home from '@/views/HomeView.vue'
import AppHome from '@/views/app/HomeView.vue'
import VideosView from '@/views/app/VideosView.vue'
import IdeasView from '@/views/app/IdeasView.vue'
import PromptsView from '@/views/app/PromptsView.vue'
import WizardView  from '@/views/app/WizardView.Vue'

const routes = [
  // {
  //   meta: {
  //     title: 'Select style'
  //   },
  //   path: '/',
  //   name: 'style',
  //   component: Style
  // },
  {
    // Document title tag
    // We combine it with defaultDocumentTitle set in `src/main.js` on router.afterEach hook
    meta: {
      title: 'Dashboard'
    },
    path: '/',
    name: 'dashboard',
    component: AppHome
  },
  {
    meta: {
      title: 'Ideas'
    },
    path: '/ideas',
    name: 'ideas',
    component: IdeasView
  },
  {
    meta: {
      title: 'Videos'
    },
    path: '/videos',
    name: 'videos',
    component: VideosView
  },
  {
    meta: {
      title: 'Prompts'
    },
    path: '/prompts',
    name: 'prompts',
    component: PromptsView
  },
  {
    meta: {
      title: 'Weather Data Wizard'
    },
    path: '/wizard',
    name: 'wizard',
    component: WizardView
  },
  // {
  //   meta: {
  //     title: 'Tables'
  //   },
  //   path: '/tables',
  //   name: 'tables',
  //   component: () => import('@/views/TablesView.vue')
  // },
  {
    meta: {
      title: 'Forms'
    },
    path: '/forms',
    name: 'forms',
    component: () => import('@/views/FormsView.vue')
  },
  {
    meta: {
      title: 'Profile'
    },
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue')
  },
  {
    meta: {
      title: 'Ui'
    },
    path: '/ui',
    name: 'ui',
    component: () => import('@/views/UiView.vue')
  },
  {
    meta: {
      title: 'Responsive layout'
    },
    path: '/responsive',
    name: 'responsive',
    component: () => import('@/views/ResponsiveView.vue')
  },
  {
    meta: {
      title: 'Login'
    },
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue')
  },
  {
    meta: {
      title: 'Error'
    },
    path: '/error',
    name: 'error',
    component: () => import('@/views/ErrorView.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})

export default router
