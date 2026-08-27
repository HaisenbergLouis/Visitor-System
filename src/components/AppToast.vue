<script setup lang="ts">
import { useToasts, removeToast } from '@/utils/toast'

const toasts = useToasts()
const icons: Record<string, string> = { success: '✓', warn: '!', error: '×', info: 'i' }
</script>

<template>
  <div class="app-toast-wrap">
    <transition-group name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="app-toast"
        :class="t.type"
        @click="removeToast(t.id)"
      >
        <span class="app-toast-icon">{{ icons[t.type] }}</span>
        <span class="app-toast-text">{{ t.text }}</span>
        <span class="app-toast-close">×</span>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.app-toast-wrap {
  position: fixed;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  pointer-events: none;
  width: min(92vw, 520px);
}
.app-toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 260px;
  max-width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--ink-800);
  background: #fff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.16);
  border: 1px solid var(--line);
  cursor: pointer;
}
.app-toast-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  flex: none;
}
.app-toast-text {
  flex: 1;
  line-height: 1.45;
}
.app-toast-close {
  color: var(--ink-400);
  font-size: 16px;
  flex: none;
  margin-left: 2px;
}
.app-toast.success .app-toast-icon {
  background: var(--success);
}
.app-toast.warn .app-toast-icon {
  background: var(--warning);
}
.app-toast.error .app-toast-icon {
  background: var(--danger);
}
.app-toast.info .app-toast-icon {
  background: var(--info);
}
.app-toast.success {
  border-color: #bbf7d0;
}
.app-toast.warn {
  border-color: #fde68a;
}
.app-toast.error {
  border-color: #fecaca;
}
.app-toast.info {
  border-color: #bfdbfe;
}

/* 进入：从顶部滑入淡入 */
.toast-enter-active {
  transition: all 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-16px) scale(0.96);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.97);
}
.toast-move {
  transition: transform 0.25s ease;
}
</style>
