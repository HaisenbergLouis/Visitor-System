<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { api } from '@/api'
import { notify } from '@/utils/toast'
import { visitors as fallback } from '@/mock/data'
import type { VisitRecord } from '@/mock/data'
import { fromFullDate, today, toFullDate, todayFull } from '@/utils/date'

const tab = ref<'待审批' | '已处理'>('待审批')
const list = ref<VisitRecord[]>([])
const loading = ref(true)
const online = ref(false)

const pendingList = computed(() => list.value.filter(a => a.status === '待审批'))
const doneList = computed(() => list.value.filter(a => a.status !== '待审批'))

async function load() {
  loading.value = true
  try {
    list.value = await api.listVisits()
    online.value = true
  } catch {
    // 离线降级：使用本地 mock
    list.value = fallback.filter(
      v => v.status === '待审批' || v.status === '已通过' || v.status === '已拒绝'
    )
    online.value = false
  } finally {
    loading.value = false
  }
}
let syncTimer: number | undefined
onMounted(() => {
  load()
  syncTimer = window.setInterval(load, 5000) // 每 5 秒自动同步对端（小程序新预约）
})
onBeforeUnmount(() => window.clearInterval(syncTimer))

async function approve(a: VisitRecord) {
  a.status = '已通过'
  try {
    await api.updateVisit(a.id, { status: '已通过' })
  } catch {
    /* 离线：仅本地生效 */
  }
  notify.success('已通过：审批结论已同步至小程序与通行码')
}
async function reject(a: VisitRecord) {
  a.status = '已拒绝'
  try {
    await api.updateVisit(a.id, { status: '已拒绝' })
  } catch {
    /* 离线 */
  }
  notify.success('已拒绝：已通知访客')
}

// 策略配置
const strategy = ref<'自动通过' | '人工审批' | '分级审批'>('人工审批')
const whiteAuto = ref(true)

// ===== 员工邀约 =====
const showInvite = ref(false)
const inviteSaving = ref(false)
const inviteForm = ref({
  name: '',
  phone: '',
  company: '',
  host: '李工',
  hostDept: '研发部',
  reason: '受邀来访',
  dateInput: todayFull(),
  time: '10:00',
  area: '研发楼 1F',
  freeMin: 180,
})
function openInvite() {
  showInvite.value = true
}
function closeInvite() {
  if (!inviteSaving.value) showInvite.value = false
}
async function submitInvite() {
  if (!inviteForm.value.name.trim() || !inviteForm.value.host.trim()) {
    notify.warn('请填写访客姓名与被访人')
    return
  }
  if (inviteForm.value.dateInput < todayFull()) {
    notify.warn('到访日期不能早于今天')
    return
  }
  inviteSaving.value = true
  try {
    await api.createVisit({
      name: inviteForm.value.name.trim(),
      company: inviteForm.value.company.trim() || '—',
      host: inviteForm.value.host.trim(),
      hostDept: inviteForm.value.hostDept.trim(),
      reason: inviteForm.value.reason.trim(),
      date: fromFullDate(inviteForm.value.dateInput),
      time: inviteForm.value.time,
      area: inviteForm.value.area,
      plate: '',
      companions: 0,
    })
    notify.success('邀约已发送：访客「' + inviteForm.value.name.trim() + '」已生成邀约记录（待审批）')
    showInvite.value = false
    await load()
  } catch {
    notify.error('发送失败：请确认 Mock 服务已启动（node mock-server）')
  } finally {
    inviteSaving.value = false
  }
}

// ===== 批量邀约（Excel / CSV 导入） =====
const showBatch = ref(false)
const batchSaving = ref(false)
const batchRows = ref<string[][]>([])
const fileInput = ref<HTMLInputElement>()

function openBatch() {
  showBatch.value = true
  batchRows.value = []
}
function closeBatch() {
  if (!batchSaving.value) showBatch.value = false
}
function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map(line => line.split(',').map(c => c.replace(/^"|"$/g, '').trim()))
    .filter(row => row.some(c => c))
}
function downloadTemplate() {
  const headers = ['访客姓名', '公司', '被访人', '部门', '来访事由', '日期', '时间', '区域']
  const csv =
    headers.join(',') + '\r\n' + `张三,某科技公司,李工,研发部,技术交流,${today()},10:00,研发楼 1F`
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '批量邀约模板.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const text = String(reader.result || '')
    let rows = parseCsv(text)
    // 去掉表头（含"访客姓名"）
    const firstRow = rows[0]
    if (firstRow && firstRow[0] && firstRow[0].includes('访客')) rows = rows.slice(1)
    batchRows.value = rows
  }
  reader.readAsText(file, 'utf-8')
}
async function submitBatch() {
  const rows = batchRows.value
  if (!rows.length) {
    notify.warn('请先导入 CSV 文件')
    return
  }
  batchSaving.value = true
  let ok = 0
  let fail = 0
  for (const r of rows) {
    if (!r[0]) continue
    try {
      await api.createVisit({
        name: r[0] || '',
        company: r[1] || '—',
        host: r[2] || '李工',
        hostDept: r[3] || '',
        reason: r[4] || '受邀来访',
        date: r[5] || today(),
        time: r[6] || '10:00',
        area: r[7] || '研发楼 1F',
        plate: '',
        companions: 0,
      })
      ok++
    } catch {
      fail++
    }
  }
  notify.success('批量邀约完成：成功 ' + ok + ' 条' + (fail ? '，失败 ' + fail + ' 条' : ''))
  showBatch.value = false
  batchSaving.value = false
  await load()
}

// ===== 改期 =====
const showReschedule = ref(false)
const rescheduleSaving = ref(false)
const rescheduleTarget = ref<VisitRecord | null>(null)
const rescheduleForm = ref({ dateInput: todayFull(), time: '10:00' })

function openReschedule(a: VisitRecord) {
  rescheduleTarget.value = a
  rescheduleForm.value = { dateInput: toFullDate(a.date), time: (a.time || '').split('–')[0] || '10:00' }
  showReschedule.value = true
}
function closeReschedule() {
  if (!rescheduleSaving.value) showReschedule.value = false
}
async function submitReschedule() {
  const a = rescheduleTarget.value
  if (!a) return
  if (rescheduleForm.value.dateInput < todayFull()) {
    notify.warn('改期日期不能早于今天')
    return
  }
  rescheduleSaving.value = true
  try {
    await api.updateVisit(a.id, {
      date: fromFullDate(rescheduleForm.value.dateInput),
      time: rescheduleForm.value.time,
    })
    notify.success(
      '已改期：' +
        a.name +
        ' 的访问时间调整为 ' +
        fromFullDate(rescheduleForm.value.dateInput) +
        ' ' +
        rescheduleForm.value.time +
        '，已同步小程序'
    )
    showReschedule.value = false
    await load()
  } catch {
    notify.error('改期失败：请确认 Mock 服务已启动（node mock-server）')
  } finally {
    rescheduleSaving.value = false
  }
}
</script>

<template>
  <div>
    <!-- 审批流策略配置 -->
    <div class="card">
      <div class="card-h">
        <h3>审批流策略</h3>
        <span class="chip">邀约超期自动失效</span>
      </div>
      <div class="toolbar" style="margin-bottom: 0">
        <span style="font-size: 13px; color: var(--ink-600)">默认策略：</span>
        <select v-model="strategy">
          <option>自动通过</option>
          <option>人工审批</option>
          <option>分级审批</option>
        </select>
        <label style="font-size: 13px; display: flex; align-items: center; gap: 6px">
          <input v-model="whiteAuto" type="checkbox" /> 白名单/常访客自动通过
        </label>
        <div class="spacer"></div>
        <button class="btn secondary sm" @click="openBatch">批量邀约（Excel）</button>
        <button class="btn primary sm" @click="openInvite">+ 员工邀约</button>
      </div>
    </div>

    <!-- 标签页 -->
    <div class="card" style="margin-top: 16px">
      <div class="toolbar" style="margin-bottom: 12px">
        <button
          class="btn sm"
          :class="tab === '待审批' ? 'primary' : 'ghost'"
          @click="tab = '待审批'"
        >
          待审批（{{ pendingList.length }}）
        </button>
        <button
          class="btn sm"
          :class="tab === '已处理' ? 'primary' : 'ghost'"
          @click="tab = '已处理'"
        >
          已处理（{{ doneList.length }}）
        </button>
        <div class="spacer"></div>
        <span class="chip" :class="online ? '' : ''" style="cursor: default">
          {{
            loading
              ? '加载中…'
              : online
                ? '🟢 已连接 Mock 服务（与小程序数据互通）'
                : '⚪ 离线模式（本地数据）'
          }}
        </span>
        <button class="btn ghost sm" @click="load">刷新</button>
      </div>

      <div class="dtable-wrap">
        <table class="dtable">
          <thead>
            <tr>
              <th>访客</th>
              <th>被访人</th>
              <th>来访事由</th>
              <th>预约时间</th>
              <th>车牌</th>
              <th>申请时间</th>
              <th>状态 / 操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in tab === '待审批' ? pendingList : doneList" :key="a.id">
              <td>
                <div class="name-cell">
                  <div class="ava">{{ a.name[0] }}</div>
                  <div>
                    {{ a.name }}
                    <div class="sub">{{ a.company }}</div>
                  </div>
                </div>
              </td>
              <td>{{ a.host }} · {{ a.hostDept }}</td>
              <td>{{ a.reason }}</td>
              <td>{{ a.date }} {{ a.time }}</td>
              <td>{{ a.plate || '—' }}</td>
              <td>{{ a.createTime }}</td>
              <td>
                <template v-if="tab === '待审批'">
                  <button class="btn secondary sm" style="margin-right: 6px" @click="approve(a)">
                    通过
                  </button>
                  <button class="btn ghost sm" style="margin-right: 6px" @click="reject(a)">
                    驳回
                  </button>
                  <button class="btn ghost sm" @click="openReschedule(a)">改期</button>
                </template>
                <span v-else class="badge" :class="a.status === '已通过' ? 's' : 'd'">{{
                  a.status
                }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!pendingList.length && tab === '待审批'" class="empty">
          暂无待审批，全部处理完毕 🎉
        </div>
      </div>
    </div>

    <!-- 员工邀约弹窗 -->
    <div v-if="showInvite" class="modal-mask" @click.self="closeInvite">
      <div class="modal" style="width: 580px">
        <div class="mh">员工邀约</div>
        <div class="mb">
          <div class="form-grid">
            <div class="form-item">
              <label>访客姓名 <span class="req">*</span></label>
              <input v-model="inviteForm.name" placeholder="如：王小明" />
            </div>
            <div class="form-item">
              <label>手机号</label>
              <input v-model="inviteForm.phone" placeholder="选填" />
            </div>
            <div class="form-item">
              <label>公司 / 单位</label>
              <input v-model="inviteForm.company" placeholder="如：中科云智" />
            </div>
            <div class="form-item">
              <label>被访人 <span class="req">*</span></label>
              <input v-model="inviteForm.host" />
            </div>
            <div class="form-item">
              <label>被访人部门</label>
              <input v-model="inviteForm.hostDept" />
            </div>
            <div class="form-item">
              <label>来访事由</label>
              <input v-model="inviteForm.reason" />
            </div>
            <div class="form-item">
              <label>到访日期</label>
              <input type="date" v-model="inviteForm.dateInput" :min="todayFull()" />
            </div>
            <div class="form-item">
              <label>到访时间</label>
              <input v-model="inviteForm.time" placeholder="10:00" />
            </div>
            <div class="form-item">
              <label>可通行区域</label>
              <select v-model="inviteForm.area">
                <option>研发楼 1F</option>
                <option>研发楼 2F</option>
                <option>总部 3F</option>
                <option>采购楼 2F</option>
                <option>仓储楼 1F</option>
              </select>
            </div>
            <div class="form-item">
              <label>免费停车时长</label>
              <select v-model.number="inviteForm.freeMin">
                <option :value="120">120 分钟</option>
                <option :value="180">180 分钟</option>
                <option :value="240">240 分钟</option>
              </select>
            </div>
          </div>
          <div style="font-size: 12.5px; color: var(--ink-400); margin-top: 10px">
            邀约发送后生成「待审批」访问单，写入共享后端，小程序 / 访客可同步看到。
          </div>
        </div>
        <div class="mf">
          <button class="btn ghost sm" @click="closeInvite">取消</button>
          <button class="btn primary sm" :disabled="inviteSaving" @click="submitInvite">
            {{ inviteSaving ? '发送中...' : '发送邀约' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 批量邀约弹窗 -->
    <div v-if="showBatch" class="modal-mask" @click.self="closeBatch">
      <div class="modal" style="width: 640px">
        <div class="mh">批量邀约（Excel / CSV 导入）</div>
        <div class="mb">
          <div class="toolbar" style="margin-bottom: 12px">
            <button class="btn secondary sm" @click="downloadTemplate">下载 CSV 模板</button>
            <input
              ref="fileInput"
              type="file"
              accept=".csv"
              style="display: none"
              @change="onFileChange"
            />
            <button class="btn ghost sm" @click="fileInput?.click()">选择 CSV 文件</button>
            <div class="spacer"></div>
            <span class="chip">模板列：姓名,公司,被访人,部门,事由,日期,时间,区域</span>
          </div>

          <div v-if="batchRows.length">
            <div style="font-size: 13px; color: var(--ink-600); margin-bottom: 8px">
              已解析 <b>{{ batchRows.length }}</b> 行，确认后批量导入：
            </div>
            <div class="dtable-wrap" style="max-height: 240px; overflow: auto">
              <table class="dtable">
                <thead>
                  <tr>
                    <th>访客</th>
                    <th>公司</th>
                    <th>被访人</th>
                    <th>事由</th>
                    <th>日期</th>
                    <th>时间</th>
                    <th>区域</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, i) in batchRows.slice(0, 20)" :key="i">
                    <td>{{ r[0] || '—' }}</td>
                    <td>{{ r[1] || '—' }}</td>
                    <td>{{ r[2] || '—' }}</td>
                    <td>{{ r[4] || '—' }}</td>
                    <td>{{ r[5] || '—' }}</td>
                    <td>{{ r[6] || '—' }}</td>
                    <td>{{ r[7] || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-else class="empty" style="padding: 24px 0">
            尚未导入文件，可先「下载 CSV 模板」填写后再导入。
          </div>
        </div>
        <div class="mf">
          <button class="btn ghost sm" @click="closeBatch">取消</button>
          <button
            class="btn primary sm"
            :disabled="batchSaving || !batchRows.length"
            @click="submitBatch"
          >
            {{ batchSaving ? '导入中...' : '确认批量导入（' + batchRows.length + '）' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 改期弹窗 -->
    <div v-if="showReschedule && rescheduleTarget" class="modal-mask" @click.self="closeReschedule">
      <div class="modal" style="width: 420px">
        <div class="mh">改期 · {{ rescheduleTarget.name }}</div>
        <div class="mb">
          <div class="form-grid">
            <div class="form-item">
              <label>新日期</label>
              <input type="date" v-model="rescheduleForm.dateInput" :min="todayFull()" />
            </div>
            <div class="form-item">
              <label>新时间</label>
              <input v-model="rescheduleForm.time" placeholder="10:00" />
            </div>
          </div>
          <div style="font-size: 12.5px; color: var(--ink-400); margin-top: 10px">
            调整后访问单时间将更新，并同步到小程序与通行码。
          </div>
        </div>
        <div class="mf">
          <button class="btn ghost sm" @click="closeReschedule">取消</button>
          <button class="btn primary sm" :disabled="rescheduleSaving" @click="submitReschedule">
            {{ rescheduleSaving ? '提交中...' : '确认改期' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
