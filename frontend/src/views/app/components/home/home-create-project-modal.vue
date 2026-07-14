<script setup lang="ts">
import { NInput, NModal } from 'naive-ui'
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps<{
  show: boolean
  isCreating: boolean
  error: string
}>()

const emit = defineEmits<{
  close: []
  submit: [name: string]
}>()

const projectName = ref('')
const validationError = ref('')
const inputRef = ref<InstanceType<typeof NInput> | null>(null)
const normalizedName = computed(() => projectName.value.trim())

watch(
  () => props.show,
  async (show) => {
    if (!show) {
      projectName.value = ''
      validationError.value = ''
      return
    }

    await nextTick()
    inputRef.value?.focus()
  },
)

watch(projectName, () => {
  validationError.value = ''
})

function handleSubmit() {
  if (!normalizedName.value) {
    validationError.value = '请输入项目名称。'
    inputRef.value?.focus()
    return
  }

  if (Array.from(normalizedName.value).length > 255) {
    validationError.value = '项目名称不能超过 255 个字符。'
    inputRef.value?.focus()
    return
  }

  validationError.value = ''
  emit('submit', normalizedName.value)
}

function handleShowUpdate(show: boolean) {
  if (!show && !props.isCreating) {
    emit('close')
  }
}
</script>

<template>
  <NModal
    :show="show"
    :mask-closable="!isCreating"
    :close-on-esc="!isCreating"
    @update:show="handleShowUpdate"
  >
    <div class="create-dialog" role="dialog" aria-modal="true" aria-labelledby="create-project-title">
      <p class="dialog-kicker">New project</p>
      <h2 id="create-project-title">创建项目</h2>
      <p class="dialog-copy">项目创建后会立即出现在列表中，并使用 backend 返回的真实 ID 进入工作流。</p>

      <form @submit.prevent="handleSubmit">
        <label for="project-name">项目名称</label>
        <NInput
          ref="inputRef"
          v-model:value="projectName"
          placeholder="例如：夏日海边短片"
          :input-props="{
            id: 'project-name',
            'aria-invalid': validationError || error ? 'true' : 'false',
            'aria-describedby': validationError || error ? 'project-name-error' : undefined,
          }"
          :disabled="isCreating"
          :maxlength="255"
          show-count
        />
        <p
          v-if="validationError || error"
          id="project-name-error"
          class="field-error"
          role="alert"
        >
          {{ validationError || error }}
        </p>

        <div class="dialog-actions">
          <button
            class="dialog-action focus-ring"
            type="button"
            :disabled="isCreating"
            @click="emit('close')"
          >
            取消
          </button>
          <button
            class="dialog-action is-primary focus-ring"
            type="submit"
            :disabled="isCreating"
          >
            {{ isCreating ? '创建中…' : '创建项目' }}
          </button>
        </div>
      </form>
    </div>
  </NModal>
</template>

<style scoped lang="scss">
.create-dialog {
  width: min(460px, calc(100vw - 24px));
  padding: var(--space-6);
  border: 1px solid var(--v2-border-standard);
  border-radius: 22px;
  color: var(--v2-text-primary);
  background: var(--v2-surface-3);
  box-shadow: var(--shadow-strong);
}

.dialog-kicker,
.create-dialog h2,
.dialog-copy,
.field-error {
  margin: 0;
}

.dialog-kicker {
  color: var(--v2-accent-hover);
  font-size: var(--font-size-hint);
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.create-dialog h2 {
  margin-top: var(--space-2);
  font-size: 24px;
}

.dialog-copy {
  margin-top: var(--space-2);
  color: var(--v2-text-secondary);
  line-height: 1.7;
}

form {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

label {
  font-size: var(--font-size-hint);
}

.field-error {
  color: var(--v2-danger);
  font-size: var(--font-size-hint);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.dialog-action {
  min-height: 42px;
  padding: 0 var(--space-4);
  border: 1px solid var(--v2-border-standard);
  border-radius: var(--radius-lg);
  color: var(--v2-text-primary);
  background: var(--v2-surface-2);
  transition:
    background-color 120ms ease,
    transform 120ms ease;
}

.dialog-action.is-primary {
  color: var(--text-primary);
  border-color: transparent;
  background: var(--accent-generate);
}

.dialog-action:focus-visible {
  outline-color: var(--v2-focus-ring);
}

.dialog-action:disabled {
  cursor: wait;
  opacity: 0.6;
}

.dialog-action:active {
  transform: scale(0.96);
}

@media (hover: hover) {
  .dialog-action:hover {
    background: var(--v2-surface-prominent);
  }

  .dialog-action.is-primary:hover {
    background: var(--v2-accent-hover);
  }
}

@media (max-width: 420px) {
  .create-dialog {
    padding: var(--space-4);
    border-radius: 18px;
  }

  .dialog-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dialog-action {
    transition: none;
  }

  .dialog-action:active {
    transform: none;
  }
}
</style>
