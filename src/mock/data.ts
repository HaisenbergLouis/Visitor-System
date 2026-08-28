// ============================================================
// 智慧访客管理系统 · Web 后台 假数据（后续替换为真实接口）
// ============================================================

export interface VisitRecord {
  id: string
  name: string
  company: string
  host: string
  hostDept: string
  reason: string
  date: string
  time: string
  area: string
  plate?: string
  companions: number
  status: '待审批' | '已通过' | '已拒绝' | '已签到' | '在访' | '已签离' | '黑名单' | '已取消'
  createTime: string
  risk?: '正常' | '关注' | '高危'
}

const visitorsRaw: VisitRecord[] = [
  { id: 'V20260812001', name: '王小明', company: '中科云智', host: '李工', hostDept: '研发部', reason: '项目技术交流', date: '08-12', time: '14:00–17:00', area: '研发楼 1F', plate: '沪A·8X9K2', companions: 1, status: '在访', createTime: '08-11 10:24', risk: '正常' },
  { id: 'V20260812002', name: '陈晓', company: '华信咨询', host: '张经理', hostDept: '市场部', reason: '商务洽谈', date: '08-12', time: '15:30–16:30', area: '总部 3F', companions: 0, status: '待审批', createTime: '08-12 09:02', risk: '正常' },
  { id: 'V20260812003', name: '赵强', company: '—', host: '王主管', hostDept: '采购部', reason: '供应商拜访', date: '08-11', time: '09:00–10:00', area: '采购楼 2F', companions: 2, status: '黑名单', createTime: '08-10 16:40', risk: '高危' },
  { id: 'V20260812004', name: '刘洋', company: '腾达电子', host: '孙工', hostDept: '测试部', reason: '产品联调', date: '08-12', time: '10:00–12:00', area: '研发楼 3F', plate: '苏B·3T66H', companions: 0, status: '已签到', createTime: '08-11 14:12', risk: '正常' },
  { id: 'V20260812005', name: '周敏', company: '先锋传媒', host: '钱总', hostDept: '品牌部', reason: '拍摄协作', date: '08-12', time: '09:30–11:30', area: '总部 5F', companions: 3, status: '在访', createTime: '08-11 08:55', risk: '关注' },
  { id: 'V20260812006', name: '吴刚', company: '恒基建设', host: '陈工', hostDept: '工程部', reason: '现场勘查', date: '08-11', time: '13:00–15:00', area: '园区 B 区', plate: '浙C·5UY77', companions: 1, status: '已签离', createTime: '08-10 11:30', risk: '正常' },
  { id: 'V20260812007', name: '郑丽', company: '安信保险', host: '许经理', hostDept: '行政部', reason: '团建沟通', date: '08-13', time: '10:00–11:00', area: '总部 1F', companions: 0, status: '已通过', createTime: '08-12 08:20', risk: '正常' },
  { id: 'V20260812008', name: '孙浩', company: '速达物流', host: '何主管', hostDept: '仓储部', reason: '送货对接', date: '08-12', time: '16:00–17:00', area: '仓储楼 1F', plate: '沪D·9M3K8', companions: 1, status: '待审批', createTime: '08-12 10:47', risk: '正常' },
  { id: 'V20260812009', name: '李娜', company: '民生银行', host: '郭总', hostDept: '财务部', reason: '金融方案', date: '08-14', time: '14:30–16:00', area: '总部 6F', companions: 1, status: '已通过', createTime: '08-12 11:15', risk: '正常' },
  { id: 'V20260812010', name: '马涛', company: '—', host: '罗工', hostDept: 'IT 部', reason: '设备运维', date: '08-12', time: '08:30–09:30', area: '机房', companions: 0, status: '已取消', createTime: '08-11 09:48', risk: '正常' },
]

// 审批列表（待审批/审批记录）
export interface Approval {
  id: string
  visitor: string
  company: string
  host: string
  hostDept: string
  reason: string
  time: string
  plate?: string
  status: '待审批' | '已通过' | '已拒绝'
  applyTime: string
}

const approvalsRaw: Approval[] = [
  { id: 'V20260812002', visitor: '陈晓', company: '华信咨询', host: '张经理', hostDept: '市场部', reason: '商务洽谈', time: '08-12 15:30', status: '待审批', applyTime: '08-12 09:02' },
  { id: 'V20260812008', visitor: '孙浩', company: '速达物流', host: '何主管', hostDept: '仓储部', reason: '送货对接', time: '08-12 16:00', status: '待审批', applyTime: '08-12 10:47' },
  { id: 'V20260812011', visitor: '高健', company: '云启软件', host: '赵工', hostDept: '研发部', reason: '接口对接', time: '08-13 09:30', status: '待审批', applyTime: '08-12 11:20', plate: '苏A·2H45J' },
  { id: 'V20260812007', visitor: '郑丽', company: '安信保险', host: '许经理', hostDept: '行政部', reason: '团建沟通', time: '08-13 10:00', status: '已通过', applyTime: '08-12 08:20' },
  { id: 'V20260812012', visitor: '宋凯', company: '联友网络', host: '林工', hostDept: '测试部', reason: '测试环境', time: '08-12 14:00', status: '已拒绝', applyTime: '08-12 07:40' },
]

// 核验记录
export interface Verify {
  id: string
  visitor: string
  method: '人脸' | '二维码' | '证件'
  result: '通过' | '不通过' | '翻拍预警'
  device: string
  time: string
  similarity?: number
}

const verifiesRaw: Verify[] = [
  { id: 'V20260812004', visitor: '刘洋', method: '人脸', result: '通过', device: '北门闸机 01', time: '08-12 10:02', similarity: 98 },
  { id: 'V20260812001', visitor: '王小明', method: '二维码', result: '通过', device: '前台 Pad 02', time: '08-12 14:05' },
  { id: 'V20260812005', visitor: '周敏', method: '证件', result: '通过', device: '东门闸机 02', time: '08-12 09:33', similarity: 95 },
  { id: 'V20260812013', visitor: '黄伟', method: '人脸', result: '翻拍预警', device: '南门闸机 03', time: '08-12 08:47' },
  { id: 'V20260812014', visitor: '徐芳', method: '二维码', result: '不通过', device: '前台 Pad 01', time: '08-12 08:12' },
  { id: 'V20260812006', visitor: '吴刚', method: '二维码', result: '通过', device: '西门闸机 01', time: '08-11 13:08' },
]

// 门禁设备
export interface Device {
  id: string
  name: string
  type: '人脸终端' | '闸机' | '梯控' | '摄像头'
  location: string
  version: string
  // 以下为运行时指标：由设备心跳自动计算得出，禁止前端手动设置
  status: '在线' | '离线' | '告警'
  onlineRate: number
}

export const devices: Device[] = [
  { id: 'DEV-001', name: '北门闸机 01', type: '闸机', location: '园区北门', status: '在线', onlineRate: 99.8, version: 'v2.3.1' },
  { id: 'DEV-002', name: '东门闸机 02', type: '闸机', location: '园区东门', status: '在线', onlineRate: 99.5, version: 'v2.3.1' },
  { id: 'DEV-003', name: '南门人脸终端 03', type: '人脸终端', location: '南门', status: '告警', onlineRate: 96.2, version: 'v3.0.0' },
  { id: 'DEV-004', name: '前台 Pad 01', type: '人脸终端', location: '总部大堂', status: '在线', onlineRate: 99.9, version: 'v1.8.4' },
  { id: 'DEV-005', name: '前台 Pad 02', type: '人脸终端', location: '总部大堂', status: '在线', onlineRate: 99.7, version: 'v1.8.4' },
  { id: 'DEV-006', name: '研发楼梯控', type: '梯控', location: '研发楼 1F', status: '在线', onlineRate: 99.9, version: 'v2.0.2' },
  { id: 'DEV-007', name: '车库道闸 01', type: '摄像头', location: 'B2 入口', status: '离线', onlineRate: 88.4, version: 'v1.5.0' },
]

// 停车记录
export interface Parking {
  id: string
  visitor: string
  plate: string
  area: string
  inTime: string
  outTime?: string
  duration?: string
  freeMin: number
  fee: number
  status: '停放中' | '已离场' | '超时'
}

const parkingsRaw: Parking[] = [
  { id: 'P20260812001', visitor: '王小明', plate: '沪A·8X9K2', area: 'B2 访客区', inTime: '08-12 13:58', freeMin: 180, fee: 0, status: '停放中' },
  { id: 'P20260812002', visitor: '周敏', plate: '苏B·7M88D', area: 'B3 访客区', inTime: '08-12 09:30', freeMin: 240, fee: 0, status: '停放中' },
  { id: 'P20260812003', visitor: '吴刚', plate: '浙C·5UY77', area: 'B2 访客区', inTime: '08-11 12:55', outTime: '08-11 15:10', duration: '2 时 15 分', freeMin: 180, fee: 0, status: '已离场' },
  { id: 'P20260812004', visitor: '孙浩', plate: '沪D·9M3K8', area: 'B4 临时区', inTime: '08-12 08:40', freeMin: 120, fee: 18, status: '超时' },
  { id: 'P20260812005', visitor: '刘洋', plate: '苏B·3T66H', area: 'B2 访客区', inTime: '08-12 10:01', outTime: '08-12 12:20', duration: '2 时 19 分', freeMin: 180, fee: 0, status: '已离场' },
]

// 黑名单
export interface Blacklist {
  id: string
  name: string
  certNo: string
  level: '企业' | '个人'
  reason: string
  source: string
  createTime: string
}

const blacklistRaw: Blacklist[] = [
  { id: 'B001', name: '赵强', certNo: '3201**********1234', level: '企业', reason: '同行通报 · 恶意闯入', source: '同行名单库', createTime: '08-10 16:40' },
  { id: 'B002', name: '黄伟', certNo: '3210**********8888', level: '企业', reason: '翻拍预警 + 恶意闯入', source: '企业名单库', createTime: '08-08 11:20' },
  { id: 'B003', name: '徐芳', certNo: '3301**********4567', level: '个人', reason: '被访人投诉', source: '手工录入', createTime: '07-28 09:05' },
]

// 报表聚合数据
export const report = {
  weekly: [
    { day: '周一', count: 92 },
    { day: '周二', count: 118 },
    { day: '周三', count: 98 },
    { day: '周四', count: 134 },
    { day: '周五', count: 110 },
    { day: '周六', count: 152 },
    { day: '周日', count: 128 },
  ],
  topHosts: [
    { host: '李工·研发部', count: 32 },
    { host: '张经理·市场部', count: 27 },
    { host: '钱总·品牌部', count: 21 },
    { host: '王主管·采购部', count: 15 },
    { host: '郭总·财务部', count: 12 },
  ],
  areas: [
    { area: '研发楼', count: 96 },
    { area: '总部', count: 84 },
    { area: '采购楼', count: 41 },
    { area: '仓储楼', count: 28 },
  ],
  durationDist: [
    { label: '< 1 小时', pct: 18 },
    { label: '1–2 小时', pct: 42 },
    { label: '2–4 小时', pct: 27 },
    { label: '> 4 小时', pct: 13 },
  ],
}

// 组织 / 区域树（门禁通行）
export const areaTree = [
  { name: '研发楼', children: ['1F 访客区', '2F 办公区', '3F 实验室'] },
  { name: '总部', children: ['1F 大堂', '3F 市场部', '5F 品牌部', '6F 财务部'] },
  { name: '采购楼', children: ['1F 展厅', '2F 办公区'] },
  { name: '仓储楼', children: ['1F 收货区', '2F 仓库'] },
]

// 门禁联动规则
export interface LinkRule {
  id: string
  name: string
  trigger: string
  action: string
  enabled: boolean
}

// 停车计费规则
export interface ParkingConfig {
  freeMin: number
  overFee: number
  visitorSlots: number
  discountPolicy: string
  graceMin: number
}

// ============================================================
// 日期动态化：离线演示数据以 2026-08-12 为基准构造，导出前整体
// 平移，使日期始终围绕「今天」，离线展示与在线数据日期一致
// ============================================================
const BASE_DAY = new Date(2026, 7, 12).getTime()
const DAY_MS = 86400000
const DATE_SHIFT = Math.round((Date.now() - BASE_DAY) / DAY_MS)

function shiftDate(s?: string): string | undefined {
  if (!s) return s
  return s.replace(/(\d{2})-(\d{2})/g, (_m, mo: string, dd: string) => {
    const d = new Date(2026, Number(mo) - 1, Number(dd) + DATE_SHIFT)
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
}

export const visitors = visitorsRaw.map((v) => ({
  ...v,
  date: shiftDate(v.date)!,
  createTime: shiftDate(v.createTime)!,
}))
export const approvals = approvalsRaw.map((a) => ({
  ...a,
  time: shiftDate(a.time)!,
  applyTime: shiftDate(a.applyTime)!,
}))
export const verifies = verifiesRaw.map((v) => ({
  ...v,
  time: shiftDate(v.time)!,
}))
export const parkings = parkingsRaw.map((p) => ({
  ...p,
  inTime: shiftDate(p.inTime)!,
  outTime: p.outTime ? shiftDate(p.outTime) : undefined,
}))
export const blacklist = blacklistRaw.map((b) => ({
  ...b,
  createTime: shiftDate(b.createTime)!,
}))
