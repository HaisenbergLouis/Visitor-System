<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  DataAnalysis,
  User,
  Checked,
  Key,
  Lock,
  Van,
  TrendCharts,
  Setting,
  OfficeBuilding,
} from '@element-plus/icons-vue'
import { getAuthUser, clearAuthUser } from '@/utils/auth'
import { nowFull } from '@/utils/date'

const route = useRoute()
const router = useRouter()

// ===== 顶部实时时钟（每秒刷新） =====
const clock = ref(nowFull())
let clockTimer: number | undefined
onMounted(() => {
  clockTimer = window.setInterval(() => (clock.value = nowFull()), 1000)
})
onBeforeUnmount(() => window.clearInterval(clockTimer))

const navGroups = [
  {
    label: '概览',
    items: [
      { path: '/dashboard', label: '数据看板', ico: DataAnalysis },
    ],
  },
  {
    label: '访客管理',
    items: [
      { path: '/visitors', label: '访客管理', ico: User },
      { path: '/approvals', label: '审批台', ico: Checked },
      { path: '/verify', label: '到访核验', ico: Key },
    ],
  },
  {
    label: '通行与停车',
    items: [
      { path: '/access', label: '门禁通行', ico: Lock },
      { path: '/parking', label: '停车管理', ico: Van },
    ],
  },
  {
    label: '数据分析',
    items: [{ path: '/report', label: '报表中心', ico: TrendCharts }],
  },
  {
    label: '系统',
    items: [{ path: '/settings', label: '系统设置', ico: Setting }],
  },
]

// RBAC：各角色可访问的菜单
const roleMenus: Record<string, string[]> = {
  超管: ['/dashboard', '/visitors', '/approvals', '/verify', '/access', '/parking', '/report', '/settings'],
  安保: ['/dashboard', '/visitors', '/verify', '/access', '/parking'],
  前台: ['/dashboard', '/visitors', '/approvals', '/verify'],
}

const user = computed(() => getAuthUser())
const role = computed(() => user.value?.role ?? '超管')

const visibleGroups = computed(() =>
  navGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => (roleMenus[role.value] ?? []).includes(i.path)) }))
    .filter((g) => g.items.length > 0),
)

const roleClass = computed(() =>
  role.value === '超管' ? 'g' : role.value === '安保' ? 'i' : 'w',
)

function logout() {
  clearAuthUser()
  router.push('/login')
}
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-side">
      <div class="brand">
        <div class="logo"><OfficeBuilding style="width: 22px; height: 22px" /></div>
        <div>
          <b>智慧访客</b>
          <small>Visitor System</small>
        </div>
      </div>
      <nav>
        <template v-for="g in visibleGroups" :key="g.label">
          <div class="grp">{{ g.label }}</div>
          <router-link
            v-for="item in g.items"
            :key="item.path"
            :to="item.path"
            class="sitem"
            :class="{ on: route.path === item.path }"
          >
            <span class="ico"><component :is="item.ico" /></span>{{ item.label }}
          </router-link>
        </template>
      </nav>
      <div class="foot">园区：南京软件谷 · 演示数据</div>
    </aside>

    <div class="admin-main">
      <div class="admin-topbar">
        <div>
          <span class="t-title">{{ route.meta.title }}</span>
          <span class="t-sub">访客全生命周期闭环管理</span>
        </div>
        <div class="t-right">
          <span style="font-size: 13px; color: var(--ink-500); font-variant-numeric: tabular-nums">{{ clock }}</span>
          <span style="font-size: 13px; color: var(--ink-500)">在线 · 演示环境</span>
          <div class="u-ava">{{ user?.name?.[0] || '园' }}</div>
          <div style="font-size: 13px; font-weight: 600">{{ user?.name || '园区管理员' }}</div>
          <span class="badge" :class="roleClass">{{ role }}</span>
          <button class="btn ghost sm" @click="logout">退出</button>
        </div>
      </div>
      <div class="admin-content">
        <router-view />
      </div>
    </div>
  </div>
</template>
