<script setup lang="ts">
import { computed, ref } from 'vue'
import * as echarts from 'echarts'
import EChart from '@/components/EChart.vue'
import { notify } from '@/utils/toast'
import { report } from '@/mock/data'

const period = ref<'近 7 日' | '近 30 日' | '本季度'>('近 7 日')

const totalWeekly = report.weekly.reduce((s, w) => s + w.count, 0)

// ===== ECharts：到访量趋势（折线 + 面积渐变） =====
const trendOption = computed<echarts.EChartsOption>(() => ({
  tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,23,42,0.9)', textStyle: { color: '#fff' } },
  grid: { left: 44, right: 20, top: 24, bottom: 28 },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: report.weekly.map((w) => w.day),
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
      name: '到访量',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      data: report.weekly.map((w) => w.count),
      lineStyle: { width: 3, color: '#2f9e6f' },
      itemStyle: { color: '#2f9e6f', borderColor: '#fff', borderWidth: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(82,183,136,0.35)' },
          { offset: 1, color: 'rgba(82,183,136,0.02)' },
        ]),
      },
    },
  ],
}))

// ===== ECharts：TOP 被访人（横向条形） =====
const hostOption = computed<echarts.EChartsOption>(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: 8, right: 44, top: 8, bottom: 8, containLabel: true },
  xAxis: { type: 'value', show: false },
  yAxis: {
    type: 'category',
    inverse: true,
    data: report.topHosts.map((h) => h.host),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#475569', fontSize: 12 },
  },
  series: [
    {
      type: 'bar',
      data: report.topHosts.map((h) => h.count),
      barWidth: 14,
      label: { show: true, position: 'right', color: '#64748b' },
      itemStyle: {
        borderRadius: [0, 7, 7, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#a6f4c5' },
          { offset: 1, color: '#2f9e6f' },
        ]),
      },
    },
  ],
}))

// ===== ECharts：停留时长分布（环形图） =====
const durationOption = computed<echarts.EChartsOption>(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
  legend: { bottom: 0, textStyle: { color: '#64748b', fontSize: 12 } },
  color: ['#2f9e6f', '#52b788', '#a6f4c5', '#1f7a50'],
  series: [
    {
      type: 'pie',
      radius: ['48%', '72%'],
      center: ['50%', '44%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { formatter: '{d}%', color: '#475569' },
      data: report.durationDist.map((d) => ({ name: d.label, value: d.pct })),
    },
  ],
}))

function exportPdf() {
  notify.info('演示环境：已导出访客报表 PDF')
}
function exportExcel() {
  notify.info('演示环境：已导出访客报表 Excel（敏感字段已脱敏，导出留审计）')
}
</script>

<template>
  <div>
    <div class="card">
      <div class="toolbar" style="margin-bottom: 0">
        <h3 style="font-size: 15px; margin: 0">访客报表</h3>
        <div class="spacer"></div>
        <select v-model="period">
          <option>近 7 日</option><option>近 30 日</option><option>本季度</option>
        </select>
        <button class="btn ghost sm" @click="exportExcel">导出 Excel</button>
        <button class="btn primary sm" @click="exportPdf">导出 PDF</button>
      </div>
    </div>

    <div class="grid2" style="margin-top: 16px; align-items: start">
      <!-- 到访趋势（ECharts 折线面积图） -->
      <div class="card">
        <div class="card-h">
          <h3>到访量趋势（{{ period }}）</h3>
          <span class="chip">合计 {{ totalWeekly }} 人次</span>
        </div>
        <EChart :option="trendOption" height="280px" />
      </div>

      <!-- TOP 被访人（ECharts 横向条形） -->
      <div class="card">
        <div class="card-h">
          <h3>TOP 被访人</h3>
        </div>
        <EChart :option="hostOption" height="280px" />
      </div>

      <!-- 停留时长分布（ECharts 环形图） -->
      <div class="card">
        <div class="card-h">
          <h3>停留时长分布</h3>
        </div>
        <EChart :option="durationOption" height="280px" />
      </div>

      <!-- 区域统计 -->
      <div class="card">
        <div class="card-h">
          <h3>区域到访统计</h3>
        </div>
        <div class="dtable-wrap">
          <table class="dtable">
            <thead><tr><th>区域</th><th>到访次数</th><th>占比</th></tr></thead>
            <tbody>
              <tr v-for="a in report.areas" :key="a.area">
                <td>{{ a.area }}</td>
                <td>{{ a.count }}</td>
                <td>{{ Math.round((a.count / report.areas.reduce((s, x) => s + x.count, 0)) * 100) }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="font-size: 12px; color: var(--ink-400); margin-top: 12px">停车报表：车位利用率 78% · 平均停车 2.1 小时 · 免费核销率 92%（演示）</div>
      </div>
    </div>
  </div>
</template>
