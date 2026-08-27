// 全局提示（Toast）消息中心 —— 替代原生 alert
import { reactive } from 'vue'

export interface ToastItem {
  id: number
  type: 'success' | 'warn' | 'error' | 'info'
  text: string
  duration: number
}

const toasts = reactive<ToastItem[]>([])
let seed = 0

function remove(id: number) {
  const i = toasts.findIndex((t) => t.id === id)
  if (i >= 0) toasts.splice(i, 1)
}

function push(type: ToastItem['type'], text: string, duration?: number) {
  const id = ++seed
  const item: ToastItem = {
    id,
    type,
    text,
    duration: duration ?? (type === 'error' ? 4000 : 2600),
  }
  toasts.push(item)
  setTimeout(() => remove(id), item.duration)
}

export const notify = {
  success: (t: string) => push('success', t),
  warn: (t: string) => push('warn', t),
  error: (t: string) => push('error', t),
  info: (t: string) => push('info', t),
}

export function removeToast(id: number) {
  remove(id)
}

export function useToasts() {
  return toasts
}
