<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { parkings as fallback, type ParkingConfig } from '@/mock/data'
import { api } from '@/api'
import { notify } from '@/utils/toast'
import * as echarts from 'echarts'
import EChart from '@/components/EChart.vue'

const filter = ref('全部')
const filters = ['全部', '停放中', '已离场', '超时']

const list = ref(fallback)
const loading = ref(true)
const online = ref(false)

async function load() {
  loading.value = true
  try {
    list.value = await api.listParkings()
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
  loadConfig()
  syncTimer = window.setInterval(load, 5000) // 每 5 秒自动同步对端（小程序核销/停车）
})
onBeforeUnmount(() => window.clearInterval(syncTimer))

const filtered = computed(() =>
  list.value.filter(p => filter.value === '全部' || p.status === filter.value)
)

const total = computed(() => list.value.length)
const inCount = computed(() => list.value.filter(p => p.status === '停放中').length)
const overCount = computed(() => list.value.filter(p => p.status === '超时').length)
const feeTotal = computed(() => list.value.reduce((s, p) => s + p.fee, 0))

const freeMinOptions = ['120', '180', '240']
const discountOptions = ['员工邀约联动免单', 'VIP 访客全免', '工作日 18 点后免费']

// ===== 计费规则（共享后端持久化） =====
const config = ref<ParkingConfig>({
  freeMin: 180,
  overFee: 6,
  visitorSlots: 60,
  discountPolicy: '员工邀约联动免单',
  graceMin: 15,
})
const configLoading = ref(true)
const configSaving = ref(false)

async function loadConfig() {
  configLoading.value = true
  try {
    config.value = await api.getParkingConfig()
  } catch {
    /* 离线：使用默认值 */
  } finally {
    configLoading.value = false
  }
}
async function saveConfig() {
  configSaving.value = true
  try {
    await api.updateParkingConfig({
      freeMin: Number(config.value.freeMin) || 180,
      overFee: Number(config.value.overFee) || 0,
      visitorSlots: Number(config.value.visitorSlots) || 0,
      discountPolicy: config.value.discountPolicy,
      graceMin: Number(config.value.graceMin) || 0,
    })
    notify.success('计费规则已保存并生效（已持久化到共享后端）')
  } catch {
    notify.error('保存失败：请确认 Mock 服务已启动（node mock-server）')
  } finally {
    configSaving.value = false
  }
}

// ===== 费用测算（按当前规则） =====
const calcHours = ref(3)
const calcResult = computed(() => {
  const hours = Number(calcHours.value) || 0
  const freeH = (config.value.freeMin || 0) / 60
  if (hours <= freeH) return { fee: 0, note: '在免费时长内，费用 ¥0' }
  const overH = hours - freeH
  const fee = Math.ceil(overH * (config.value.overFee || 0))
  return { fee, note: `超出免费时长 ${overH.toFixed(1)} 小时，按 ¥${config.value.overFee}/小时` }
})

// 停车状态分布（环形图）
const parkStatusOption = computed<echarts.EChartsOption>(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, textStyle: { color: '#64748b', fontSize: 12 } },
  color: ['#3b82f6', '#94a3b8', '#ef4444'],
  series: [
    {
      type: 'pie',
      radius: ['48%', '72%'],
      center: ['50%', '44%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { formatter: '{d}%', color: '#475569' },
      data: ['停放中', '已离场', '超时'].map(s => ({
        name: s,
        value: list.value.filter(p => p.status === s).length,
      })),
    },
  ],
}))

// 车位区分布（渐变柱状图）
const parkAreaOption = computed<echarts.EChartsOption>(() => {
  const areas = Array.from(new Set(list.value.map(p => p.area)))
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 16, top: 24, bottom: 24 },
    xAxis: {
      type: 'category',
      data: areas,
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
        name: '车辆数',
        type: 'bar',
        barWidth: 34,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#52b788' },
            { offset: 1, color: '#1f7a50' },
          ]),
        },
        data: areas.map(a => list.value.filter(p => p.area === a).length),
      },
    ],
  }
})

function statusClass(s: string) {
  return s === '停放中' ? 'i' : s === '已离场' ? 'n' : 'd'
}
</script>

<template>
  <div>
    <!-- 数据源状态 -->
    <div class="toolbar" style="margin-bottom: 12px">
      <span class="chip">{{
        loading
          ? '加载中…'
          : online
            ? '🟢 已连接 · 每 5 秒自动同步（与小程序停车互通）'
            : '⚪ 离线模式'
      }}</span>
      <button class="btn ghost sm" @click="load">刷新</button>
      <div class="spacer"></div>
    </div>
    <!-- KPI -->
    <div class="kpis">
      <div class="kpi">
        <div class="n">{{ total }}</div>
        <div class="l">今日停车记录</div>
      </div>
      <div class="kpi">
        <div class="n">{{ inCount }}</div>
        <div class="l">当前停放中</div>
      </div>
      <div class="kpi">
        <div class="n">{{ overCount }}</div>
        <div class="l">超时未离场</div>
      </div>
      <div class="kpi">
        <div class="n">¥{{ feeTotal }}</div>
        <div class="l">超时费用（演示）</div>
      </div>
    </div>
    <div class="grid2" style="align-items: start; margin-bottom: 16px">
      <div class="card">
        <div class="card-h"><h3>停车状态分布</h3></div>
        <EChart :option="parkStatusOption" height="240px" />
      </div>
      <div class="card">
        <div class="card-h"><h3>车位区分布</h3></div>
        <EChart :option="parkAreaOption" height="240px" />
      </div>
    </div>

    <div class="grid2" style="align-items: start">
      <!-- 停车记录 -->
      <div class="card">
        <div class="card-h">
          <h3>停车记录</h3>
          <select
            v-model="filter"
            style="
              border: 1px solid var(--ink-300);
              border-radius: var(--r-sm);
              padding: 6px 10px;
              font-size: 13px;
            "
          >
            <option v-for="f in filters" :key="f">{{ f }}</option>
          </select>
        </div>
        <div class="dtable-wrap">
          <table class="dtable">
            <thead>
              <tr>
                <th>车牌</th>
                <th>访客</th>
                <th>车位区</th>
                <th>时长</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in filtered" :key="p.id">
                <td>
                  <span class="chip">🚗 {{ p.plate }}</span>
                </td>
                <td>{{ p.visitor }}</td>
                <td>{{ p.area }}</td>
                <td>
                  {{ p.inTime }}
                  <div class="sub">{{ p.duration || '—' }}</div>
                </td>
                <td>
                  <span class="badge" :class="statusClass(p.status)">{{ p.status }}</span>
                  <div v-if="p.fee > 0" class="sub" style="color: var(--danger)">
                    费用 ¥{{ p.fee }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 计费规则 + 车位 -->
      <div>
        <div class="card">
          <div class="card-h">
            <h3>计费规则</h3>
            <span class="chip">{{ configLoading ? '加载中…' : '🟢 已持久化' }}</span>
          </div>
          <div class="form-grid">
            <div class="form-item">
              <label>访客免费时长</label>
              <select v-model.number="config.freeMin">
                <option v-for="m in freeMinOptions" :key="m" :value="Number(m)">
                  {{ m }} 分钟
                </option>
              </select>
            </div>
            <div class="form-item">
              <label>超时费率（元/小时）</label>
              <input v-model.number="config.overFee" type="number" min="0" />
            </div>
            <div class="form-item">
              <label>访客车位数</label>
              <input v-model.number="config.visitorSlots" type="number" min="0" />
            </div>
            <div class="form-item">
              <label>减免策略</label>
              <select v-model="config.discountPolicy">
                <option v-for="d in discountOptions" :key="d">{{ d }}</option>
              </select>
            </div>
            <div class="form-item">
              <label>超时宽限（分钟）</label>
              <input v-model.number="config.graceMin" type="number" min="0" />
            </div>
          </div>
          <button
            class="btn primary sm"
            style="margin-top: 14px"
            :disabled="configSaving"
            @click="saveConfig"
          >
            {{ configSaving ? '保存中...' : '保存计费规则' }}
          </button>

          <!-- 费用测算 -->
          <div style="margin-top: 16px; border-top: 1px dashed var(--line); padding-top: 14px">
            <div
              style="font-size: 13px; font-weight: 700; color: var(--ink-900); margin-bottom: 8px"
            >
              费用测算（按当前规则）
            </div>
            <div class="toolbar" style="margin-bottom: 8px">
              <input v-model.number="calcHours" type="number" min="0" style="width: 90px" />
              <span style="font-size: 13px; color: var(--ink-500)">小时</span>
              <div class="spacer"></div>
              <span class="badge" :class="calcResult.fee ? 'w' : 'g'">
                预估 ¥{{ calcResult.fee }}
              </span>
            </div>
            <div style="font-size: 12.5px; color: var(--ink-500)">
              {{ calcResult.note }} · 宽限 {{ config.graceMin }} 分钟
            </div>
          </div>
        </div>

        <div class="card" style="margin-top: 16px">
          <div class="card-h">
            <h3>异常处理</h3>
          </div>
          <div
            class="toast warn"
            style="display: flex; width: 100%; justify-content: space-between; margin: 0 0 8px"
          >
            <span>无牌车 / 识别失败：东门道闸 01 识别失败 2 次</span>
            <button class="btn secondary sm" style="flex: none">人工登记</button>
          </div>
          <div
            class="toast err"
            style="display: flex; width: 100%; justify-content: space-between; margin: 0"
          >
            <span>超时未离场：孙浩 沪D·9M3K8 已超时，待核销</span>
            <button class="btn danger sm" style="flex: none">强制核销</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
