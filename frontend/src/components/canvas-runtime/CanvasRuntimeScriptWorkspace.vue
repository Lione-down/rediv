<script setup lang="ts">
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Columns3,
  Plus,
  Sparkles,
} from 'lucide-vue-next'
import type { CanvasNode } from '../../types/canvas'

defineProps<{
  node: CanvasNode
}>()

const emit = defineEmits<{
  close: []
}>()

const rows = [
  {
    scene: '01',
    image: '远景：清晨的海岸线，潮水缓慢退去。',
    dialogue: '有些旅程，从一次回头开始。',
    duration: '4s',
  },
  {
    scene: '02',
    image: '中景：人物沿沙滩前行，远处灯塔第一次出现。',
    dialogue: '那束光，像是在等一个迟到的人。',
    duration: '5s',
  },
  {
    scene: '03',
    image: '近景：人物停下，风吹起衣角与散落的照片。',
    dialogue: '我们以为忘记了，其实只是没有再提起。',
    duration: '6s',
  },
] as const
</script>

<template>
  <section
    class="runtime-script-workspace"
    data-script-workspace
    :aria-label="`${node.title} 结构化脚本`"
  >
    <header class="runtime-script-workspace__header">
      <button type="button" aria-label="返回画布" @click="emit('close')">
        <ArrowLeft :size="18" aria-hidden="true" />
      </button>
      <div>
        <span>结构化脚本</span>
        <strong>{{ node.title }}</strong>
      </div>
      <div class="runtime-script-workspace__header-actions">
        <button type="button">
          <Columns3 :size="16" aria-hidden="true" />
          列设置
        </button>
        <button type="button">
          导出
          <ChevronDown :size="15" aria-hidden="true" />
        </button>
      </div>
    </header>

    <div class="runtime-script-workspace__progress" aria-label="脚本阶段">
      <span class="is-complete"><CheckCircle2 :size="15" aria-hidden="true" /> 故事梗概</span>
      <i aria-hidden="true"></i>
      <span class="is-current"><Sparkles :size="15" aria-hidden="true" /> 分镜脚本</span>
      <i aria-hidden="true"></i>
      <span>镜头确认</span>
    </div>

    <main>
      <div class="runtime-script-workspace__summary">
        <div>
          <small>脚本内容</small>
          <p>{{ node.content || '尚未填写脚本简介。' }}</p>
        </div>
        <button type="button">
          <Sparkles :size="15" aria-hidden="true" />
          补全分镜
        </button>
      </div>

      <div class="runtime-script-workspace__table-shell">
        <table>
          <thead>
            <tr>
              <th scope="col">场景</th>
              <th scope="col">画面</th>
              <th scope="col">旁白 / 对白</th>
              <th scope="col">时长</th>
              <th scope="col"><span class="sr-only">操作</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.scene">
              <td><strong>{{ row.scene }}</strong></td>
              <td><textarea :value="row.image" rows="3" aria-label="画面描述"></textarea></td>
              <td><textarea :value="row.dialogue" rows="3" aria-label="旁白或对白"></textarea></td>
              <td><input :value="row.duration" aria-label="镜头时长" /></td>
              <td><button type="button" aria-label="镜头操作">•••</button></td>
            </tr>
          </tbody>
        </table>
        <button type="button" class="runtime-script-workspace__add">
          <Plus :size="15" aria-hidden="true" />
          添加镜头
        </button>
      </div>
    </main>
  </section>
</template>

<style scoped lang="scss">
.runtime-script-workspace {
  position: fixed;
  z-index: 50;
  inset: 0;
  display: grid;
  grid-template-rows: 64px auto minmax(0, 1fr);
  overflow: hidden;
  color: var(--v2-text-primary);
  background: var(--v2-canvas);
}

.runtime-script-workspace__header {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 0 18px;
  border-bottom: 1px solid var(--v2-border-subtle);
  background: var(--v2-surface-1);
}

.runtime-script-workspace__header > button,
.runtime-script-workspace__header-actions button,
.runtime-script-workspace__summary button,
.runtime-script-workspace__add {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 11px;
  border: 1px solid var(--v2-border-subtle);
  border-radius: var(--v2-radius-sm);
  color: var(--v2-text-secondary);
  background: var(--v2-surface-2);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

.runtime-script-workspace__header > button {
  width: 40px;
  padding: 0;
}

.runtime-script-workspace__header > div:nth-child(2) {
  display: grid;
  gap: 2px;
}

.runtime-script-workspace__header span,
.runtime-script-workspace__header small {
  color: var(--v2-text-muted);
  font-size: 10px;
}

.runtime-script-workspace__header strong {
  font-size: 13px;
}

.runtime-script-workspace__header-actions {
  display: flex;
  gap: 7px;
}

.runtime-script-workspace__progress {
  display: flex;
  min-height: 54px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-bottom: 1px solid var(--v2-border-subtle);
  color: var(--v2-text-muted);
  background: var(--v2-surface-1);
  font-size: 11px;
}

.runtime-script-workspace__progress span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.runtime-script-workspace__progress i {
  width: 46px;
  height: 1px;
  background: var(--v2-border-standard);
}

.runtime-script-workspace__progress .is-complete {
  color: var(--v2-success);
}

.runtime-script-workspace__progress .is-current {
  color: var(--v2-accent-hover);
}

.runtime-script-workspace main {
  display: grid;
  align-content: start;
  gap: 16px;
  padding: 22px;
  overflow: auto;
}

.runtime-script-workspace__summary,
.runtime-script-workspace__table-shell {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.runtime-script-workspace__summary {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  padding: 16px;
  border: 1px solid var(--v2-border-subtle);
  border-radius: var(--v2-radius-md);
  background: var(--v2-surface-1);
}

.runtime-script-workspace__summary small {
  color: var(--v2-text-muted);
  font-size: 10px;
}

.runtime-script-workspace__summary p {
  margin: 5px 0 0;
  color: var(--v2-text-secondary);
  font-size: 12px;
}

.runtime-script-workspace__table-shell {
  overflow: hidden;
  border: 1px solid var(--v2-border-subtle);
  border-radius: var(--v2-radius-md);
  background: var(--v2-surface-1);
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th,
td {
  padding: 10px;
  border-right: 1px solid var(--v2-border-subtle);
  border-bottom: 1px solid var(--v2-border-subtle);
  color: var(--v2-text-secondary);
  font-size: 11px;
  text-align: left;
  vertical-align: top;
}

th:first-child,
td:first-child {
  width: 62px;
}

th:nth-child(4),
td:nth-child(4) {
  width: 86px;
}

th:last-child,
td:last-child {
  width: 44px;
  border-right: 0;
}

th {
  color: var(--v2-text-muted);
  background: var(--v2-surface-2);
  font-weight: var(--v2-font-weight-medium);
}

textarea,
input {
  box-sizing: border-box;
  width: 100%;
  resize: none;
  border: 0;
  outline: 0;
  color: var(--v2-text-primary);
  background: transparent;
  font: inherit;
  line-height: 1.55;
}

td button {
  border: 0;
  color: var(--v2-text-muted);
  background: transparent;
  cursor: pointer;
}

.runtime-script-workspace__add {
  margin: 10px;
  border-style: dashed;
  background: transparent;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.runtime-script-workspace :focus-visible {
  outline: 2px solid var(--v2-focus-ring);
  outline-offset: 2px;
}
</style>
