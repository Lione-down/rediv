<script setup lang="ts">
import { Bot, Paperclip, Send } from 'lucide-vue-next'
import { ref } from 'vue'
import {
  WORKFLOW_STARTERS,
  type WorkflowStarterId,
} from './canvas-workflow-starters'

const props = withDefaults(defineProps<{ readonly?: boolean; busy?: boolean }>(), {
  readonly: false,
  busy: false,
})

const emit = defineEmits<{
  dismiss: []
  openResources: [opener: HTMLElement]
  start: [starterId: WorkflowStarterId, brief?: string]
}>()

const brief = ref('')
const selectedStarterId = ref<WorkflowStarterId>('script')
const isSkillSelected = ref(false)

function submitComposer() {
  const value = brief.value.trim()
  if (!value || props.busy) return
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
      <div class="creation-controls">
        <button type="button" aria-label="添加附件" title="从项目资源添加附件" :disabled="busy" @click="event => emit('openResources', event.currentTarget as HTMLElement)">
          <Paperclip :size="15" aria-hidden="true" />附件
        </button>
        <label>
          <span class="sr-only">模型</span>
          <select aria-label="模型" disabled><option>自动（节点 capability）</option></select>
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
        <button class="creation-send" type="submit" aria-label="将提示词写入本地工作流" :disabled="busy || !brief.trim()">
          <Send :size="15" aria-hidden="true" />发送
        </button>
      </div>
      <p v-if="isSkillSelected" class="skill-selection" role="status">revid.canvas-context · 节点创建后预检</p>
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
}
</style>
