<!-- 认证界面 -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { verifies as fallback, anomalies as anomalyFallback, type Anomaly } from '@/mock/data'
import { api } from '@/api'
import { notify } from '@/utils/toast'
import * as echarts from 'echarts'
import EChart from '@/components/EChart.vue'

const filter = ref<'全部' | '通过' | '不通过' | '翻拍预警'>('全部')
const list = ref(fallback)
const loading = ref(true)
const online = ref(false)

// ===== 异常核验台（真实数据：mock-server /api/anomalies，5s 轮询同步） =====
const anomalies = ref<Anomaly[]>(anomalyFallback)
const anomalyLoading = ref(true)
const anomalyOnline = ref(false)
const pendingCount = computed(() => anomalies.value.filter(a => a.status === '待处置').length)

async function load() {
  loading.value = true
  try {
    const [v, an] = await Promise.all([api.listVerifies(), api.listAnomalies()])
    list.value = v
    anomalies.value = an
    online.value = true
    anomalyOnline.value = true
  } catch {
    list.value = fallback
    anomalies.value = anomalyFallback
    online.value = false
    anomalyOnline.value = false
  } finally {
    loading.value = false
    anomalyLoading.value = false
  }
}
let syncTimer: number | undefined
onMounted(() => {
  load()
  syncTimer = window.setInterval(load, 5000) // 每 5 秒自动同步对端（小程序签到 / 闸机异常）
})
onBeforeUnmount(() => window.clearInterval(syncTimer))

const filtered = computed(() =>
  list.value.filter(v => filter.value === '全部' || v.result === filter.value)
)

function resultClass(r: string) {
  return r === '通过' ? 's' : r === '翻拍预警' ? 'r' : 'd'
}

// ===== 异常处置 =====
const showModal = ref(false)
const disposeTarget = ref<Anomaly | null>(null)
const disposeAction = ref<'pass' | 'guide' | 'blacklist'>('pass')
const disposing = ref(false)
const disposeOptions: { key: 'pass' | 'guide' | 'blacklist'; label: string; hint: string }[] = [
  { key: 'pass', label: '人工复核通过', hint: '人工复核无误，标记放行并留痕' },
  { key: 'guide', label: '引导前台核验', hint: '转前台人工核验证件后放行' },
  { key: 'blacklist', label: '加入黑名单并拦截', hint: '拉黑该访客，联动拦截其可通行访问单' },
]

function openDispose(a: Anomaly) {
  disposeTarget.value = a
  disposeAction.value = 'pass'
  showModal.value = true
}

async function confirmDispose() {
  const a = disposeTarget.value
  if (!a || disposing.value) return
  disposing.value = true
  try {
    const r = await api.disposeAnomaly(a.id, {
      action: disposeAction.value,
      operator: '值班安保',
    })
    showModal.value = false
    const hint = r.blacklist?.alreadyInBlacklist
      ? '（该访客已在黑名单，本次仅处置留痕）'
      : r.blacklist && r.blacklist.linked
        ? `（已联动置灰 ${r.blacklist.linked} 条访问单）`
        : ''
    notify.success('已处置：' + a.visitor + ' ' + r.anomaly.disposeAction + hint)
    await load()
  } catch {
    notify.error('处置失败：请确认 Mock 服务已启动（node mock-server）')
  } finally {
    disposing.value = false
  }
}

function levelClass(l: string) {
  return l === '高' ? 'd' : l === '中' ? 'w' : 's'
}

// 核验方式分布（环形图）
const methodOption = computed<echarts.EChartsOption>(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, textStyle: { color: '#64748b', fontSize: 12 } },
  color: ['#2f9e6f', '#3b82f6', '#f59e0b'],
  series: [
    {
      type: 'pie',
      radius: ['48%', '72%'],
      center: ['50%', '44%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { formatter: '{d}%', color: '#475569' },
      data: ['人脸', '二维码', '证件'].map(m => ({
        name: m,
        value: list.value.filter(v => v.method === m).length,
      })),
    },
  ],
}))

// 核验结果统计（柱状图，逐项配色）
const resultOption = computed<echarts.EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 16, top: 24, bottom: 24 },
  xAxis: {
    type: 'category',
    data: ['通过', '不通过', '翻拍预警'],
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
      name: '次数',
      type: 'bar',
      barWidth: 34,
      itemStyle: { borderRadius: [6, 6, 0, 0] },
      data: [
        {
          value: list.value.filter(v => v.result === '通过').length,
          itemStyle: { color: '#16a34a' },
        },
        {
          value: list.value.filter(v => v.result === '不通过').length,
          itemStyle: { color: '#ef4444' },
        },
        {
          value: list.value.filter(v => v.result === '翻拍预警').length,
          itemStyle: { color: '#ec4899' },
        },
      ],
    },
  ],
}))
</script>

<template>
  <div>
    <!-- 异常核验台（真实数据：闸机/人脸终端异常事件 + 扫码拦截，5s 自动同步） -->
    <div class="card" style="border-color: #fecaca; background: #fff7f7">
      <div class="card-h">
        <h3>⚠️ 异常核验台</h3>
        <!-- <span class="chip" :style="{ color: anomalyOnline ? '#15803d' : '#b45309', background: anomalyOnline ? '#dcfce7' : '#fef3c7' }">
          {{ anomalyLoading ? '同步中…' : anomalyOnline ? '🟢 实时同步' : '⚪ 离线演示数据' }}
        </span> -->
        <span v-if="pendingCount" class="badge d">待处置 {{ pendingCount }}</span>
        <span v-else class="badge s">全部已处置</span>
      </div>
      <div
        v-if="anomalies.length === 0"
        class="toast"
        style="margin: 0; background: #f0fdf4; border-color: #bbf7d0; color: #15803d"
      >
        🎉 当前无异常核验事件，各门禁终端运行正常
      </div>
      <div
        v-for="a in anomalies"
        :key="a.id"
        class="toast"
        :class="a.status === '待处置' ? 'err' : ''"
        style="
          display: flex;
          width: 100%;
          justify-content: space-between;
          margin: 0 0 8px;
          align-items: center;
        "
      >
        <div style="flex: 1; min-width: 0">
          <span class="badge" :class="levelClass(a.level)">{{ a.level }}危</span>
          <strong>{{ a.visitor }}</strong>
          <span class="chip" style="margin-left: 6px">{{ a.type }}</span>
          <span style="font-size: 12px; color: var(--ink-400)">{{ a.device }} · {{ a.time }}</span>
          <div style="font-size: 12.5px; color: var(--ink-500); margin-top: 4px; line-height: 1.5">
            {{ a.desc }}
          </div>
          <div
            v-if="a.status === '已处置'"
            style="font-size: 12px; color: #15803d; margin-top: 4px"
          >
            ✓ 已处置：{{ a.disposeAction }} · {{ a.operator }} · {{ a.disposeTime }}
          </div>
        </div>
        <button
          v-if="a.status === '待处置'"
          class="btn danger sm"
          style="flex: none; margin-left: 12px"
          @click="openDispose(a)"
        >
          处置
        </button>
      </div>
    </div>
    <div class="grid2" style="align-items: start; margin: 16px 0">
      <div class="card">
        <div class="card-h"><h3>核验方式分布</h3></div>
        <EChart :option="methodOption" height="240px" />
      </div>
      <div class="card">
        <div class="card-h"><h3>核验结果统计</h3></div>
        <EChart :option="resultOption" height="240px" />
      </div>
    </div>

    <!-- 核验记录 -->
    <div class="card" style="margin-top: 16px">
      <div class="toolbar">
        <h3 style="font-size: 15px; margin: 0">核验记录</h3>
        <div class="spacer"></div>
        <span class="chip">{{
          loading ? '加载中…' : online ? '🟢 与小程序签到互通' : '⚪ 离线模式'
        }}</span>
        <button class="btn ghost sm" @click="load">刷新</button>
        <select v-model="filter">
          <option>全部</option>
          <option>通过</option>
          <option>不通过</option>
          <option>翻拍预警</option>
        </select>
        <span class="chip">活体检测失败阈值：3 次</span>
      </div>
      <div class="dtable-wrap">
        <table class="dtable">
          <thead>
            <tr>
              <th>访客</th>
              <th>核验方式</th>
              <th>结果</th>
              <th>设备</th>
              <th>时间</th>
              <th>相似度</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in filtered" :key="v.id + v.time">
              <td>{{ v.visitor }}</td>
              <td>
                <span class="chip">{{ v.method }}</span>
              </td>
              <td>
                <span class="badge" :class="resultClass(v.result)">{{ v.result }}</span>
              </td>
              <td>{{ v.device }}</td>
              <td>{{ v.time }}</td>
              <td>{{ v.similarity ? v.similarity + '%' : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 处置弹窗 -->
    <div v-if="showModal && disposeTarget" class="modal-mask" @click.self="showModal = false">
      <div class="modal">
        <div class="mh">现场处置 · {{ disposeTarget.visitor }}</div>
        <div class="mb">
          <div style="font-size: 12.5px; color: var(--ink-500); margin-bottom: 12px">
            {{ disposeTarget.type }}（{{ disposeTarget.device }} {{ disposeTarget.time }}）：{{
              disposeTarget.desc
            }}
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px">
            <button
              v-for="m in disposeOptions"
              :key="m.key"
              class="btn sm"
              :class="disposeAction === m.key ? 'primary' : 'ghost'"
              style="text-align: left; justify-content: flex-start"
              @click="disposeAction = m.key"
            >
              {{ m.label }}
              <span style="opacity: 0.65; font-weight: 400; margin-left: 8px">{{ m.hint }}</span>
            </button>
          </div>
        </div>
        <div class="mf">
          <button class="btn ghost sm" :disabled="disposing" @click="showModal = false">
            取消
          </button>
          <button class="btn primary sm" :disabled="disposing" @click="confirmDispose">
            {{ disposing ? '处置中…' : '确认处置并留痕' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
