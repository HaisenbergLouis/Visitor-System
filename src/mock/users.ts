// 后台管理端 · 演示账户（后续替换为真实接口）
export interface AdminUser {
  account: string
  password: string
  name: string
  role: '超管' | '安保' | '前台'
  dept: string
}

export const adminUsers: AdminUser[] = [
  { account: 'admin', password: '123456', name: '园区管理员', role: '超管', dept: '运营管理部' },
  { account: 'security', password: '123456', name: '张安保', role: '安保', dept: '安保部' },
  { account: 'frontdesk', password: '123456', name: '李前台', role: '前台', dept: '行政前台' },
]

export function findUser(account: string, password: string): AdminUser | null {
  return adminUsers.find((u) => u.account === account && u.password === password) ?? null
}
