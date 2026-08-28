// 统一 API 客户端：对接 mock-server（http://localhost:3001）
import type {
  VisitRecord,
  Verify,
  Device,
  Parking,
  Blacklist,
  Anomaly,
  LinkRule,
  ParkingConfig,
} from '@/mock/data'

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
  // 异常核验台
  listAnomalies: () => req<Anomaly[]>('/anomalies'),
  disposeAnomaly: (
    id: string,
    body: { action: 'pass' | 'guide' | 'blacklist'; operator?: string },
  ) =>
    req<{
      ok: boolean
      anomaly: Anomaly
      blacklist: { alreadyInBlacklist: boolean; item?: Blacklist; linked?: number } | null
    }>('/anomalies/' + encodeURIComponent(id) + '/dispose', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  // 设备
  listDevices: () => req<Device[]>('/devices'),
  createDevice: (data: Partial<Device>) =>
    req<Device>('/devices', { method: 'POST', body: JSON.stringify(data) }),
  updateDevice: (id: string, body: Partial<Device>) =>
    apiPatch<Device>('/devices/' + encodeURIComponent(id), body),
  deleteDevice: (id: string) =>
    req<Device>('/devices/' + encodeURIComponent(id), { method: 'DELETE' }),
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
  createBlacklist: (data: Partial<Blacklist> & { linkVisits?: boolean; operator?: string }) =>
    req<Blacklist & { linked?: number }>('/blacklist', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateBlacklist: (id: string, body: Partial<Blacklist>) =>
    apiPatch<Blacklist>('/blacklist/' + encodeURIComponent(id), body),
  deleteBlacklist: (id: string) =>
    req<Blacklist & { restored?: number }>('/blacklist/' + encodeURIComponent(id), {
      method: 'DELETE',
    }),
  listMessages: () => req<unknown[]>('/messages'),
  getStats: () => req<{ inHouse: number; pending: number; today: number }>('/stats'),
}
