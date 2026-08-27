// 统一 API 客户端：对接 mock-server（http://localhost:3001）
import type { VisitRecord, Verify, Device, Parking, Blacklist, LinkRule, ParkingConfig } from '@/mock/data'

export const API_BASE = 'http://localhost:3001/api'

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error('API error ' + res.status)
  return res.json() as Promise<T>
}

function apiPatch<T>(path: string, data: object) {
  return req<T>(path, { method: 'PATCH', body: JSON.stringify(data) })
}

export const api = {
  // 访客 / 预约
  listVisits: () => req<VisitRecord[]>('/visits'),
  createVisit: (data: Partial<VisitRecord>) =>
    req<VisitRecord>('/visits', { method: 'POST', body: JSON.stringify(data) }),
  updateVisit: (id: string, body: Partial<VisitRecord>) =>
    apiPatch<VisitRecord>('/visits/' + encodeURIComponent(id), body),
  // 核验
  listVerifies: () => req<Verify[]>('/verifies'),
  createVerify: (data: Partial<Verify>) =>
    req<Verify>('/verifies', { method: 'POST', body: JSON.stringify(data) }),
  // 设备
  listDevices: () => req<Device[]>('/devices'),
  updateDevice: (id: string, body: Partial<Device>) =>
    apiPatch<Device>('/devices/' + encodeURIComponent(id), body),
  // 联动规则
  listRules: () => req<LinkRule[]>('/rules'),
  updateRule: (id: string, body: Partial<LinkRule>) =>
    apiPatch<LinkRule>('/rules/' + encodeURIComponent(id), body),
  // 停车
  listParkings: () => req<Parking[]>('/parkings'),
  createParking: (data: Partial<Parking>) =>
    req<Parking>('/parkings', { method: 'POST', body: JSON.stringify(data) }),
  updateParking: (id: string, body: Partial<Parking>) =>
    apiPatch<Parking>('/parkings/' + encodeURIComponent(id), body),
  // 停车计费规则
  getParkingConfig: () => req<ParkingConfig>('/parking-config'),
  updateParkingConfig: (body: Partial<ParkingConfig>) =>
    apiPatch<ParkingConfig>('/parking-config', body),
  // 其他
  listBlacklist: () => req<Blacklist[]>('/blacklist'),
  listMessages: () => req<unknown[]>('/messages'),
  getStats: () => req<{ inHouse: number; pending: number; today: number }>('/stats'),
}
