<script setup lang="ts">
import { Bot, CircleAlert, LoaderCircle, Paperclip, RefreshCw, Send, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import type { ProjectAsset } from '../../modules/canvas/project-resource-types'
import {
  WORKFLOW_STARTERS,
  type WorkflowStarterId,
} from './canvas-workflow-starters'

const props = withDefaults(defineProps<{
  attachments?: readonly ProjectAsset[]
  readonly?: boolean
  busy?: boolean
  capabilityError?: string
  capabilityLoading?: boolean
  modelId?: string
  modelLabel?: string
}>(), {
  attachments: () => [],
  readonly: false,
  busy: false,
  capabilityError: '',
  capabilityLoading: false,
  modelId: '',
  modelLabel: '',
})

const emit = defineEmits<{
  dismiss: []
  openResources: [opener: HTMLElement]
  removeAttachment: [assetId: string]
  retryCapabilities: []
  start: [starterId: WorkflowStarterId, brief?: string]
}>()

const brief = ref('')
const selectedStarterId = ref<WorkflowStarterId>('script')
const isSkillSelected = ref(false)
const isScriptMode = computed(() => selectedStarterId.value === 'script')
const canSubmit = computed(() => Boolean(
  brief.value.trim() && !props.busy && (!isScriptMode.value || props.modelId),
))
const sendLabel = computed(() => {
  if (!isScriptMode.value) return '创建工作流'
  return props.modelLabel ? `使用 ${props.modelLabel} 生成脚本` : '生成脚本'
})

function attachmentLabel(asset: ProjectAsset) {
  return asset.content_text?.trim() || `${asset.type === 'image' ? '图片' : asset.type === 'video' ? '视频' : asset.type === 'audio' ? '音频' : '文本'}素材`
}

function submitComposer() {
  const value = brief.value.trim()
  if (!value || !canSubmit.value) return
  emit('start', selectedStarterId.value, value)
}
</script>

<template>
  <section class="canvas-empty-guide" role="region" aria-label="空白画布起点" aria-live="polite">
    <div class="empty-guide-copy">
      <span>{{ readonly ? '只读审阅' : '空白画布' }}</span>
      <h2>{{ readonly ? '这个画布还是空白的' : '从一个创作方向开始' }}</h2>
      <p>{{ readonly ? '当前没有可审阅的节点。' : '双击画布或选择一个创作起点' }}</p>
    </div>

    <form v-if="!readonly" class="creation-composer" role="form" aria-label="Canvas 主创作输入" @submit.prevent="submitComposer">
      <label class="creation-prompt">
        <span class="sr-only">主创作提示词</span>
        <textarea v-model="brief" rows="2" maxlength="4000" aria-label="主创作提示词" placeholder="描述你想创建的故事、角色或镜头…"></textarea>
      </label>
      <ul v-if="attachments.length" class="creation-attachments" aria-label="已添加附件">
        <li v-for="asset in attachments" :key="asset.id">
          <Paperclip :size="13" aria-hidden="true" />
          <span>{{ attachmentLabel(asset) }}</span>
          <button type="button" :aria-label="`移除附件 ${attachmentLabel(asset)}`" :disabled="busy" @click="emit('removeAttachment', asset.id)"><X :size="13" aria-hidden="true" /></button>
        </li>
      </ul>
      <div class="creation-controls">
        <button type="button" aria-label="添加附件" title="从项目资源添加附件" :disabled="busy" @click="event => emit('openResources', event.currentTarget as HTMLElement)">
          <Paperclip :size="15" aria-hidden="true" />附件
        </button>
        <label>
          <span class="sr-only">模型</span>
          <select aria-label="模型" :value="modelId" disabled>
            <option :value="modelId">{{ modelLabel || (capabilityLoading ? '正在加载模型…' : '模型不可用') }}</option>
          </select>
        </label>
        <button type="button" aria-label="选择 Agent / Skill" :aria-pressed="isSkillSelected" :disabled="busy" @click="isSkillSelected = !isSkillSelected">
          <Bot :size="15" aria-hidden="true" />Agent / Skill
        </button>
        <label>
          <span class="sr-only">生成模式</span>
          <select v-model="selectedStarterId" aria-label="生成模式" :disabled="busy">
            <option v-for="starter in WORKFLOW_STARTERS" :key="starter.id" :value="starter.id" :disabled="!starter.isAvailable">{{ starter.title }}</option>
          </select>
        </label>
        <button class="creation-send" type="submit" :aria-label="sendLabel" :disabled="!canSubmit">
          <LoaderCircle v-if="busy" class="is-spinning" :size="15" aria-hidden="true" /><Send v-else :size="15" aria-hidden="true" />发送
        </button>
      </div>
      <p v-if="isSkillSelected" class="skill-selection" role="status">Canvas context · 仅执行生成前检查</p>
      <div v-if="capabilityError && isScriptMode" class="capability-state" role="alert">
        <CircleAlert :size="14" aria-hidden="true" /><span>{{ capabilityError }}</span>
        <button type="button" aria-label="重试加载模型" :disabled="capabilityLoading" @click="emit('retryCapabilities')"><RefreshCw :size="13" aria-hidden="true" />重试</button>
      </div>
    </form>

    <div v-if="!readonly" class="workflow-starters" aria-label="工作流起点">
      <button
        v-for="starter in WORKFLOW_STARTERS"
        :key="starter.id"
        type="button"
        :aria-label="`使用${starter.title}工作流`"
        :class="{ 'is-unavailable': !starter.isAvailable }"
        :disabled="busy || !starter.isAvailable"
        @click="emit('start', starter.id as WorkflowStarterId)"
      >
        <span class="starter-marker" aria-hidden="true">{{ starter.marker }}</span>
        <span class="starter-copy">
          <strong>{{ starter.title }}</strong>
          <small>{{ starter.detail }}</small>
        </span>
      </button>
    </div>

    <button
      v-if="!readonly"
      class="keep-blank-action"
      type="button"
      :disabled="busy"
      @click="emit('dismiss')"
    >
      保持空白画布
    </button>
  </section>
</template>

<style scoped lang="scss">
.canvas-empty-guide {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 20px;
  padding: 96px 24px 112px;
  color: var(--text-primary);
  text-align: center;
  pointer-events: none;
}

.empty-guide-copy {
  display: grid;
  justify-items: center;
  gap: 6px;
}

.empty-guide-copy > span {
  color: var(--v2-accent, var(--accent-select));
  font-size: 12px;
  font-weight: 550;
}

.empty-guide-copy h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.45;
  text-wrap: balance;
}

.empty-guide-copy p {
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.7;
  text-wrap: pretty;
}

.creation-composer {
  display: grid;
  box-sizing: border-box;
  width: min(702px, calc(100vw - 48px));
  gap: 7px;
  padding: 8px;
  border: 1px solid var(--border-standard, var(--border-subtle));
  border-radius: var(--v2-radius-md, var(--radius-lg));
  background: var(--bg-panel);
  box-shadow: var(--shadow-soft);
  text-align: left;
  pointer-events: auto;
}

.creation-prompt textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 58px;
  resize: none;
  padding: 9px 10px;
  border: 0;
  outline: 0;
  color: var(--text-primary);
  background: transparent;
  font: inherit;
  font-size: 12px;
  line-height: 1.5;
}

.creation-prompt textarea::placeholder { color: var(--text-muted); }
.creation-prompt:focus-within { border-radius: var(--v2-radius-sm); outline: 2px solid var(--v2-focus-ring, var(--accent-select)); outline-offset: -2px; }
.creation-controls { display: flex; min-width: 0; align-items: center; gap: 5px; }
.creation-controls button,
.creation-controls select { min-height: 32px; border: 1px solid var(--border-subtle); border-radius: var(--v2-radius-sm); color: var(--text-secondary); background: var(--bg-panel-subtle); font: inherit; font-size: 10px; }
.creation-controls button { display: inline-flex; align-items: center; gap: 5px; padding: 0 8px; cursor: pointer; }
.creation-controls select { max-width: 160px; padding: 0 7px; }
.creation-controls .creation-send { margin-left: auto; color: var(--v2-accent-hover); border-color: color-mix(in oklch, var(--v2-accent) 42%, var(--border-subtle)); }
.skill-selection { margin: 0; color: var(--v2-text-secondary); font-size: 10px; }
.creation-attachments { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0 2px; list-style: none; }
.creation-attachments li { display: inline-flex; max-width: 220px; min-height: 28px; align-items: center; gap: 6px; padding: 0 5px 0 8px; border: 1px solid color-mix(in oklch, var(--v2-accent) 30%, var(--border-subtle)); border-radius: 999px; color: var(--v2-text-secondary); background: var(--v2-accent-soft); font-size: 11px; }
.creation-attachments li > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.creation-attachments button { display: grid; width: 20px; height: 20px; flex: none; place-items: center; padding: 0; border: 0; border-radius: 50%; color: inherit; background: transparent; }
.capability-state { display: flex; min-height: 30px; align-items: center; gap: 7px; padding: 6px 8px; border-radius: var(--v2-radius-sm); color: var(--v2-danger); background: var(--v2-surface-1); font-size: 11px; }
.capability-state span { flex: 1; }
.capability-state button { display: inline-flex; min-height: 26px; align-items: center; gap: 4px; padding: 0 7px; border: 1px solid currentColor; border-radius: var(--v2-radius-sm); color: inherit; background: transparent; }
.is-spinning { animation: composer-spin 800ms linear infinite; }
@keyframes composer-spin { to { transform: rotate(360deg); } }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

.workflow-starters {
  display: grid;
  grid-template-columns: repeat(4, 168px);
  gap: 10px;
  pointer-events: auto;
}

.workflow-starters button {
  display: grid;
  width: 168px;
  height: 60px;
  grid-template-columns: 40px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--border-standard, var(--border-subtle));
  border-radius: var(--v2-radius-sm, var(--radius-md));
  color: var(--text-primary);
  text-align: left;
  background: var(--bg-panel);
  cursor: pointer;
  transition: color var(--v2-duration-fast, 120ms), background-color var(--v2-duration-fast, 120ms), border-color var(--v2-duration-fast, 120ms), transform var(--v2-duration-fast, 120ms);
}

.starter-marker {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: var(--v2-radius-xs, 4px);
  color: var(--v2-accent, var(--accent-select));
  font-size: 11px;
  font-weight: 600;
  background: var(--v2-accent-soft);
}

.starter-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.starter-copy strong,
.starter-copy small {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: clip;
}

.starter-copy strong { font-size: 13px; font-weight: 550; }
.starter-copy small { color: var(--text-muted); font-size: 11px; }

.keep-blank-action {
  min-width: 120px;
  min-height: 40px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--v2-radius-sm, var(--radius-md));
  color: var(--text-secondary);
  font: inherit;
  font-size: 13px;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
  transition: color var(--v2-duration-fast, 120ms), background-color var(--v2-duration-fast, 120ms), transform var(--v2-duration-fast, 120ms);
}

button:active { transform: scale(var(--v2-press-scale, 0.96)); }
button:focus-visible {
  outline: 2px solid var(--v2-focus-ring, var(--accent-select));
  outline-offset: 2px;
}
button:disabled { cursor: wait; opacity: 0.56; }
.workflow-starters button.is-unavailable { cursor: not-allowed; opacity: 0.72; }
.creation-controls button[aria-pressed='true'] { color: var(--v2-accent-hover); background: var(--v2-accent-soft); }

@media (hover: hover) {
  .workflow-starters button:hover {
    border-color: var(--border-strong);
    color: var(--v2-accent-hover, var(--accent-select));
    background: var(--bg-panel-subtle);
  }
  .keep-blank-action:hover { color: var(--text-primary); background: var(--bg-panel-subtle); }
}

@media (max-width: 760px) {
  .canvas-empty-guide { padding-inline: 16px; }
  .workflow-starters { grid-template-columns: repeat(2, 168px); }
  .creation-controls { flex-wrap: wrap; }
}

@media (prefers-reduced-motion: reduce) {
  button { transition: none; }
  button:active { transform: none; }
  .is-spinning { animation: none; }
}
</style>
