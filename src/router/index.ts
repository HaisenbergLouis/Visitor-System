import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '@/layout/AdminLayout.vue'
import { getAuthUser } from '@/utils/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/',
      component: AdminLayout,
      redirect: '/dashboard',
      children: [
        { path: 'dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue'), meta: { title: '数据看板', group: '概览' } },
        { path: 'visitors', name: 'visitors', component: () => import('@/views/VisitorsView.vue'), meta: { title: '访客管理', group: '访客管理' } },
        { path: 'approvals', name: 'approvals', component: () => import('@/views/ApprovalView.vue'), meta: { title: '审批台', group: '访客管理' } },
        { path: 'verify', name: 'verify', component: () => import('@/views/VerifyView.vue'), meta: { title: '到访核验', group: '访客管理' } },
        { path: 'access', name: 'access', component: () => import('@/views/AccessView.vue'), meta: { title: '门禁通行', group: '通行与停车' } },
        { path: 'parking', name: 'parking', component: () => import('@/views/ParkingView.vue'), meta: { title: '停车管理', group: '通行与停车' } },
        { path: 'report', name: 'report', component: () => import('@/views/ReportView.vue'), meta: { title: '报表中心', group: '数据分析' } },
        { path: 'settings', name: 'settings', component: () => import('@/views/SettingsView.vue'), meta: { title: '系统设置', group: '系统' } },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
})

// 登录守卫：未登录访问后台 → 跳登录页；已登录访问登录页 → 进看板
router.beforeEach((to) => {
  const authed = !!getAuthUser()
  if (to.path !== '/login' && !authed) return '/login'
  if (to.path === '/login' && authed) return '/dashboard'
  return true
})

export default router
