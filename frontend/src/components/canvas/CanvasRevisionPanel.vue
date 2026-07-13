<script setup lang="ts">
import { AlertTriangle, CircleDot, History, LoaderCircle, RotateCcw, X } from 'lucide-vue-next'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useCanvasRevisionStore } from '../../modules/canvas/canvas-revision-store'
import { getCanvasErrorMessage } from '../../modules/canvas/persistence'
import { useCanvasStore } from '../../store/canvas'

const props = defineProps<{
  projectId: string
  canvasId: string
  readonly: boolean
}>()

const emit = defineEmits<{ close: [] }>()
const canvasStore = useCanvasStore()
const revisionStore = useCanvasRevisionStore()
const panelRef = ref<HTMLElement | null>(null)
const confirmationRevision = ref<number | null>(null)
const recoveryNotice = ref('')
const recoveryError = ref('')
const hasConflict = computed(() => canvasStore.saveState === 'conflict')

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(date)
}

async function loadHistory() {
  if (!props.projectId || !props.canvasId) return
  await revisionStore.load(props.projectId, props.canvasId).catch(() => undefined)
}

async function confirmRestore() {
  const revision = confirmationRevision.value
  if (revision === null) return
  await revisionStore.restore(props.projectId, props.canvasId, revision).catch(() => undefined)
  confirmationRevision.value = null
}

async function reloadLatest(discardLocal: boolean) {
  recoveryNotice.value = ''
  recoveryError.value = ''
  canvasStore.preserveLocalRecovery()
  try {
    await canvasStore.reloadActiveDocument(true)
    if (discardLocal) canvasStore.discardLocalRecovery()
    await loadHistory()
    recoveryNotice.value = discardLocal
      ? '已加载服务器最新版本。'
      : '本地副本已保留，并已加载服务器最新版本。'
  } catch (cause) {
    recoveryError.value = getCanvasErrorMessage(
      cause, '服务器最新版本加载失败，本地副本仍保留，请重试。',
    )
  }
}

function discardDetectedRecovery() {
  canvasStore.discardLocalRecovery()
  recoveryNotice.value = '本地恢复副本已丢弃，当前服务器版本保持不变。'
}

watch(() => [props.projectId, props.canvasId], () => {
  confirmationRevision.value = null
  recoveryNotice.value = ''
  recoveryError.value = ''
  void loadHistory()
})

watch(() => canvasStore.graphRevision, () => void loadHistory())

onMounted(() => {
  void loadHistory()
  void nextTick(() => panelRef.value?.focus({ preventScroll: true }))
})
</script>

<template>
  <aside
    ref="panelRef"
    class="revision-panel"
    role="dialog"
    aria-label="修订历史与恢复"
    tabindex="-1"
    lang="zh-CN"
  >
    <header>
      <div>
        <strong><History :size="17" aria-hidden="true" />修订历史</strong>
        <span>当前 head r{{ revisionStore.currentRevision || canvasStore.graphRevision }}</span>
      </div>
      <button type="button" aria-label="关闭修订历史" @click="emit('close')">
        <X :size="17" aria-hidden="true" />
      </button>
    </header>

    <section v-if="hasConflict" class="recovery-card is-conflict" aria-labelledby="conflict-title">
      <div>
        <AlertTriangle :size="18" aria-hidden="true" />
        <div>
          <strong id="conflict-title">保存冲突</strong>
          <p>服务器当前为 r{{ canvasStore.conflictRevision }}。选择加载最新版本，或先保留本地副本。</p>
        </div>
      </div>
      <div class="recovery-actions">
        <button type="button" @click="reloadLatest(true)">加载服务器最新版本</button>
        <button type="button" @click="reloadLatest(false)">保留本地副本并加载最新版本</button>
      </div>
    </section>

    <section v-else-if="canvasStore.hasLocalRecovery" class="recovery-card" aria-labelledby="recovery-title">
      <div>
        <AlertTriangle :size="18" aria-hidden="true" />
        <div>
          <strong id="recovery-title">检测到本地恢复副本</strong>
          <p>当前画布显示服务器版本。本地副本会继续保留，除非你明确丢弃。</p>
        </div>
      </div>
      <div class="recovery-actions">
        <button type="button" @click="discardDetectedRecovery">丢弃本地恢复副本</button>
      </div>
    </section>

    <p v-if="recoveryNotice" class="panel-notice" role="status">{{ recoveryNotice }}</p>
    <p v-if="recoveryError" class="panel-error" role="alert">{{ recoveryError }}</p>
    <p v-if="revisionStore.notice" class="panel-notice" role="status">{{ revisionStore.notice }}</p>
    <p v-if="revisionStore.error" class="panel-error" role="alert">
      {{ revisionStore.error }}
      <button type="button" @click="loadHistory">重试</button>
    </p>

    <p v-if="readonly" class="review-note">审阅模式不会修改画布历史。</p>
    <div v-if="revisionStore.isLoading" class="loading-state" role="status">
      <LoaderCircle :size="17" aria-hidden="true" />加载修订历史
    </div>
    <p v-else-if="!revisionStore.items.length" class="empty-state">尚无 durable edit revision。</p>
    <ol v-else class="revision-list" aria-label="保留的修订">
      <li v-for="item in revisionStore.items" :key="item.revision">
        <div class="revision-copy">
          <strong>r{{ item.revision }}</strong>
          <span v-if="item.is_checkpoint" class="checkpoint-label">
            <CircleDot :size="13" aria-hidden="true" />Checkpoint
          </span>
          <span v-if="item.restored_from_revision">来自 r{{ item.restored_from_revision }}</span>
          <time :datetime="item.created_at">{{ formatTime(item.created_at) }}</time>
        </div>
        <button
          v-if="!readonly && item.revision !== revisionStore.currentRevision"
          type="button"
          :aria-label="`恢复修订 r${item.revision}`"
          :disabled="revisionStore.restoringRevision !== null"
          @click="confirmationRevision = item.revision"
        >
          <RotateCcw :size="15" aria-hidden="true" />恢复
        </button>
      </li>
    </ol>

    <section v-if="confirmationRevision !== null" class="restore-confirmation" role="alertdialog" aria-label="确认恢复修订">
      <strong>恢复 r{{ confirmationRevision }}？</strong>
      <p>恢复会创建新的 head，不会改写现有历史。</p>
      <div>
        <button type="button" @click="confirmationRevision = null">取消</button>
        <button type="button" :aria-label="`确认恢复 r${confirmationRevision}`" @click="confirmRestore">
          确认恢复 r{{ confirmationRevision }}
        </button>
      </div>
    </section>
  </aside>
</template>

<style scoped lang="scss">
.revision-panel {
  position: absolute;
  top: 68px;
  right: max(var(--v2-space-4), env(safe-area-inset-right));
  z-index: 30;
  width: min(380px, calc(100vw - 32px));
  max-height: calc(100dvh - 100px);
  overflow: auto;
  padding: var(--v2-space-4);
  border: 1px solid var(--v2-border-standard);
  border-radius: var(--v2-radius-md);
  color: var(--v2-text-primary);
  background: var(--v2-surface-3);
  box-shadow: var(--v2-shadow-prominent);
  overscroll-behavior: contain;
}

header,
header > div,
header strong,
.recovery-card > div,
.revision-list li,
.revision-copy,
.checkpoint-label,
.loading-state,
.recovery-actions,
.restore-confirmation > div { display: flex; }
header { align-items: center; justify-content: space-between; gap: var(--v2-space-3); }
header > div,
.revision-copy { flex-direction: column; gap: 2px; }
header strong { align-items: center; gap: var(--v2-space-2); font-size: 14px; }
header span,
.revision-copy span,
.revision-copy time { color: var(--v2-text-muted); font-size: 12px; }

button {
  min-height: 40px;
  padding: 0 var(--v2-space-3);
  border: 1px solid var(--v2-border-standard);
  border-radius: var(--v2-radius-sm);
  color: var(--v2-text-primary);
  background: var(--v2-surface-2);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
button:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
.revision-panel:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: -2px; }
button:disabled { opacity: 0.45; cursor: not-allowed; }
header button { width: 40px; padding: 0; }

.recovery-card,
.restore-confirmation {
  margin-top: var(--v2-space-4);
  padding: var(--v2-space-3);
  border: 1px solid var(--v2-border-standard);
  border-radius: var(--v2-radius-md);
  background: var(--v2-surface-prominent);
}
.recovery-card.is-conflict { border-color: color-mix(in oklch, var(--v2-danger) 45%, transparent); }
.recovery-card > div { align-items: flex-start; gap: var(--v2-space-2); }
.recovery-card svg { flex: none; color: var(--v2-danger); }
.recovery-card p,
.restore-confirmation p { margin: 4px 0 0; color: var(--v2-text-secondary); font-size: 12px; line-height: 1.6; }
.recovery-actions { flex-wrap: wrap; margin-top: var(--v2-space-3); }

.panel-notice,
.panel-error,
.review-note,
.empty-state { margin: var(--v2-space-3) 0 0; font-size: 12px; line-height: 1.6; }
.panel-notice { color: var(--v2-success); }
.panel-error { color: var(--v2-danger); }
.review-note,
.empty-state { color: var(--v2-text-muted); }
.loading-state { align-items: center; gap: var(--v2-space-2); margin-top: var(--v2-space-4); color: var(--v2-text-secondary); font-size: 12px; }

.revision-list { margin: var(--v2-space-4) 0 0; padding: 0; list-style: none; }
.revision-list li { align-items: center; justify-content: space-between; gap: var(--v2-space-3); min-height: 58px; border-top: 1px solid var(--v2-border-subtle); }
.revision-copy { min-width: 0; }
.revision-copy > strong { font-variant-numeric: tabular-nums; }
.checkpoint-label { align-items: center; gap: 4px; color: var(--v2-accent-hover) !important; }
.restore-confirmation > div { justify-content: flex-end; gap: var(--v2-space-2); margin-top: var(--v2-space-3); }

@media (hover: hover) { button:not(:disabled):hover { background: var(--v2-surface-prominent); } }
@media (max-width: 767px) {
  .revision-panel { top: 60px; right: var(--v2-space-2); left: var(--v2-space-2); width: auto; max-height: calc(100dvh - 176px); }
}
</style>
