<script setup lang="ts">
import { useDialogs, resolveDialog } from '@/utils/confirm'

const dialogs = useDialogs()
</script>

<template>
  <div v-for="d in dialogs" :key="d.id" class="modal-mask" @click.self="resolveDialog(d.id, false)">
    <div class="modal" style="width: 420px">
      <div class="mh">{{ d.title }}</div>
      <div class="mb" style="line-height: 1.7; color: var(--ink-600); white-space: pre-line">
        {{ d.message }}
      </div>
      <div class="mf">
        <button class="btn ghost sm" @click="resolveDialog(d.id, false)">
          {{ d.cancelText || '取消' }}
        </button>
        <button class="btn sm" :class="d.danger ? 'danger' : 'primary'" @click="resolveDialog(d.id, true)">
          {{ d.okText || '确认' }}
        </button>
      </div>
    </div>
  </div>
</template>
