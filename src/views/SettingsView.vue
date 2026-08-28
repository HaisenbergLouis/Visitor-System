<script setup lang="ts">
import { ref } from 'vue'
import { relDate } from '@/utils/date'

const tabs = ['组织与楼宇', '通知模板', '日志与审计', '基础配置'] as const
const tab = ref<(typeof tabs)[number]>('组织与楼宇')

const notify = ref({ wx: true, sms: true, workWeixin: false })

// 操作日志（时间动态生成，围绕今天）
const logs = [
  { user: 'admin', action: '通过审批 V20260812002', time: `${relDate(0)} 09:05` },
  { user: '前台01', action: '核验放行 王小明', time: `${relDate(0)} 14:05` },
  { user: 'admin', action: '导出访客报表（脱敏）', time: `${relDate(0)} 11:30` },
  { user: '安保02', action: '处置黑名单命中 赵强', time: `${relDate(-1)} 10:12` },
]
const lastSync = `${relDate(0)} 02:00`
</script>

<template>
  <div>
    <div class="card">
      <div class="toolbar" style="margin-bottom: 0">
        <button v-for="t in tabs" :key="t" class="btn sm" :class="tab === t ? 'primary' : 'ghost'" @click="tab = t">{{ t }}</button>
      </div>
    </div>

    <!-- 组织与楼宇 -->
    <div v-if="tab === '组织与楼宇'" class="card" style="margin-top: 16px">
      <div class="card-h"><h3>园区 / 楼宇 / 区域层级</h3><button class="btn primary sm">+ 新增楼宇</button></div>
      <div class="dtable-wrap">
        <table class="dtable">
          <thead><tr><th>园区</th><th>楼宇</th><th>区域</th><th>操作</th></tr></thead>
          <tbody>
            <tr><td>南京软件谷</td><td>研发楼</td><td>1F 访客区 / 2F 办公区 / 3F 实验室</td><td><span class="link">编辑</span></td></tr>
            <tr><td>南京软件谷</td><td>总部</td><td>1F 大堂 / 3F 市场部 / 5F 品牌部 / 6F 财务部</td><td><span class="link">编辑</span></td></tr>
            <tr><td>南京软件谷</td><td>仓储楼</td><td>1F 收货区 / 2F 仓库</td><td><span class="link">编辑</span></td></tr>
          </tbody>
        </table>
      </div>
      <div style="font-size: 12.5px; color: var(--ink-500); margin-top: 12px">🔗 部门通讯录：与 HR 系统每日 02:00 定时同步（上次同步 {{ lastSync }} 成功）</div>
    </div>

    <!-- 通知模板 -->
    <div v-else-if="tab === '通知模板'" class="card" style="margin-top: 16px">
      <div class="card-h"><h3>消息通道与模板</h3></div>
      <div style="display: flex; gap: 20px; margin-bottom: 16px">
        <label style="display: flex; align-items: center; gap: 6px; font-size: 13.5px"><input v-model="notify.wx" type="checkbox" /> 微信服务通知</label>
        <label style="display: flex; align-items: center; gap: 6px; font-size: 13.5px"><input v-model="notify.sms" type="checkbox" /> 短信</label>
        <label style="display: flex; align-items: center; gap: 6px; font-size: 13.5px"><input v-model="notify.workWeixin" type="checkbox" /> 企业微信</label>
      </div>
      <div class="dtable-wrap">
        <table class="dtable">
          <thead><tr><th>模板</th><th>触发时机</th><th>状态</th></tr></thead>
          <tbody>
            <tr><td>预约提交成功</td><td>访客提交后</td><td><span class="badge s">启用</span></td></tr>
            <tr><td>审批结果通知</td><td>通过/拒绝/改期</td><td><span class="badge s">启用</span></td></tr>
            <tr><td>访客到达提醒</td><td>核验通过时</td><td><span class="badge s">启用</span></td></tr>
            <tr><td>停车超时提醒</td><td>超时前 30 分钟</td><td><span class="badge w">待配置</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 日志与审计 -->
    <div v-else-if="tab === '日志与审计'" class="card" style="margin-top: 16px">
      <div class="card-h"><h3>操作日志</h3><button class="btn ghost sm">导出审计日志</button></div>
      <div class="dtable-wrap">
        <table class="dtable">
          <thead><tr><th>操作人</th><th>动作</th><th>时间</th></tr></thead>
          <tbody>
            <tr v-for="(l, i) in logs" :key="i"><td>{{ l.user }}</td><td>{{ l.action }}</td><td>{{ l.time }}</td></tr>
          </tbody>
        </table>
      </div>
      <div style="font-size: 12.5px; color: var(--ink-500); margin-top: 12px">🔒 人脸/证件数据加密存储，支持一键注销并级联删除，满足等保与《个人信息保护法》要求</div>
    </div>

    <!-- 基础配置 -->
    <div v-else class="card" style="margin-top: 16px">
      <div class="card-h"><h3>基础配置</h3></div>
      <div class="form-grid">
        <div class="form-item"><label>系统名称</label><input value="智慧访客管理系统" /></div>
        <div class="form-item"><label>品牌 Logo</label><input value="logo.png（上传）" /></div>
        <div class="form-item"><label>时区</label><select><option>UTC+8（中国标准时间）</option></select></div>
        <div class="form-item"><label>默认语言</label><select><option>简体中文</option></select></div>
        <div class="form-item"><label>数据留存期</label><select><option>180 天</option><option>365 天</option><option>永久</option></select></div>
        <div class="form-item"><label>密码策略</label><input value="8 位以上，含大小写与数字；连续失败 5 次锁定" /></div>
      </div>
      <button class="btn primary sm" style="margin-top: 14px">保存配置</button>
    </div>
  </div>
</template>
