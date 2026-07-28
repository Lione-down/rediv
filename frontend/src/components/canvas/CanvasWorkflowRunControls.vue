<script setup lang="ts">
import { computed } from 'vue'
import { LoaderCircle, Play, ShieldCheck, Square } from 'lucide-vue-next'
import type { CanvasNode } from '../../types/canvas'
import {
  resolveWorkflowRunInstanceId,
  useWorkflowRun,
} from '../../modules/template/use-workflow-run'


const props = withDefaults(defineProps<{
  canvasId?: string
  node: CanvasNode
  projectId?: string
  readonly?: boolean
}>(), {
  canvasId: '',
  projectId: '',
  readonly: false,
})

const instanceId = computed(() => resolveWorkflowRunInstanceId(props.node.contentData))
const workflow = useWorkflowRun({
  canvasId: () => props.canvasId,
  instanceId: () => instanceId.value,
  isReadOnly: () => props.readonly,
  projectId: () => props.projectId,
})
const statusLabel = computed(() => {
  const status = workflow.run.value?.status
  if (status === 'queued' || status === 'ready' || status === 'submitting') {
    return '工作流排队中'
  }
  if (status === 'running' || status === 'persisting') return '工作流运行中'
  if (status === 'succeeded') return '工作流已完成'
  if (status === 'failed') return '工作流运行失败'
  if (status === 'cancelled') return '工作流已取消'
  if (workflow.preflight.value?.executable) return '运行预检通过'
  return '尚未运行预检'
})
</script>

<template>
  <section
    v-if="workflow.isAvailable.value"
    class="workflow-run-controls"
    role="region"
    aria-label="工作流运行"
  >
    <div class="workflow-run-controls__heading">
      <span><ShieldCheck :size="15" aria-hidden="true" />工作流运行</span>
      <strong>{{ statusLabel }}</strong>
    </div>
    <p>只会在你确认预检并显式启动后创建 durable jobs；刷新页面只恢复运行状态。</p>
    <template v-if="!readonly">
      <label>
        <input
          type="checkbox"
          :checked="workflow.costConfirmed.value"
          :disabled="workflow.isSubmitting.value"
          aria-label="确认运行预计费用"
          @change="workflow.setCostConfirmed(($event.target as HTMLInputElement).checked)"
        />
        <span>确认运行预计费用</span>
      </label>
      <div class="workflow-run-controls__actions">
        <button
          type="button"
          :disabled="workflow.isSubmitting.value"
          @click="workflow.check"
        >
          <LoaderCircle
            v-if="workflow.isSubmitting.value"
            :size="14"
            class="is-spinning"
            aria-hidden="true"
          />
          <ShieldCheck v-else :size="14" aria-hidden="true" />
          检查工作流运行
        </button>
        <button
          type="button"
          :disabled="!workflow.canStart.value"
          @click="workflow.start"
        >
          <Play :size="14" aria-hidden="true" />
          显式启动工作流
        </button>
        <button
          v-if="workflow.canCancel.value"
          type="button"
          @click="workflow.cancel"
        >
          <Square :size="13" aria-hidden="true" />
          取消工作流
        </button>
      </div>
    </template>
    <p v-if="workflow.error.value" class="workflow-run-controls__error" role="alert">
      {{ workflow.error.value }}
    </p>
  </section>
</template>

<style scoped lang="scss">
.workflow-run-controls {
  display: grid;
  gap: 9px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--v2-border-subtle);
  background: var(--v2-surface-1);
}
.workflow-run-controls__heading,
.workflow-run-controls__heading span,
.workflow-run-controls label,
.workflow-run-controls__actions button {
  display: flex;
  align-items: center;
}
.workflow-run-controls__heading {
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
}
.workflow-run-controls__heading span { gap: 6px; color: var(--v2-text-secondary); }
.workflow-run-controls__heading strong { color: var(--v2-accent); }
.workflow-run-controls p {
  margin: 0;
  color: var(--v2-text-muted);
  font-size: 10px;
  line-height: 1.5;
}
.workflow-run-controls label { gap: 8px; font-size: 11px; }
.workflow-run-controls input { width: 16px; height: 16px; accent-color: var(--v2-accent); }
.workflow-run-controls__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.workflow-run-controls__actions button {
  min-width: 0;
  min-height: 36px;
  justify-content: center;
  gap: 6px;
  padding: 5px 8px;
  border: 1px solid var(--v2-border-standard);
  background: var(--v2-surface-2);
  font-size: 10px;
}
.workflow-run-controls__actions button:nth-child(2) {
  color: var(--v2-text-on-accent);
  background: var(--v2-accent);
}
.workflow-run-controls__actions button:last-child:nth-child(3) {
  grid-column: 1 / -1;
  color: var(--v2-warning);
  background: transparent;
}
.workflow-run-controls__error { color: var(--v2-danger) !important; }
</style>
