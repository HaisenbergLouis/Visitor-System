//导入类型定义，AdminUser是管理员用户对象的TS接口/类型
import type { AdminUser } from "@/mock/users";

//统一存储key常量，避免字符串硬编码写错，所有函数共用同一个localstorage键名
const KEY = "visit-admin-user";

// 获取本地存储的登录管理员用户
export function getAuthUser(): AdminUser | null {
  const raw = localStorage.getItem(KEY);
  //本地没有数据，直接返回null（未登录）
  if (!raw) return null;
  try {
    //字符串转对象，as AdminUser 类型断言
    return JSON.parse(raw) as AdminUser;
  } catch {
    // JSON解析失败：存储被篡改、损坏、格式错误 → 返回null
    return null;
  }
}

// 保存登录用户到localStorage
export function setAuthUser(u: AdminUser) {
  localStorage.setItem(KEY, JSON.stringify(u));
}

// 清除登录用户
export function clearAuthUser() {
  localStorage.removeItem(KEY);
}
