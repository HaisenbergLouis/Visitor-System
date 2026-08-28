<script setup lang="ts">
import { ref, computed, onBeforeUnmount, onMounted } from 'vue'
import { devices as fallback, areaTree, type Device } from '@/mock/data'
import { api } from '@/api'
import { notify } from '@/utils/toast'
import * as echarts from 'echarts'
import EChart from '@/components/EChart.vue'

const devFilter = ref('全部')
const deviceTypes = ['全部', '人脸终端', '闸机', '梯控', '摄像头']

const list = ref(fallback)
const loading = ref(true)
const online = ref(false)

async function load() {
  loading.value = true
  try {
    list.value = await api.listDevices()
    online.value = true
  } catch {
    list.value = fallback
    online.value = false
  } finally {
    loading.value = false
  }
}
let syncTimer: number | undefined
onMounted(() => {
  load()
  loadRules()
  syncTimer = window.setInterval(load, 5000) // 每 5 秒自动同步对端
})
onBeforeUnmount(() => window.clearInterval(syncTimer))

function statusClass(s: string) {
  return s === '在线' ? 's' : s === '离线' ? 'd' : 'r'
}

const openGroups = ref<Record<string, boolean>>({ 研发楼: true })
// 设备状态分布（环形图）
const statusOption = computed<echarts.EChartsOption>(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, textStyle: { color: '#64748b', fontSize: 12 } },
  color: ['#16a34a', '#ef4444', '#f59e0b'],
  series: [
    {
      type: 'pie',
      radius: ['48%', '72%'],
      center: ['50%', '44%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { formatter: '{d}%', color: '#475569' },
      data: ['在线', '离线', '告警'].map(s => ({
        name: s,
        value: list.value.filter(d => d.status === s).length,
      })),
    },
  ],
}))

// 设备类型分布（渐变柱状图）
const typeOption = computed<echarts.EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 16, top: 24, bottom: 24 },
  xAxis: {
    type: 'category',
    data: ['人脸终端', '闸机', '梯控', '摄像头'],
    axisLine: { lineStyle: { color: '#e2e8f0' } },
    axisLabel: { color: '#64748b' },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: '#f1f5f9' } },
    axisLabel: { color: '#94a3b8' },
  },
  series: [
    {
      name: '台数',
      type: 'bar',
      barWidth: 34,
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#52b788' },
          { offset: 1, color: '#1f7a50' },
        ]),
      },
      data: ['人脸终端', '闸机', '梯控', '摄像头'].map(
        t => list.value.filter(d => d.type === t).length
      ),
    },
  ],
}))

// ===== 联动规则 =====
const defaultRules = [
  { id: 'R1', name: '核验通过 → 自动开闸', trigger: '核验通过', action: '自动开闸', enabled: true },
  {
    id: 'R2',
    name: '过期访问单 → 权限自动回收',
    trigger: '访问单过期',
    action: '权限自动回收',
    enabled: true,
  },
  {
    id: 'R3',
    name: '黑名单命中 → 联动拦截并告警',
    trigger: '黑名单命中',
    action: '拦截并告警安保',
    enabled: true,
  },
  {
    id: 'R4',
    name: '车牌白名单 → 停车自动抬杆',
    trigger: '白名单车牌识别',
    action: '停车自动抬杆',
    enabled: false,
  },
]

const rules = ref<typeof defaultRules>(defaultRules)
const ruleLog = ref<{ time: string; text: string }[]>([])

async function loadRules() {
  try {
    rules.value = await api.listRules()
  } catch {
    rules.value = defaultRules
  }
}

async function toggleRule(r: { id: string; enabled: boolean }) {
  r.enabled = !r.enabled
  try {
    await api.updateRule(r.id, { enabled: r.enabled })
  } catch {
    /* 离线：仅本地 */
  }
}

const showRuleEdit = ref(false)
const editRuleForm = ref<{
  id: string
  name: string
  trigger: string
  action: string
  enabled: boolean
} | null>(null)
function openRuleEdit(r: (typeof defaultRules)[number]) {
  editRuleForm.value = { ...r }
  showRuleEdit.value = true
}
function closeRuleEdit() {
  showRuleEdit.value = false
}
async function saveRuleEdit() {
  const f = editRuleForm.value
  if (!f) return
  try {
    await api.updateRule(f.id, {
      name: f.name,
      trigger: f.trigger,
      action: f.action,
      enabled: f.enabled,
    })
  } catch {
    /* 离线：仅本地 */
  }
  const idx = rules.value.findIndex(x => x.id === f.id)
  if (idx >= 0) rules.value[idx] = { ...f }
  showRuleEdit.value = false
}

function pushLog(text: string) {
  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  ruleLog.value.unshift({ time, text })
  if (ruleLog.value.length > 8) ruleLog.value.pop()
}
function simulate(trigger: string, note: string) {
  const matched = rules.value.filter(r => r.trigger === trigger)
  if (!matched.length) {
    pushLog('⚠️ ' + note + '：无匹配规则')
    return
  }
  matched.forEach(r => {
    if (r.enabled) pushLog('⚡ ' + note + ' → 「' + r.name + '」已联动执行')
    else pushLog('⏸ ' + note + ' → 「' + r.name + '」未启用，已跳过')
  })
}

// ===== 设备管理（增 / 改 / 删）=====
const showDeviceEdit = ref(false)
const isEditDevice = ref(false)
const deviceForm = ref({
  id: '',
  name: '',
  type: '闸机' as Device['type'],
  location: '',
  version: 'v1.0.0',
})

function openDeviceAdd() {
  isEditDevice.value = false
  deviceForm.value = {
    id: '',
    name: '',
    type: '闸机',
    location: '',
    version: 'v1.0.0',
  }
  showDeviceEdit.value = true
}

function openDeviceEdit(d: Device) {
  isEditDevice.value = true
  deviceForm.value = {
    id: d.id,
    name: d.name,
    type: d.type,
    location: d.location,
    version: d.version,
  }
  showDeviceEdit.value = true
}

function closeDeviceEdit() {
  showDeviceEdit.value = false
}

async function saveDevice() {
  const f = deviceForm.value
  if (!f.name.trim()) {
    notify.warn('请填写设备名称')
    return
  }
  try {
    if (isEditDevice.value) {
      await api.updateDevice(f.id, {
        name: f.name,
        type: f.type,
        location: f.location,
        version: f.version,
      })
      const idx = list.value.findIndex(x => x.id === f.id)
      const cur = idx >= 0 ? list.value[idx] : undefined
      if (cur) Object.assign(cur, f)
      notify.success('设备已更新：' + f.name)
    } else {
      const created = await api.createDevice({
        name: f.name,
        type: f.type,
        location: f.location,
        version: f.version,
      })
      list.value.push(created)
      notify.success('设备已添加：' + created.name)
    }
    showDeviceEdit.value = false
  } catch {
    notify.error('保存失败：请确认 Mock 服务已启动（node mock-server）')
  }
}

const deleteTarget = ref<Device | null>(null)
function openDeleteDevice(d: Device) {
  deleteTarget.value = d
}
function closeDeleteDevice() {
  deleteTarget.value = null
}
async function confirmDeleteDevice() {
  const d = deleteTarget.value
  if (!d) return
  try {
    await api.deleteDevice(d.id)
    list.value = list.value.filter(x => x.id !== d.id)
    notify.success('设备已删除：' + d.name)
  } catch {
    notify.error('删除失败：请确认 Mock 服务已启动（node mock-server）')
  }
  deleteTarget.value = null
}
</script>

<template>
  <div class="grid2" style="align-items: start; margin-bottom: 16px">
    <div class="card">
      <div class="card-h"><h3>设备状态分布</h3></div>
      <EChart :option="statusOption" height="240px" />
    </div>
    <div class="card">
      <div class="card-h"><h3>设备类型分布</h3></div>
      <EChart :option="typeOption" height="240px" />
    </div>
  </div>
  <div class="grid2" style="align-items: start">
    <!-- 设备管理 -->
    <div class="card">
      <div class="card-h">
        <h3>终端设备管理</h3>
        <span class="chip">{{
          loading ? '加载中…' : online ? '🟢 已连接 Mock 服务' : '⚪ 离线模式'
        }}</span>
        <button class="btn ghost sm" @click="load">刷新</button>
        <span class="chip">共 {{ list.length }} 台</span>
      </div>
      <div class="toolbar" style="margin-bottom: 12px">
        <select v-model="devFilter">
          <option v-for="t in deviceTypes" :key="t">{{ t }}</option>
        </select>
        <div class="spacer"></div>
        <button class="btn secondary sm" @click="openDeviceAdd">添加设备</button>
      </div>
      <div class="dtable-wrap">
        <table class="dtable">
          <thead>
            <tr>
              <th>设备</th>
              <th>位置</th>
              <th>状态</th>
              <th>在线率</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="d in list.filter(x => devFilter === '全部' || x.type === devFilter)"
              :key="d.id"
            >
              <td>
                <div>
                  {{ d.name }}
                  <div class="sub">{{ d.type }} · {{ d.version }}</div>
                </div>
              </td>
              <td>{{ d.location }}</td>
              <td>
                <span class="badge" :class="statusClass(d.status)">{{ d.status }}</span>
              </td>
              <td>{{ d.onlineRate }}%</td>
              <td>
                <button class="btn ghost sm" style="margin-right: 6px" @click="openDeviceEdit(d)">
                  编辑
                </button>
                <button class="btn danger sm" @click="openDeleteDevice(d)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 通行区域树 + 权限策略 -->
    <div>
      <div class="card">
        <div class="card-h">
          <h3>通行区域树（楼宇 → 楼层 → 区域）</h3>
          <span class="chip">可视化配置</span>
        </div>
        <div v-for="g in areaTree" :key="g.name">
          <div
            style="
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 8px 0;
              cursor: pointer;
              font-weight: 600;
              font-size: 13.5px;
            "
            @click="openGroups[g.name] = !openGroups[g.name]"
          >
            <span>{{ openGroups[g.name] ? '▾' : '▸' }}</span
            >🏢 {{ g.name }}
          </div>
          <div v-if="openGroups[g.name]" style="padding-left: 24px">
            <div v-for="c in g.children" :key="c" class="chip" style="cursor: pointer">{{ c }}</div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top: 16px">
        <div class="card-h">
          <h3>联动规则</h3>
          <span class="chip"
            >共 {{ rules.length }} 条 · 启用 {{ rules.filter(r => r.enabled).length }}</span
          >
        </div>

        <!-- 联动测试 -->
        <div class="toolbar" style="margin-bottom: 12px">
          <span style="font-size: 13px; color: var(--ink-600)">联动测试：</span>
          <button class="btn ghost sm" @click="simulate('核验通过', '模拟核验通过')">
            模拟核验通过
          </button>
          <button class="btn ghost sm" @click="simulate('访问单过期', '模拟访问单过期')">
            模拟访问过期
          </button>
          <button class="btn ghost sm" @click="simulate('黑名单命中', '模拟黑名单命中')">
            模拟黑名单命中
          </button>
          <button class="btn ghost sm" @click="simulate('白名单车牌识别', '模拟白名单车牌')">
            模拟白名单车牌
          </button>
        </div>

        <!-- 规则列表 -->
        <div v-for="r in rules" :key="r.id" class="rule-row" :class="{ off: !r.enabled }">
          <label class="switch">
            <input type="checkbox" :checked="r.enabled" @change="toggleRule(r)" />
            <span class="slider"></span>
          </label>
          <div class="rule-main">
            <div class="rule-name">{{ r.name }}</div>
            <div class="rule-desc">触发：{{ r.trigger }} · 动作：{{ r.action }}</div>
          </div>
          <span class="badge" :class="r.enabled ? 'g' : 'n'">{{
            r.enabled ? '启用' : '停用'
          }}</span>
          <button class="btn ghost sm" style="flex: none" @click="openRuleEdit(r)">编辑</button>
        </div>

        <!-- 触发日志 -->
        <div v-if="ruleLog.length" style="margin-top: 12px">
          <div style="font-size: 12.5px; color: var(--ink-500); margin-bottom: 6px">
            最近触发日志
          </div>
          <div
            v-for="(l, i) in ruleLog"
            :key="i"
            class="toast"
            :class="l.text.startsWith('⚡') ? 'ok' : 'warn'"
            style="display: flex; width: 100%; justify-content: space-between; margin: 0 0 6px"
          >
            <span>{{ l.text }}</span>
            <span style="opacity: 0.7; font-size: 11.5px; flex: none">{{ l.time }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑联动规则弹窗 -->
    <div v-if="showRuleEdit && editRuleForm" class="modal-mask" @click.self="closeRuleEdit">
      <div class="modal" style="width: 480px">
        <div class="mh">编辑联动规则</div>
        <div class="mb">
          <div class="form-grid">
            <div class="form-item">
              <label>规则名称</label>
              <input v-model="editRuleForm.name" />
            </div>
            <div class="form-item">
              <label>触发条件</label>
              <input v-model="editRuleForm.trigger" placeholder="如：核验通过" />
            </div>
            <div class="form-item">
              <label>执行动作</label>
              <input v-model="editRuleForm.action" placeholder="如：自动开闸" />
            </div>
            <div class="form-item">
              <label>状态</label>
              <select v-model="editRuleForm.enabled">
                <option :value="true">启用</option>
                <option :value="false">停用</option>
              </select>
            </div>
          </div>
          <div style="font-size: 12.5px; color: var(--ink-400); margin-top: 10px">
            联动规则与触发条件、动作保存到共享后端，停用的规则在联动测试中会被跳过。
          </div>
        </div>
        <div class="mf">
          <button class="btn ghost sm" @click="closeRuleEdit">取消</button>
          <button class="btn primary sm" @click="saveRuleEdit">保存</button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑设备弹窗 -->
    <div v-if="showDeviceEdit" class="modal-mask" @click.self="closeDeviceEdit">
      <div class="modal" style="width: 480px">
        <div class="mh">{{ isEditDevice ? '编辑设备' : '添加设备' }}</div>
        <div class="mb">
          <div class="form-grid">
            <div class="form-item">
              <label>设备名称</label>
              <input v-model="deviceForm.name" placeholder="如：南门闸机 03" />
            </div>
            <div class="form-item">
              <label>设备类型</label>
              <select v-model="deviceForm.type">
                <option value="人脸终端">人脸终端</option>
                <option value="闸机">闸机</option>
                <option value="梯控">梯控</option>
                <option value="摄像头">摄像头</option>
              </select>
            </div>
            <div class="form-item">
              <label>安装位置</label>
              <input v-model="deviceForm.location" placeholder="如：园区南门" />
            </div>
            <div class="form-item">
              <label>固件版本</label>
              <input v-model="deviceForm.version" placeholder="如：v2.3.1" />
            </div>
          </div>
          <div style="font-size: 12.5px; color: var(--ink-400); margin-top: 10px">
            设备状态与在线率由系统按设备心跳自动判定，无需手动设置。
          </div>
        </div>
        <div class="mf">
          <button class="btn ghost sm" @click="closeDeviceEdit">取消</button>
          <button class="btn primary sm" @click="saveDevice">保存</button>
        </div>
      </div>
    </div>

    <!-- 删除设备确认弹窗 -->
    <div v-if="deleteTarget" class="modal-mask" @click.self="closeDeleteDevice">
      <div class="modal" style="width: 400px">
        <div class="mh">删除设备</div>
        <div class="mb">确认删除设备「{{ deleteTarget.name }}」？删除后该设备将从终端列表中移除。</div>
        <div class="mf">
          <button class="btn ghost sm" @click="closeDeleteDevice">取消</button>
          <button class="btn danger sm" @click="confirmDeleteDevice">确认删除</button>
        </div>
      </div>
    </div>
  </div>
</template>
