// ============================================================
// 统一日期工具：业务存储格式 MM-DD；input[type=date] 需要 YYYY-MM-DD
// 所有日期基于当前真实时间计算，杜绝写死日期
// ============================================================

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function fmtDate(d: Date): string {
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** 今天，MM-DD */
export function today(): string {
  return fmtDate(new Date())
}

/** 相对今天偏移 offset 天，MM-DD（如 relDate(-1) 昨天 / relDate(1) 明天） */
export function relDate(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return fmtDate(d)
}

/** 今天，YYYY-MM-DD（input[type=date] 的值） */
export function todayFull(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** 'MM-DD' → 'YYYY-MM-DD'（当前年份） */
export function toFullDate(v: string): string {
  if (!v) return todayFull()
  const y = new Date().getFullYear()
  return `${y}-${v}`
}

/** 'YYYY-MM-DD' → 'MM-DD'（业务存储格式） */
export function fromFullDate(v: string): string {
  return v ? v.slice(5) : today()
}

/** 当前 HH:mm */
export function nowHM(): string {
  const d = new Date()
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** 完整实时时间：YYYY-MM-DD HH:mm:ss 周X（顶部时钟用） */
export function nowFull(): string {
  const d = new Date()
  const week = '日一二三四五六'[d.getDay()]
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())} 周${week}`
}
