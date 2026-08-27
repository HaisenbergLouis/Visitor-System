<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api'
import { notify } from '@/utils/toast'
import { visitors as fallback, blacklist, type VisitRecord } from '@/mock/data'

const router = useRouter()

function goApproval() {
  detail.value = null
  router.push('/approvals')
}

const keyword = ref('')
const statusFilter = ref('全部')
const dateFilter = ref('全部')

const statusOptions = ['全部', '待审批', '已通过', '已签到', '在访', '已签离', '黑名单', '已取消']

const list = ref<VisitRecord[]>([])
const loading = ref(true)
const online = ref(false)

async function load() {
  loading.value = true
  try {
    list.value = await api.listVisits()
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
  syncTimer = window.setInterval(load, 5000) // 每 5 秒自动同步对端
})
onBeforeUnmount(() => window.clearInterval(syncTimer))

const filtered = computed(() =>
  list.value.filter(v => {
    const kw = keyword.value.trim()
    const matchKw = !kw || v.name.includes(kw) || v.id.includes(kw) || v.host.includes(kw)
    const matchStatus = statusFilter.value === '全部' || v.status === statusFilter.value
    const matchDate = dateFilter.value === '全部' || v.date === dateFilter.value
    return matchKw && matchStatus && matchDate
  })
)

const detail = ref<VisitRecord | null>(null)

function statusClass(s: string) {
  const map: Record<string, string> = {
    待审批: 'w',
    已通过: 's',
    已签到: 'i',
    在访: 'g',
    已签离: 'n',
    黑名单: 'd',
    已取消: 'n',
    已拒绝: 'd',
  }
  return map[s] || 'n'
}

function openDetail(v: VisitRecord) {
  detail.value = v
}

// ===== 导出 Excel（CSV + UTF-8 BOM，Excel 打开中文不乱码） =====
function exportExcel() {
  const rows = filtered.value
  if (!rows.length) {
    notify.warn('当前筛选结果为空，无可导出数据')
    return
  }
  const headers = [
    '访问编号',
    '访客',
    '公司',
    '被访人',
    '部门',
    '来访事由',
    '日期',
    '时间',
    '区域',
    '车牌',
    '随行人数',
    '状态',
    '风险',
  ]
  const lines = rows.map(v => [
    v.id,
    v.name,
    v.company,
    v.host,
    v.hostDept,
    v.reason,
    v.date,
    v.time,
    v.area,
    v.plate || '',
    v.companions,
    v.status,
    v.risk || '正常',
  ])
  const csv = [headers, ...lines]
    .map(row => row.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `访客列表_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ===== 手动新增访客（写入共享后端，小程序/审批台可同步） =====
const showAdd = ref(false)
const addSaving = ref(false)
const addForm = ref({
  name: '',
  company: '',
  host: '',
  hostDept: '',
  reason: '',
  date: '08-13',
  time: '10:00',
  area: '研发楼 1F',
  plate: '',
  companions: 0,
})

function openAdd() {
  showAdd.value = true
}
function closeAdd() {
  if (addSaving.value) return
  showAdd.value = false
}
async function submitAdd() {
  if (!addForm.value.name.trim() || !addForm.value.host.trim() || !addForm.value.reason.trim()) {
    notify.warn('请填写访客姓名、被访人、来访事由')
    return
  }
  addSaving.value = true
  try {
    await api.createVisit({
      name: addForm.value.name.trim(),
      company: addForm.value.company.trim() || '—',
      host: addForm.value.host.trim(),
      hostDept: addForm.value.hostDept.trim(),
      reason: addForm.value.reason.trim(),
      date: addForm.value.date,
      time: addForm.value.time,
      area: addForm.value.area,
      plate: addForm.value.plate.trim(),
      companions: addForm.value.companions || 0,
    })
    notify.success('新增成功：已写入共享后端（状态：待审批），小程序 / 审批台可同步看到')
    showAdd.value = false
    await load()
  } catch (e) {
    notify.error('新增失败：请确认 Mock 服务已启动（node mock-server）')
  } finally {
    addSaving.value = false
  }
}
</script>

<template>
  <div>
    <!-- 筛选工具条 -->
    <div class="card" style="margin-bottom: 16px">
      <div class="toolbar" style="margin-bottom: 0">
        <input v-model="keyword" placeholder="搜索 访客/编号/被访人" style="width: 240px" />
        <select v-model="statusFilter">
          <option v-for="s in statusOptions" :key="s">{{ s }}</option>
        </select>
        <select v-model="dateFilter">
          <option>全部</option>
          <option>08-11</option>
          <option>08-12</option>
          <option>08-13</option>
          <option>08-14</option>
        </select>
        <div class="spacer"></div>
        <button class="btn secondary sm" @click="exportExcel">导出 Excel</button>
        <button class="btn primary sm" @click="openAdd">+ 手动新增</button>
      </div>
    </div>

    <!-- 黑名单预警条 -->
    <div v-if="blacklist.length" class="card" style="border-color: #fecaca; background: #fff7f7">
      <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap">
        <span class="badge d">● {{ blacklist.length }} 条黑名单命中</span>
        <span v-for="b in blacklist" :key="b.id" class="chip">
          {{ b.name }} · {{ b.level }} · {{ b.reason }}
        </span>
        <div class="spacer" style="flex: 1"></div>
        <button class="btn danger sm">处理名单</button>
      </div>
    </div>

    <!-- 访客列表 -->
    <div class="card">
      <div class="card-h">
        <h3>访客列表（{{ filtered.length }} 条）</h3>
        <div style="display: flex; align-items: center; gap: 10px">
          <span class="chip">{{
            loading ? '加载中…' : online ? '🟢 与小程序数据互通' : '⚪ 离线模式'
          }}</span>
          <button class="btn ghost sm" @click="load">刷新</button>
          <span class="chip">三级黑白名单：公安 / 企业 / 个人</span>
        </div>
      </div>
      <div class="dtable-wrap">
        <table class="dtable">
          <thead>
            <tr>
              <th>访问编号</th>
              <th>访客</th>
              <th>被访人</th>
              <th>来访事由</th>
              <th>时间</th>
              <th>区域</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in filtered" :key="v.id">
              <td style="font-family: monospace; font-size: 12.5px; color: var(--ink-500)">
                {{ v.id }}
              </td>
              <td>
                <div class="name-cell">
                  <div class="ava">{{ v.name[0] }}</div>
                  <div>
                    {{ v.name }}
                    <div class="sub">{{ v.company }} · 随行 {{ v.companions }} 人</div>
                  </div>
                </div>
              </td>
              <td>{{ v.host }} · {{ v.hostDept }}</td>
              <td>{{ v.reason }}</td>
              <td>
                {{ v.date }}
                <div class="sub">{{ v.time }}</div>
              </td>
              <td>{{ v.area }}</td>
              <td>
                <span class="badge" :class="statusClass(v.status)">{{ v.status }}</span>
                <div v-if="v.risk !== '正常'" class="sub" style="color: var(--warning)">
                  {{ v.risk }}
                </div>
              </td>
              <td><span class="link" @click="openDetail(v)">详情</span></td>
            </tr>
          </tbody>
        </table>
        <div v-if="!filtered.length" class="empty">无匹配记录</div>
      </div>
    </div>

    <!-- 访客详情弹窗（完整访问链路） -->
    <div v-if="detail" class="modal-mask" @click.self="detail = null">
      <div class="modal" style="width: 560px">
        <div class="mh">访客详情 · {{ detail.id }}</div>
        <div class="mb">
          <div class="kv" style="grid-template-columns: 1fr 1fr">
            <div class="kv-i">
              <span class="k">访客</span
              ><span class="v">{{ detail.name }}（{{ detail.company }}）</span>
            </div>
            <div class="kv-i">
              <span class="k">被访人</span
              ><span class="v">{{ detail.host }} · {{ detail.hostDept }}</span>
            </div>
            <div class="kv-i">
              <span class="k">来访事由</span><span class="v">{{ detail.reason }}</span>
            </div>
            <div class="kv-i">
              <span class="k">预约时间</span
              ><span class="v">{{ detail.date }} {{ detail.time }}</span>
            </div>
            <div class="kv-i">
              <span class="k">通行区域</span><span class="v">{{ detail.area }}</span>
            </div>
            <div class="kv-i">
              <span class="k">绑定车牌</span><span class="v">{{ detail.plate || '未登记' }}</span>
            </div>
            <div class="kv-i">
              <span class="k">随行人数</span><span class="v">{{ detail.companions }} 人</span>
            </div>
            <div class="kv-i">
              <span class="k">状态</span
              ><span class="badge" :class="statusClass(detail.status)">{{ detail.status }}</span>
            </div>
          </div>

          <div
            style="font-size: 13px; font-weight: 700; margin: 18px 0 10px; color: var(--ink-900)"
          >
            访问链路回溯
          </div>
          <div class="timeline">
            <div class="tl-item done">
              <div class="tl-t">预约提交</div>
              <div class="tl-s">{{ detail.createTime }} · 线上自助</div>
            </div>
            <div class="tl-item done">
              <div class="tl-t">审批{{ detail.status === '待审批' ? '中' : '通过' }}</div>
              <div class="tl-s">
                {{
                  detail.status === '待审批'
                    ? '等待被访人确认'
                    : '被访人 ' + detail.host + ' 已确认'
                }}
              </div>
            </div>
            <div
              class="tl-item"
              :class="{ done: ['已签到', '在访', '已签离'].includes(detail.status) }"
            >
              <div class="tl-t">到达核验</div>
              <div class="tl-s">
                {{
                  ['已签到', '在访', '已签离'].includes(detail.status) ? '人证核验通过' : '未到达'
                }}
              </div>
            </div>
            <div
              class="tl-item"
              :class="{ done: detail.status === '在访' || detail.status === '已签离' }"
            >
              <div class="tl-t">通行在访</div>
              <div class="tl-s">{{ detail.status === '在访' ? '正在园区内' : '未开始' }}</div>
            </div>
            <div class="tl-item" :class="{ done: detail.status === '已签离' }">
              <div class="tl-t">签离归档</div>
              <div class="tl-s">{{ detail.status === '已签离' ? '已签离并归档' : '待签离' }}</div>
            </div>
          </div>
        </div>
        <div class="mf">
          <button class="btn ghost sm" @click="detail = null">关闭</button>
          <button v-if="detail.status === '待审批'" class="btn secondary sm" @click="goApproval">
            审批
          </button>
          <button v-if="['在访', '已签到'].includes(detail.status)" class="btn primary sm">
            联动签离
          </button>
        </div>
      </div>
    </div>

    <!-- 手动新增访客弹窗 -->
    <div v-if="showAdd" class="modal-mask" @click.self="closeAdd">
      <div class="modal" style="width: 580px">
        <div class="mh">手动新增访客</div>
        <div class="mb">
          <div class="form-grid">
            <div class="form-item">
              <label>访客姓名 <span class="req">*</span></label>
              <input v-model="addForm.name" placeholder="如：王小明" />
            </div>
            <div class="form-item">
              <label>公司 / 单位</label>
              <input v-model="addForm.company" placeholder="如：中科云智" />
            </div>
            <div class="form-item">
              <label>被访人 <span class="req">*</span></label>
              <input v-model="addForm.host" placeholder="如：李工" />
            </div>
            <div class="form-item">
              <label>被访人部门</label>
              <input v-model="addForm.hostDept" placeholder="如：研发部" />
            </div>
            <div class="form-item">
              <label>来访事由 <span class="req">*</span></label>
              <input v-model="addForm.reason" placeholder="如：项目技术交流" />
            </div>
            <div class="form-item">
              <label>通行区域</label>
              <select v-model="addForm.area">
                <option>研发楼 1F</option>
                <option>研发楼 2F</option>
                <option>研发楼 3F</option>
                <option>总部 1F</option>
                <option>总部 3F</option>
                <option>采购楼 2F</option>
                <option>仓储楼 1F</option>
              </select>
            </div>
            <div class="form-item">
              <label>预约日期</label>
              <input v-model="addForm.date" placeholder="08-13" />
            </div>
            <div class="form-item">
              <label>预约时间</label>
              <input v-model="addForm.time" placeholder="10:00" />
            </div>
            <div class="form-item">
              <label>车牌号</label>
              <input v-model="addForm.plate" placeholder="选填，如 沪A·8X9K2" />
            </div>
            <div class="form-item">
              <label>随行人数</label>
              <input v-model.number="addForm.companions" type="number" min="0" />
            </div>
          </div>
          <div style="font-size: 12.5px; color: var(--ink-400); margin-top: 10px">
            新增后状态为「待审批」，将写入共享后端，小程序 / 审批台可同步看到。
          </div>
        </div>
        <div class="mf">
          <button class="btn ghost sm" @click="closeAdd">取消</button>
          <button class="btn primary sm" :disabled="addSaving" @click="submitAdd">
            {{ addSaving ? '提交中...' : '确认新增' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
