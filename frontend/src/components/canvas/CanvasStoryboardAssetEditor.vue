<script setup lang="ts">
import { Check, ImagePlus, MapPin, PackageOpen, UserRound } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { createEditStoryboardAssetCommand, type StoryboardAssetEditIntent } from '../../modules/canvas/storyboard-asset-commands'
import { useCanvasStore } from '../../store/canvas'
import type { CanvasNode } from '../../types/canvas'

const props = withDefaults(defineProps<{
  intent: StoryboardAssetEditIntent
  node: CanvasNode
  readonly?: boolean
}>(), { readonly: false })
const canvasStore = useCanvasStore()
const name = ref('')
const activeName = ref('')
const promptText = ref('')
const error = ref('')
const success = ref('')
const labels = {
  role: { title: '角色', icon: UserRound },
  scene: { title: '场景', icon: MapPin },
  prop: { title: '道具', icon: PackageOpen },
} as const
const label = computed(() => labels[props.intent.kind])
const hasChanges = computed(() => name.value.trim() !== activeName.value || promptText.value !== sourcePrompt())

function sourcePrompt() {
  return typeof props.node.content === 'string'
    ? props.node.content
    : typeof props.node.contentData?.text === 'string' ? props.node.contentData.text : ''
}

function reset() {
  name.value = props.intent.name
  activeName.value = props.intent.name
  promptText.value = sourcePrompt()
  error.value = ''
  success.value = ''
}

watch(() => [props.intent.groupId, props.intent.promptNodeId, props.intent.kind, props.intent.name], reset, { immediate: true })

async function save() {
  if (props.readonly) return
  const command = createEditStoryboardAssetCommand(
    canvasStore.nodes,
    props.intent.groupId,
    props.intent.promptNodeId,
    props.intent.kind,
    activeName.value,
    name.value,
    promptText.value,
  )
  if (!command) {
    error.value = '名称或镜头提示无效，或者内容没有变化。'
    success.value = ''
    return
  }
  try {
    await canvasStore.dispatchCommand({ source: 'toolbar', command })
    activeName.value = command.nextValue
    name.value = command.nextValue
    error.value = ''
    success.value = `${label.value.title}已保存到画布。`
  } catch {
    error.value = '编辑未保存，画布状态已恢复，请重试。'
    success.value = ''
  }
}
</script>

<template>
  <section class="asset-editor" :aria-label="`编辑${label.title}`">
    <header><span><component :is="label.icon" :size="16" aria-hidden="true" />编辑{{ label.title }}</span><small>{{ intent.promptNodeId }}</small></header>
    <section class="asset-editor__image" :aria-label="`${label.title}形象`">
      <span><ImagePlus :size="24" aria-hidden="true" /></span>
      <strong>{{ label.title }}形象</strong>
      <small>尚未绑定形象资产</small>
    </section>
    <label><span>{{ label.title }}名称</span><input v-model="name" maxlength="80" :readonly="readonly" :aria-label="`${label.title}名称`" /></label>
    <label><span>{{ label.title }}描述</span><textarea v-model="promptText" rows="10" maxlength="4000" :readonly="readonly" :aria-label="`${label.title}描述`"></textarea><small>使用所选镜头现有的 prompt 文本，不创建第二套资产描述。</small></label>
    <button v-if="!readonly" type="button" class="asset-editor__save" :disabled="!hasChanges" :aria-label="`保存${label.title}`" @click="save"><Check :size="15" aria-hidden="true" />保存更改</button>
    <p v-if="error" role="alert" class="is-error">{{ error }}</p>
    <p v-else-if="success" role="status" class="is-success">{{ success }}</p>
  </section>
</template>

<style scoped lang="scss">
.asset-editor { display: grid; gap: 14px; padding: 14px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-md); background: var(--v2-surface-2); }
.asset-editor > header { display: flex; align-items: center; justify-content: space-between; color: var(--v2-text-primary); }
.asset-editor > header span { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: var(--v2-font-weight-semibold); }
.asset-editor > header small { color: var(--v2-text-muted); font-size: 9px; }
.asset-editor__image { display: grid; min-height: 190px; place-items: center; align-content: center; gap: 7px; border: 1px dashed var(--v2-border-standard); border-radius: var(--v2-radius-sm); color: var(--v2-text-muted); background: var(--v2-surface-1); }
.asset-editor__image span { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 50%; background: var(--v2-surface-2); }
.asset-editor__image strong { color: var(--v2-text-secondary); font-size: 11px; }
.asset-editor__image small { font-size: 9px; }
.asset-editor > label { display: grid; gap: 7px; color: var(--v2-text-secondary); font-size: 11px; font-weight: var(--v2-font-weight-medium); }
.asset-editor input, .asset-editor textarea { width: 100%; min-width: 0; padding: 9px 10px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-sm); color: var(--v2-text-primary); background: var(--v2-surface-1); font: inherit; font-size: 11px; line-height: 1.55; resize: vertical; }
.asset-editor label small { color: var(--v2-text-muted); font-size: 9px; font-weight: var(--v2-font-weight-regular); line-height: 1.5; }
.asset-editor input:focus-visible, .asset-editor textarea:focus-visible, .asset-editor__save:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
.asset-editor__save { display: inline-flex; min-height: 34px; align-items: center; justify-content: center; gap: 6px; border: 1px solid var(--v2-accent-border); border-radius: var(--v2-radius-sm); color: var(--v2-text-on-accent); background: var(--v2-accent); font: inherit; font-size: 11px; font-weight: var(--v2-font-weight-semibold); cursor: pointer; }
.asset-editor__save:disabled { opacity: .45; cursor: not-allowed; }
.asset-editor p { margin: 0; font-size: 10px; }
.asset-editor .is-error { color: var(--v2-danger); }
.asset-editor .is-success { color: var(--v2-success); }
</style>
