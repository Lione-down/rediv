<script setup lang="ts">
import { CirclePause, CirclePlay, ListChecks, X } from 'lucide-vue-next'
import type { WorkflowMockRun, WorkflowPreflight } from '../../modules/canvas/workflow-orchestration'

defineProps<{
  error: string
  plan: WorkflowPreflight | null
  run: WorkflowMockRun | null
}>()
const emit = defineEmits<{
  advance: []
  cancel: []
  close: []
  resume: []
  start: []
}>()
</script>

<template>
  <section class="workflow-batch-panel" role="dialog" aria-modal="true" aria-label="批处理预检">
    <header>
      <div>
        <span class="workflow-batch-panel__eyebrow"><ListChecks :size="14" aria-hidden="true" /> Workflow Template v1</span>
        <h2>批处理预检</h2>
        <p>仅为当前画布生成节点生成 mock 执行计划；不会调用 provider、扣减 quota 或修改画布。</p>
      </div>
      <button type="button" aria-label="关闭批处理预检" @click="emit('close')"><X :size="17" aria-hidden="true" /></button>
    </header>

    <p v-if="error" class="workflow-batch-panel__alert" role="alert">{{ error }}</p>
    <p v-else-if="plan && !plan.executable" class="workflow-batch-panel__alert" role="alert">
      {{ plan.errors[0]?.message ?? '预检未通过。' }}
    </p>

    <template v-if="plan?.executable">
      <div class="workflow-batch-panel__estimate" aria-label="Quota 估算">
        <span>预估单位</span>
        <strong>{{ plan.estimate.total }}</strong>
        <small>图片 {{ plan.estimate.image }} · 视频 {{ plan.estimate.video }} · 不保留、不授权付费</small>
      </div>
      <ol class="workflow-batch-panel__steps" aria-label="确定性依赖顺序">
        <li v-for="step in plan.steps" :key="step.node_id">
          <span>{{ step.order }}</span>
          <div><strong>{{ step.media_type === 'image' ? '图片生成' : '视频生成' }}</strong><small>{{ step.node_id }}</small></div>
          <em v-if="step.depends_on.length">依赖 {{ step.depends_on.join('、') }}</em>
          <em v-else>无上游批依赖</em>
          <b v-if="run">{{ run.steps.find((item) => item.node_id === step.node_id)?.state ?? 'queued' }}</b>
        </li>
      </ol>
    </template>

    <footer>
      <p v-if="run" role="status"><CirclePause v-if="run.state === 'paused'" :size="14" aria-hidden="true" /><CirclePlay v-else :size="14" aria-hidden="true" />Mock run：{{ run.state }}</p>
      <button v-if="!run" type="button" class="is-primary" :disabled="!plan?.executable" @click="emit('start')">开始 mock 批处理</button>
      <template v-else-if="run.state === 'running'">
        <button type="button" @click="emit('advance')">推进 mock 步骤</button>
        <button type="button" class="is-danger" @click="emit('cancel')">取消 mock 批处理</button>
      </template>
      <button v-else-if="run.state === 'paused'" type="button" class="is-primary" @click="emit('resume')">显式恢复 mock 批处理</button>
    </footer>
  </section>
</template>

<style scoped lang="scss">
.workflow-batch-panel { position: fixed; z-index: 72; top: max(88px, calc(env(safe-area-inset-top) + 72px)); right: 24px; display: grid; width: min(408px, calc(100vw - 32px)); max-height: calc(100dvh - 118px); gap: var(--v2-space-3); padding: var(--v2-space-4); overflow-y: auto; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-lg); color: var(--v2-text-primary); background: var(--v2-surface-3); box-shadow: var(--v2-shadow-prominent); }
.workflow-batch-panel header { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--v2-space-3); }
.workflow-batch-panel h2 { margin: 3px 0; font-size: var(--v2-font-size-title); }
.workflow-batch-panel header p, .workflow-batch-panel small, .workflow-batch-panel em { color: var(--v2-text-secondary); font-size: var(--v2-font-size-caption); font-style: normal; }
.workflow-batch-panel__eyebrow, .workflow-batch-panel footer p { display: inline-flex; align-items: center; gap: 5px; color: var(--v2-accent-hover); font-size: 11px; }
.workflow-batch-panel header button { width: var(--v2-control-min-size); height: var(--v2-control-min-size); border: 0; border-radius: var(--v2-radius-sm); color: var(--v2-text-muted); background: transparent; cursor: pointer; }
.workflow-batch-panel__alert { margin: 0; padding: var(--v2-space-2); border-radius: var(--v2-radius-sm); color: var(--v2-danger); background: var(--v2-surface-2); font-size: var(--v2-font-size-caption); }
.workflow-batch-panel__estimate { display: grid; grid-template-columns: auto 1fr; gap: 2px var(--v2-space-2); padding: var(--v2-space-3); border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-md); background: var(--v2-surface-1); }
.workflow-batch-panel__estimate strong { font-size: 22px; line-height: 1; }.workflow-batch-panel__estimate small { grid-column: 1 / -1; }
.workflow-batch-panel__steps { display: grid; gap: var(--v2-space-2); margin: 0; padding: 0; list-style: none; }
.workflow-batch-panel__steps li { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 0 var(--v2-space-2); padding: var(--v2-space-2); border-radius: var(--v2-radius-sm); background: var(--v2-surface-1); }
.workflow-batch-panel__steps li > span { display: grid; width: 22px; height: 22px; place-items: center; border-radius: 50%; color: var(--v2-accent-hover); background: var(--v2-accent-soft); font-size: 11px; }.workflow-batch-panel__steps strong, .workflow-batch-panel__steps small, .workflow-batch-panel__steps em, .workflow-batch-panel__steps b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.workflow-batch-panel__steps small, .workflow-batch-panel__steps em { display: block; }.workflow-batch-panel__steps em, .workflow-batch-panel__steps b { grid-column: 2; }.workflow-batch-panel__steps b { color: var(--v2-accent-hover); font-size: 11px; text-transform: uppercase; }
.workflow-batch-panel footer { display: flex; flex-wrap: wrap; align-items: center; gap: var(--v2-space-2); }.workflow-batch-panel footer p { width: 100%; margin: 0; color: var(--v2-text-secondary); }
.workflow-batch-panel footer button { min-height: var(--v2-control-min-size); padding: 0 var(--v2-space-3); border: 1px solid var(--v2-border-strong); border-radius: var(--v2-radius-sm); color: var(--v2-text-primary); background: var(--v2-surface-1); font: inherit; font-size: var(--v2-font-size-caption); cursor: pointer; }.workflow-batch-panel footer .is-primary { border-color: var(--v2-accent); color: var(--v2-text-on-accent); background: var(--v2-accent); }.workflow-batch-panel footer .is-danger { color: var(--v2-danger); }.workflow-batch-panel button:disabled { cursor: not-allowed; opacity: .5; }.workflow-batch-panel button:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .workflow-batch-panel * { scroll-behavior: auto; } }
</style>
