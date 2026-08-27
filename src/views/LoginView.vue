<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { adminUsers, findUser, type AdminUser } from '@/mock/users'
import { setAuthUser } from '@/utils/auth'
const router = useRouter()
const account = ref('admin')
const password = ref('123456')
const error = ref('')
const failCount = ref(0)
function submit() {
  const u = findUser(account.value.trim(), password.value)
  if (!u) {
    failCount.value++
    error.value =
      failCount.value >= 5
        ? '连续失败 5 次，账户已临时锁定（演示）'
        : '账号或密码错误，请重试（剩余 ' + (5 - failCount.value) + ' 次）'
    return
  }
  error.value = ''
  setAuthUser(u)
  router.push('/dashboard')
}
function quickFill(u: AdminUser) {
  account.value = u.account
  password.value = u.password
  error.value = ''
}
</script>

<template>
  <div class="login-wrap">
    <div class="login-card">
      <!-- 左侧品牌区域 -->
      <div class="login-left">
        <div class="logo-card">
          <div class="logo">🛡️</div>
          <h1>智慧访客管理系统</h1>
          <div class="lg-sub">后台管理端 · 访客全生命周期闭环</div>
        </div>
      </div>

      <!-- 分割线 -->
      <div class="login-divider"></div>

      <!-- 右侧登录表单 -->
      <div class="login-right form-card">
        <div class="form-item">
          <label>账号</label>
          <input v-model="account" placeholder="请输入账号" />
        </div>
        <div class="form-item">
          <label>密码</label>
          <input
            v-model="password"
            type="password"
            placeholder="请输入密码"
            @keyup.enter="submit"
          />
        </div>
        <div v-if="error" class="login-error">⚠️ {{ error }}</div>
        <button class="btn primary lg" style="width: 100%" @click="submit">登 录</button>
        <div class="demo-box">
          <div class="demo-title">演示账户 · 点击快速填入</div>
          <div class="demo-list">
            <div v-for="u in adminUsers" :key="u.account" class="demo-item" @click="quickFill(u)">
              <div class="di-name">
                {{ u.name }}
                <span class="di-role" :class="{ admin: u.role === '超管' }">{{ u.role }}</span>
              </div>
              <div class="di-acc">{{ u.account }} / 123456 · {{ u.dept }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
