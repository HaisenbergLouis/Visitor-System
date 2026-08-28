// 全局确认框（Confirm Dialog）消息中心 —— 替代原生 window.confirm，样式与项目 modal 体系统一
import { reactive } from 'vue'

export interface ConfirmOptions {
  title: string
  message: string
  okText?: string
  cancelText?: string
  /** 确认按钮是否为危险操作（红色），默认 false（主色） */
  danger?: boolean
}

interface ConfirmState extends ConfirmOptions {
  id: number
  resolve: (v: boolean) => void
}

const dialogs = reactive<ConfirmState[]>([])
let seed = 0

/** 弹出确认框，返回 Promise<boolean>：确认 true / 取消或关闭 false */
export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  const id = ++seed
  return new Promise((resolve) => {
    dialogs.push({
      id,
      resolve,
      title: opts.title,
      message: opts.message,
      okText: opts.okText,
      cancelText: opts.cancelText,
      danger: opts.danger,
    })
  })
}

export function resolveDialog(id: number, ok: boolean) {
  const i = dialogs.findIndex((d) => d.id === id)
  const d = dialogs[i]
  if (d) {
    d.resolve(ok)
    dialogs.splice(i, 1)
  }
}

export function useDialogs() {
  return dialogs
}
