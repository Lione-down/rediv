<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  Check,
  Copy,
  GitCompareArrows,
  Link2Off,
  LoaderCircle,
  ShieldCheck,
  X,
} from 'lucide-vue-next'
import type { CanvasNode } from '../../types/canvas'
import { resolveWorkflowRunInstanceId } from '../../modules/template/use-workflow-run'
import { useWorkflowTemplateLifecycle } from '../../modules/template/use-workflow-template-lifecycle'

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

type PendingAction = 'upgrade' | 'clone' | 'detach' | ''

function lifecycleMarker() {
  const marker = props.node.contentData?.workflow_template_instance
  if (!marker || typeof marker !== 'object' || Array.isArray(marker)) return null
  return marker as Record<string, unknown>
}

function lineageMarker() {
  const lineage = props.node.contentData?.workflow_template_lineage
  if (!lineage || typeof lineage !== 'object' || Array.isArray(lineage)) return null
  return lineage as Record<string, unknown>
}

const instanceId = computed(() => {
  const markerId = lifecycleMarker()?.instance_id
  return typeof markerId === 'string'
    ? markerId
    : resolveWorkflowRunInstanceId(props.node.contentData)
})
const templateVersion = computed(() => {
  const version = lifecycleMarker()?.template_version ?? lineageMarker()?.template_version
  return typeof version === 'number' && Number.isInteger(version) ? version : 0
})
const detached = computed(() => lifecycleMarker()?.managed === false)
const pendingAction = ref<PendingAction>('')
const lifecycle = useWorkflowTemplateLifecycle({
  canvasId: () => props.canvasId,
  currentVersion: () => templateVersion.value,
  instanceId: () => instanceId.value,
  isDetached: () => detached.value,
  isReadOnly: () => props.readonly,
  projectId: () => props.projectId,
})
const targetVersion = computed(() => lifecycle.diff.value?.target_version ?? 0)

function begin(action: Exclude<PendingAction, ''>) {
  pendingAction.value = action
}

function cancel() {
  pendingAction.value = ''
}

async function confirm() {
  const action = pendingAction.value
  if (!action) return
  if (action === 'upgrade') await lifecycle.upgrade()
  else if (action === 'clone') await lifecycle.clone()
  else await lifecycle.detach()
  if (!lifecycle.error.value) pendingAction.value = ''
}

watch(instanceId, cancel)
</script>

<template>
  <section
    v-if="instanceId && templateVersion"
    class="workflow-template-lifecycle"
    role="region"
    aria-label="模板版本管理"
  >
    <header>
      <span><GitCompareArrows :size="15" aria-hidden="true" />模板版本管理</span>
      <strong>当前版本 {{ lifecycle.currentVersion.value }}</strong>
    </header>

    <p v-if="lifecycle.isDetached.value" class="workflow-template-lifecycle__detached">
      <Link2Off :size="14" aria-hidden="true" />
      已脱离模板管理，Canvas typed content 保留
    </p>
    <template v-else>
      <p v-if="lifecycle.isLoading.value" class="workflow-template-lifecycle__status">
        <LoaderCircle :size="14" class="is-spinning" aria-hidden="true" />
        正在比对下一个发布版本
      </p>
      <p
        v-else-if="lifecycle.diff.value?.compatible"
        class="workflow-template-lifecycle__status is-compatible"
      >
        <Check :size="14" aria-hidden="true" />
        可兼容升级到版本 {{ lifecycle.diff.value.target_version }}
      </p>
      <p v-else-if="lifecycle.diff.value" class="workflow-template-lifecycle__status is-blocked">
        下一个版本不兼容，当前实例保持不变
      </p>
      <p v-else class="workflow-template-lifecycle__status">当前没有可审阅的后续版本</p>

      <section
        v-if="lifecycle.diff.value?.changes.length"
        class="workflow-template-lifecycle__changes"
        aria-label="版本变更摘要"
      >
        <div>
          <strong>版本变更摘要</strong>
          <span>{{ lifecycle.diff.value.changes.length }} 项</span>
        </div>
        <ul>
          <li
            v-for="change in lifecycle.diff.value.changes"
            :key="`${change.path}:${change.kind}`"
          >
            <span>{{ change.summary }}</span>
            <small :class="{ 'is-blocked': !change.compatible }">
              {{ change.compatible ? '可兼容' : '需处理' }}
            </small>
          </li>
        </ul>
      </section>

      <section
        v-if="lifecycle.diff.value?.blocking_reasons.length"
        class="workflow-template-lifecycle__blockers"
        aria-label="不兼容原因"
      >
        <strong>不兼容原因</strong>
        <ul>
          <li
            v-for="blocker in lifecycle.diff.value.blocking_reasons"
            :key="`${blocker.code}:${blocker.path}`"
          >
            {{ blocker.message }}
          </li>
        </ul>
      </section>

      <section
        v-if="lifecycle.localOverrides.value.length"
        class="workflow-template-lifecycle__overrides"
        aria-label="本地修改与受保护字段"
      >
        <div>
          <ShieldCheck :size="14" aria-hidden="true" />
          <strong>本地修改受保护</strong>
          <span>{{ lifecycle.localOverrides.value.length }} 项</span>
        </div>
        <ul>
          <li
            v-for="override in lifecycle.localOverrides.value"
            :key="`${override.path}:${override.kind}`"
          >
            <span>{{ override.display_name }}</span>
            <small>{{ override.kind }}</small>
          </li>
        </ul>
      </section>

      <p v-if="readonly" class="workflow-template-lifecycle__review">仅支持审阅</p>

      <div v-else-if="!pendingAction" class="workflow-template-lifecycle__actions">
        <button
          v-if="lifecycle.canUpgrade.value"
          type="button"
          :disabled="lifecycle.isSubmitting.value"
          @click="begin('upgrade')"
        >
          <GitCompareArrows :size="14" aria-hidden="true" />
          应用兼容升级
        </button>
        <button
          type="button"
          :disabled="!lifecycle.canMutate.value"
          @click="begin('clone')"
        >
          <Copy :size="14" aria-hidden="true" />
          复制实例
        </button>
        <button
          type="button"
          :disabled="!lifecycle.canMutate.value"
          @click="begin('detach')"
        >
          <Link2Off :size="14" aria-hidden="true" />
          脱离模板
        </button>
      </div>

      <div v-else-if="!readonly" class="workflow-template-lifecycle__confirmation">
        <p v-if="pendingAction === 'upgrade'">
          升级只应用 compatible contract additions，本地修改不会被覆盖。
        </p>
        <p v-else-if="pendingAction === 'clone'">
          创建新的稳定 instance 与 lineage，不共享后续修改。
        </p>
        <p v-else>
          解除模板管理，但保留当前 Canvas 内容与历史。
        </p>
        <div>
          <button type="button" :disabled="lifecycle.isSubmitting.value" @click="cancel">
            <X :size="14" aria-hidden="true" />
            取消
          </button>
          <button type="button" :disabled="lifecycle.isSubmitting.value" @click="confirm">
            <LoaderCircle
              v-if="lifecycle.isSubmitting.value"
              :size="14"
              class="is-spinning"
              aria-hidden="true"
            />
            <Check v-else :size="14" aria-hidden="true" />
            <template v-if="pendingAction === 'upgrade'">确认升级到版本 {{ targetVersion }}</template>
            <template v-else-if="pendingAction === 'clone'">确认复制实例</template>
            <template v-else>确认脱离模板</template>
          </button>
        </div>
      </div>
    </template>

    <p v-if="lifecycle.error.value" class="workflow-template-lifecycle__error" role="alert">
      {{ lifecycle.error.value }}
    </p>
  </section>
</template>

<style scoped lang="scss">
.workflow-template-lifecycle {
  display: grid;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--v2-border-subtle);
  background: var(--v2-surface-1);
}

.workflow-template-lifecycle header,
.workflow-template-lifecycle header span,
.workflow-template-lifecycle__status,
.workflow-template-lifecycle__detached,
.workflow-template-lifecycle__changes > div,
.workflow-template-lifecycle__overrides > div,
.workflow-template-lifecycle__actions button,
.workflow-template-lifecycle__confirmation button {
  display: flex;
  align-items: center;
}

.workflow-template-lifecycle header {
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
}

.workflow-template-lifecycle header span {
  gap: 6px;
  color: var(--v2-text-secondary);
}

.workflow-template-lifecycle header strong {
  color: var(--v2-accent);
  font-variant-numeric: tabular-nums;
}

.workflow-template-lifecycle p {
  margin: 0;
  color: var(--v2-text-muted);
  font-size: 10px;
  line-height: 1.6;
}

.workflow-template-lifecycle__status,
.workflow-template-lifecycle__detached {
  min-height: 28px;
  gap: 7px;
  padding: 5px 8px;
  border-radius: var(--v2-radius-sm);
  background: var(--v2-surface-2);
}

.workflow-template-lifecycle__status.is-compatible {
  color: var(--v2-success);
}

.workflow-template-lifecycle__status.is-blocked,
.workflow-template-lifecycle__detached {
  color: var(--v2-warning);
}

.workflow-template-lifecycle__changes,
.workflow-template-lifecycle__blockers,
.workflow-template-lifecycle__overrides {
  display: grid;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--v2-border-standard);
  border-radius: var(--v2-radius-md);
  background: var(--v2-surface-2);
}

.workflow-template-lifecycle__changes > div,
.workflow-template-lifecycle__overrides > div {
  gap: 6px;
  color: var(--v2-text-secondary);
  font-size: 10px;
}

.workflow-template-lifecycle__changes > div span,
.workflow-template-lifecycle__overrides > div span {
  margin-left: auto;
  color: var(--v2-text-muted);
}

.workflow-template-lifecycle__changes ul,
.workflow-template-lifecycle__blockers ul,
.workflow-template-lifecycle__overrides ul {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.workflow-template-lifecycle__changes li,
.workflow-template-lifecycle__overrides li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  color: var(--v2-text-primary);
  font-size: 11px;
}

.workflow-template-lifecycle__changes small,
.workflow-template-lifecycle__overrides small {
  color: var(--v2-text-muted);
  font-size: 9px;
}

.workflow-template-lifecycle__changes small.is-blocked,
.workflow-template-lifecycle__blockers {
  color: var(--v2-warning);
}

.workflow-template-lifecycle__blockers strong {
  font-size: 10px;
}

.workflow-template-lifecycle__blockers li {
  font-size: 10px;
  line-height: 1.5;
}

.workflow-template-lifecycle__review {
  color: var(--v2-text-secondary) !important;
}

.workflow-template-lifecycle__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.workflow-template-lifecycle__actions button,
.workflow-template-lifecycle__confirmation button {
  min-width: 0;
  min-height: 40px;
  justify-content: center;
  gap: 6px;
  padding: 6px 9px;
  border: 1px solid var(--v2-border-standard);
  border-radius: var(--v2-radius-sm);
  color: var(--v2-text-secondary);
  background: var(--v2-surface-2);
  font-size: 10px;
  transition: transform 120ms ease-out, background-color 120ms ease-out;
  touch-action: manipulation;
}

.workflow-template-lifecycle__actions button:first-child {
  color: var(--v2-text-on-accent);
  border-color: transparent;
  background: var(--v2-accent);
}

.workflow-template-lifecycle__actions button:last-child {
  grid-column: 1 / -1;
  color: var(--v2-warning);
  background: transparent;
}

.workflow-template-lifecycle__actions button:active,
.workflow-template-lifecycle__confirmation button:active {
  transform: scale(0.96);
}

.workflow-template-lifecycle button:focus-visible {
  outline: 2px solid var(--v2-accent);
  outline-offset: 2px;
}

.workflow-template-lifecycle button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.workflow-template-lifecycle__confirmation {
  display: grid;
  gap: 7px;
  padding: 8px;
  border: 1px solid var(--v2-border-standard);
  border-radius: var(--v2-radius-md);
  background: var(--v2-surface-2);
}

.workflow-template-lifecycle__confirmation > div {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.workflow-template-lifecycle__confirmation button:last-child {
  color: var(--v2-text-on-accent);
  border-color: transparent;
  background: var(--v2-accent);
}

.workflow-template-lifecycle__error {
  color: var(--v2-danger) !important;
}

@media (prefers-reduced-motion: reduce) {
  .workflow-template-lifecycle button {
    transition: none;
  }
}
</style>
