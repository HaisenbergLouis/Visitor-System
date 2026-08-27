<!-- 认证界面 -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { verifies as fallback } from '@/mock/data'
import { api } from '@/api'
import * as echarts from 'echarts'
import EChart from '@/components/EChart.vue'

const filter = ref<'全部' | '通过' | '不通过' | '翻拍预警'>('全部')
const list = ref(fallback)
const loading = ref(true)
const online = ref(false)

async function load() {
  loading.value = true
  try {
    list.value = await api.listVerifies()
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
  syncTimer = window.setInterval(load, 5000) // 每 5 秒自动同步对端（小程序签到）
})
onBeforeUnmount(() => window.clearInterval(syncTimer))

const filtered = computed(() =>
  list.value.filter(v => filter.value === '全部' || v.result === filter.value)
)

function resultClass(r: string) {
  return r === '通过' ? 's' : r === '翻拍预警' ? 'r' : 'd'
}

const showModal = ref(false)
const modalTarget = ref('访客「黄伟」')

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

function handleAbnormal(v: { visitor: string }) {
  modalTarget.value = '访客「' + v.visitor + '」'
  showModal.value = true
}
</script>

<template>
  <div>
    <!-- 异常核验台 -->
    <div class="card" style="border-color: #fecaca; background: #fff7f7">
      <div class="card-h">
        <h3>⚠️ 异常核验台</h3>
        <span class="badge r">翻拍预警 1</span>
      </div>
      <div
        class="toast err"
        style="display: flex; width: 100%; justify-content: space-between; margin: 0 0 8px"
      >
        <span>南门人脸终端捕获「翻拍预警」：访客黄伟，人证比对疑似照片翻拍，建议转人工核验</span>
        <button
          class="btn danger sm"
          style="flex: none"
          @click="handleAbnormal({ visitor: '黄伟' })"
        >
          处置
        </button>
      </div>
      <div
        class="toast warn"
        style="display: flex; width: 100%; justify-content: space-between; margin: 0"
      >
        <span>非授权区域闯入：访客徐芳尝试进入「研发楼 3F 实验室」，无该区域权限</span>
        <button
          class="btn secondary sm"
          style="flex: none"
          @click="handleAbnormal({ visitor: '徐芳' })"
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
    <div v-if="showModal" class="modal-mask" @click.self="showModal = false">
      <div class="modal">
        <div class="mh">现场处置</div>
        <div class="mb">
          {{ modalTarget }} 核验存在异常，请选择处置方式：<br /><br />
          <div style="display: flex; gap: 8px; flex-wrap: wrap">
            <button class="btn secondary sm">人工复核通过</button>
            <button class="btn ghost sm">引导前台核验</button>
            <button class="btn danger sm">加入黑名单并拦截</button>
          </div>
        </div>
        <div class="mf">
          <button class="btn ghost sm" @click="showModal = false">取消</button>
          <button class="btn primary sm" @click="showModal = false">确认处置并留痕</button>
        </div>
      </div>
    </div>
  </div>
</template>
