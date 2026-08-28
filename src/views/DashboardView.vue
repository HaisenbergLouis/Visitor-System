<script setup lang="ts">
import { computed, ref } from 'vue'
import * as echarts from 'echarts'
import EChart from '@/components/EChart.vue'
import { visitors, verifies, blacklist, report } from '@/mock/data'
import { today } from '@/utils/date'

// KPI 全部来自实时数据（mock 数据已随系统日期动态平移）
const todayStr = today()
const todayCount = computed(() =>
  visitors.filter((v) => v.date === todayStr && (v.status === '在访' || v.status === '已签到' || v.status === '待审批' || v.status === '已通过')).length,
)
const inHouse = computed(() => visitors.filter((v) => v.status === '在访').length)
const pending = computed(() => visitors.filter((v) => v.status === '待审批').length)
const risk = computed(() => blacklist.length)

const kpis = computed(() => [
  { label: '今日预约', value: todayCount.value, delta: '实时统计', up: true },
  { label: '在场访客', value: inHouse.value, delta: '实时统计', up: true },
  { label: '待审批', value: pending.value, delta: '待处理', up: false },
  { label: '黑名单预警', value: risk.value, delta: '需处置', up: false },
])

const alertItems = [
  { level: 'danger', text: '黑名单命中：访客「赵强」试图进入，已拦截并通知安保', time: '2 分钟前' },
  { level: 'warn', text: '超时未签离：访客「周敏」停留已超 4 小时，请核实', time: '10 分钟前' },
  { level: 'warn', text: '设备离线：车库道闸 01 心跳中断', time: '25 分钟前' },
  { level: 'info', text: '翻拍预警：南门人脸终端捕获异常比对', time: '1 小时前' },
]

// ===== ECharts：近 7 日访客趋势（渐变柱 + 今日高亮） =====
const trendOption: echarts.EChartsOption = {
  tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,23,42,0.9)', textStyle: { color: '#fff' } },
  grid: { left: 44, right: 16, top: 24, bottom: 28 },
  xAxis: {
    type: 'category',
    data: report.weekly.map((w) => w.day),
    axisLine: { lineStyle: { color: '#e2e8f0' } },
    axisTick: { show: false },
    axisLabel: { color: '#64748b' },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: '#f1f5f9' } },
    axisLabel: { color: '#94a3b8' },
  },
  series: [
    {
      name: '访客量',
      type: 'bar',
      data: report.weekly.map((w) => w.count),
      barWidth: 26,
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#52b788' },
          { offset: 1, color: '#1f7a50' },
        ]),
      },
      emphasis: { itemStyle: { color: '#2f9e6f' } },
    },
  ],
}

// ===== ECharts：区域热度 TOP（横向条形） =====
const maxArea = Math.max(...report.areas.map((a) => a.count))
const areaOption: echarts.EChartsOption = {
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: 70, right: 30, top: 10, bottom: 12 },
  xAxis: {
    type: 'value',
    max: maxArea,
    splitLine: { lineStyle: { color: '#f1f5f9' } },
    axisLabel: { color: '#94a3b8' },
  },
  yAxis: {
    type: 'category',
    data: report.areas.map((a) => a.area),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#475569' },
  },
  series: [
    {
      type: 'bar',
      data: report.areas.map((a) => a.count),
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
}

const recent = visitors.slice(0, 6)
</script>

<template>
  <div>
    <!-- KPI -->
    <div class="kpis">
      <div v-for="k in kpis" :key="k.label" class="kpi">
        <div class="n">{{ k.value }}</div>
        <div class="l">{{ k.label }}</div>
        <div class="d" :class="k.up ? 'up' : 'down'">{{ k.delta }}</div>
      </div>
    </div>

    <div class="grid2" style="align-items: start">
      <!-- 近 7 日趋势（ECharts） -->
      <div class="card">
        <div class="card-h">
          <h3>近 7 日访客趋势</h3>
          <span class="chip">今日 {{ todayStr }} · {{ todayCount }} 单</span>
        </div>
        <EChart :option="trendOption" height="280px" />
      </div>

      <!-- 实时预警面板 -->
      <div class="card">
        <div class="card-h">
          <h3>预警面板</h3>
          <span class="badge d">● {{ risk }} 条需处置</span>
        </div>
        <div v-for="a in alertItems" :key="a.text" class="toast" :class="a.level" style="display: flex; width: 100%; justify-content: space-between; margin: 0 0 8px">
          <span>{{ a.text }}</span>
          <span style="opacity: 0.75; font-size: 11.5px; flex: none">{{ a.time }}</span>
        </div>
      </div>
    </div>

    <div class="grid2" style="align-items: start; margin-top: 16px">
      <!-- 今日在场统计 -->
      <div class="card">
        <div class="card-h">
          <h3>今日现场概览</h3>
          <span class="chip">实时</span>
        </div>
        <div class="kpis" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 0">
          <div class="kpi">
            <div class="n">{{ inHouse }}</div>
            <div class="l">在场访客</div>
          </div>
          <div class="kpi">
            <div class="n">{{ todayCount }}</div>
            <div class="l">今日预约</div>
          </div>
          <div class="kpi">
            <div class="n">{{ pending }}</div>
            <div class="l">待审批</div>
          </div>
        </div>
      </div>

      <!-- 区域热度（ECharts） -->
      <div class="card">
        <div class="card-h">
          <h3>区域热度 TOP</h3>
        </div>
        <EChart :option="areaOption" height="240px" />
      </div>
    </div>

    <!-- 最近访客 -->
    <div class="card" style="margin-top: 16px">
      <div class="card-h">
        <h3>最近访客</h3>
        <router-link to="/visitors" class="link" style="color: var(--brand-700); font-weight: 600; font-size: 13px">查看全部 →</router-link>
      </div>
      <div class="dtable-wrap">
        <table class="dtable">
          <thead>
            <tr><th>访客</th><th>被访人</th><th>时间</th><th>区域</th><th>状态</th></tr>
          </thead>
          <tbody>
            <tr v-for="v in recent" :key="v.id">
              <td>
                <div class="name-cell">
                  <div class="ava">{{ v.name[0] }}</div>
                  <div>{{ v.name }}<div class="sub">{{ v.company }}</div></div>
                </div>
              </td>
              <td>{{ v.host }} · {{ v.hostDept }}</td>
              <td>{{ v.date }} {{ v.time }}</td>
              <td>{{ v.area }}</td>
              <td><span class="badge" :class="v.status === '在访' ? 'g' : v.status === '已签离' ? 'n' : v.status === '待审批' ? 'w' : v.status === '黑名单' ? 'd' : 's'">{{ v.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
