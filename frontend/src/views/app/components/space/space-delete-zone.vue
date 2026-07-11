<script setup lang="ts">
import { NModal } from 'naive-ui'
import { Trash2, TriangleAlert } from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'
import type { SpaceDetailKind } from './space-presentation'

const props = defineProps<{
  kind: Exclude<SpaceDetailKind, null>
  targetId: string
  itemName: string
  isDeleting: boolean
  error: string
}>()

const emit = defineEmits<{
  confirm: [kind: Exclude<SpaceDetailKind, null>, id: string]
}>()

const isConfirmationOpen = ref(false)
const deleteButtonRef = ref<HTMLButtonElement | null>(null)
const cancelButtonRef = ref<HTMLButtonElement | null>(null)
const heading = computed(() => (props.kind === 'asset' ? '删除资产' : '删除模板'))
const dialogHeading = computed(() =>
  props.kind === 'asset' ? '删除资产' : '永久删除模板',
)
const description = computed(() =>
  props.kind === 'asset'
    ? '删除后资产记录会从个人列表隐藏，当前界面不提供恢复入口。'
    : '模板记录会永久删除，已经由它创建的项目不受影响。',
)
const dialogDescription = computed(() =>
  props.kind === 'asset'
    ? `确认删除“${props.itemName}”？删除后资产记录会从个人列表隐藏，当前接口不提供恢复入口。`
    : `确认删除“${props.itemName}”？模板记录会永久删除，当前接口不提供恢复入口。`,
)
const deleteButtonLabel = computed(() => {
  if (props.isDeleting) return '正在删除'
  if (isConfirmationOpen.value) return '等待确认'
  return props.kind === 'asset' ? '删除资产' : '永久删除模板'
})

function openConfirmation() {
  isConfirmationOpen.value = true
}

function focusCancelButton() {
  cancelButtonRef.value?.focus()
}

async function closeConfirmation() {
  if (props.isDeleting) {
    return
  }
  isConfirmationOpen.value = false
  await nextTick()
  deleteButtonRef.value?.focus()
}

function confirmDeletion() {
  if (!props.isDeleting) {
    emit('confirm', props.kind, props.targetId)
  }
}

function handleShowChange(show: boolean) {
  if (!show) {
    void closeConfirmation()
  }
}

watch(
  () => [props.kind, props.targetId] as const,
  () => {
    isConfirmationOpen.value = false
  },
  { flush: 'sync' },
)

watch(
  () => props.error,
  (error) => {
    if (error) {
      void closeConfirmation()
    }
  },
)
</script>

<template>
  <div v-if="error" class="delete-alert" role="alert">
    <TriangleAlert :size="17" />
    <span>{{ error }}</span>
  </div>

  <section class="danger-zone" :aria-labelledby="`delete-${kind}-heading`">
    <div>
      <strong :id="`delete-${kind}-heading`">{{ heading }}</strong>
      <span>{{ description }}</span>
    </div>
    <button
      ref="deleteButtonRef"
      class="danger-action focus-ring"
      type="button"
      :disabled="isDeleting || isConfirmationOpen"
      @click="openConfirmation"
    >
      <Trash2 :size="16" />
      {{ deleteButtonLabel }}
    </button>
  </section>

  <NModal
    :show="isConfirmationOpen"
    :mask-closable="false"
    :close-on-esc="!isDeleting"
    @after-enter="focusCancelButton"
    @update:show="handleShowChange"
  >
    <div
      class="delete-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="space-delete-dialog-title"
      aria-describedby="space-delete-dialog-description"
    >
      <p class="dialog-kicker">Destructive action</p>
      <h2 id="space-delete-dialog-title">{{ dialogHeading }}</h2>
      <p id="space-delete-dialog-description" class="dialog-copy">{{ dialogDescription }}</p>
      <div class="dialog-actions">
        <button
          ref="cancelButtonRef"
          class="dialog-action focus-ring"
          type="button"
          tabindex="0"
          :disabled="isDeleting"
          @click="closeConfirmation"
        >
          取消
        </button>
        <button
          class="dialog-action is-danger focus-ring"
          type="button"
          tabindex="0"
          :disabled="isDeleting"
          @click="confirmDeletion"
        >
          {{ isDeleting ? '正在删除' : kind === 'asset' ? '确认删除' : '永久删除' }}
        </button>
      </div>
    </div>
  </NModal>
</template>

<style scoped lang="scss">
.delete-alert,
.danger-zone,
.danger-action,
.dialog-actions {
  display: flex;
  align-items: center;
}

.delete-alert {
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid rgba(217, 83, 92, 0.25);
  border-radius: var(--radius-lg);
  color: #e06a71;
  background: rgba(217, 83, 92, 0.08);
  font-size: var(--font-size-hint);
}

.delete-alert span {
  min-width: 0;
  flex: 1;
  line-height: 1.6;
}

.danger-zone {
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid rgba(217, 83, 92, 0.2);
}

.danger-zone > div {
  display: grid;
  min-width: 0;
  gap: 5px;
}

.danger-zone strong {
  color: #f0eef6;
  font-size: 14px;
}

.danger-zone span {
  color: rgba(240, 238, 246, 0.56);
  font-size: var(--font-size-hint);
  line-height: 1.6;
  text-wrap: pretty;
}

.danger-action,
.dialog-action {
  min-height: 42px;
  justify-content: center;
  gap: var(--space-2);
  padding: 0 var(--space-3);
  border: 1px solid rgba(217, 83, 92, 0.35);
  border-radius: var(--radius-lg);
  color: #e06a71;
  background: rgba(217, 83, 92, 0.08);
  transition:
    background-color 120ms ease,
    border-color 120ms ease,
    transform 120ms ease;
}

.danger-action {
  flex: 0 0 auto;
}

.danger-action:active,
.dialog-action:active {
  transform: scale(0.96);
}

.danger-action:disabled,
.dialog-action:disabled {
  cursor: wait;
  opacity: 0.58;
}

.delete-dialog {
  width: min(460px, calc(100vw - 24px));
  padding: var(--space-6);
  border: 1px solid rgba(240, 238, 246, 0.1);
  border-radius: 22px;
  color: #f0eef6;
  background: #1a1a24;
  box-shadow: var(--shadow-strong);
}

.dialog-kicker,
.delete-dialog h2,
.dialog-copy {
  margin: 0;
}

.dialog-kicker {
  color: #e06a71;
  font-size: var(--font-size-hint);
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.delete-dialog h2 {
  margin-top: var(--space-2);
  font-size: 24px;
}

.dialog-copy {
  margin-top: var(--space-2);
  color: rgba(240, 238, 246, 0.72);
  line-height: 1.7;
  text-wrap: pretty;
}

.dialog-actions {
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-6);
}

.dialog-action {
  color: rgba(240, 238, 246, 0.76);
  border-color: rgba(240, 238, 246, 0.12);
  background: rgba(240, 238, 246, 0.06);
}

.dialog-action.is-danger {
  border-color: transparent;
  color: #f0eef6;
  background: #b94750;
}

@media (hover: hover) {
  .danger-action:hover:not(:disabled) {
    border-color: rgba(224, 106, 113, 0.55);
    background: rgba(217, 83, 92, 0.14);
  }

  .dialog-action:hover:not(:disabled) {
    background: rgba(240, 238, 246, 0.11);
  }

  .dialog-action.is-danger:hover:not(:disabled) {
    background: #d9535c;
  }
}

@media (max-width: 420px) {
  .danger-zone {
    flex-direction: column;
  }

  .danger-action {
    width: 100%;
  }

  .delete-dialog {
    padding: var(--space-4);
    border-radius: 18px;
  }

  .dialog-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .delete-dialog.fade-in-scale-up-transition-enter-active,
  .delete-dialog.fade-in-scale-up-transition-leave-active {
    transition: none !important;
  }

  .danger-action,
  .dialog-action {
    transition: none;
  }

  .danger-action:active,
  .dialog-action:active {
    transform: none;
  }
}
</style>
