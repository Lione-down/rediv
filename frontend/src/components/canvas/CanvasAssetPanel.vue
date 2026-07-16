<script setup lang="ts">
import {
  AudioLines, FileStack, History, Image, Library, LoaderCircle, Plus, RefreshCw,
  Save, Upload, Video, X,
} from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type {
  ProjectAsset,
  ProjectGenerationTask,
  ProjectTemplate,
  ProjectResourceTab,
} from '../../modules/canvas/project-resource-types'
import { resolveGenerationTaskProgressSummary } from '../../modules/canvas/generation-runtime-presentation'

const props = withDefaults(defineProps<{
  activeTab: ProjectResourceTab
  assets: ProjectAsset[]
  autofocus?: boolean
  error?: string
  isLoading?: boolean
  isUploading?: boolean
  mode: 'panel' | 'drawer'
  panelWidth?: number
  readonly?: boolean
  tasks: ProjectGenerationTask[]
  templates: ProjectTemplate[]
}>(), {
  autofocus: false,
  error: '',
  isLoading: false,
  isUploading: false,
  panelWidth: 320,
  readonly: false,
})

const emit = defineEmits<{
  captureTemplate: [name: string]
  close: []
  insertAsset: [asset: ProjectAsset]
  instantiateTemplate: [template: ProjectTemplate]
  resize: [width: number]
  retry: []
  upload: [file: File, type: 'image' | 'video' | 'audio']
  'update:activeTab': [tab: ProjectResourceTab]
}>()

const tabs: Array<{ id: ProjectResourceTab; label: string; icon: typeof Library }> = [
  { id: 'assets', label: '项目资产', icon: Library },
  { id: 'templates', label: '画布模板', icon: FileStack },
  { id: 'tasks', label: '生成记录', icon: History },
]
const tabRefs = ref<HTMLButtonElement[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const isCaptureOpen = ref(false)
const templateName = ref('')
let resizeCleanup: (() => void) | null = null
let activeResizePointerId: number | null = null

const rootRole = computed(() => props.mode === 'panel' ? 'complementary' : 'dialog')

function assetLabel(asset: ProjectAsset) {
  if (asset.content_text?.trim()) return asset.content_text.trim()
  if (asset.source === 'generation') return `${asset.type === 'video' ? '视频' : '图片'}生成结果`
  return `${assetTypeLabel(asset.type)}素材`
}

function assetTypeLabel(type: string) {
  if (type === 'image') return '图片'
  if (type === 'video') return '视频'
  if (type === 'audio') return '音频'
  return '文本'
}

function assetIcon(type: string) {
  if (type === 'video') return Video
  if (type === 'audio') return AudioLines
  return Image
}

function taskStatusLabel(status: ProjectGenerationTask['status']) {
  if (status === 'succeeded') return '已完成'
  if (status === 'failed') return '失败'
  if (status === 'timed_out') return '已超时'
  if (status === 'running') return '生成中'
  return '排队中'
}


function setActiveTab(tab: ProjectResourceTab, focus = false) {
  emit('update:activeTab', tab)
  if (focus) void nextTick(() => tabRefs.value[tabs.findIndex((item) => item.id === tab)]?.focus())
}

function handleTabKeydown(event: KeyboardEvent, index: number) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  let nextIndex = index
  if (event.key === 'Home') nextIndex = 0
  else if (event.key === 'End') nextIndex = tabs.length - 1
  else nextIndex = (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
  setActiveTab(tabs[nextIndex].id, true)
}

function inferUploadType(file: File): 'image' | 'video' | 'audio' | null {
  const prefix = file.type.split('/')[0]
  return prefix === 'image' || prefix === 'video' || prefix === 'audio' ? prefix : null
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  const type = file ? inferUploadType(file) : null
  if (file && type) emit('upload', file, type)
  input.value = ''
}

function submitCapture() {
  const name = templateName.value.trim()
  if (!name) return
  emit('captureTemplate', name)
  templateName.value = ''
  isCaptureOpen.value = false
}

function startResize(event: PointerEvent) {
  if (props.mode !== 'panel' || !event.isPrimary || event.button !== 0) return
  event.preventDefault()
  const target = event.currentTarget as HTMLElement
  const pointerId = event.pointerId
  const startX = event.clientX
  const startWidth = props.panelWidth
  const move = (nextEvent: PointerEvent) => {
    if (activeResizePointerId !== pointerId || nextEvent.pointerId !== pointerId) return
    emit('resize', Math.min(420, Math.max(280, startWidth + nextEvent.clientX - startX)))
  }
  const stop = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', stop)
    window.removeEventListener('pointercancel', stop)
    window.removeEventListener('blur', stop)
    if (activeResizePointerId === pointerId) activeResizePointerId = null
    resizeCleanup = null
    if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId)
  }
  resizeCleanup?.()
  activeResizePointerId = pointerId
  resizeCleanup = stop
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', stop, { once: true })
  window.addEventListener('pointercancel', stop, { once: true })
  window.addEventListener('blur', stop, { once: true })
  try {
    target.setPointerCapture(pointerId)
  } catch {
    // Synthetic and already-cancelled pointers still use the window cleanup path.
  }
}

function stopResize() {
  resizeCleanup?.()
}

function resizeWithKeyboard(event: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  if (event.key === 'Home') emit('resize', 280)
  else if (event.key === 'End') emit('resize', 420)
  else emit('resize', Math.min(420, Math.max(280, props.panelWidth + (event.key === 'ArrowRight' ? 16 : -16))))
}

onMounted(() => {
  if (props.autofocus) void nextTick(() => tabRefs.value[0]?.focus({ preventScroll: true }))
})
onBeforeUnmount(stopResize)
</script>

<template>
  <aside
    class="resource-panel"
    :class="`is-${mode}`"
    :role="rootRole"
    aria-label="项目资源"
    :aria-modal="mode === 'drawer' ? 'true' : undefined"
    :style="mode === 'panel' ? { width: `${panelWidth}px` } : undefined"
  >
    <header class="panel-header">
      <div><Library :size="18" aria-hidden="true" /><strong>项目资源</strong></div>
      <div class="header-actions">
        <button type="button" aria-label="刷新项目资源" title="刷新项目资源" @click="emit('retry')"><RefreshCw :size="17" aria-hidden="true" /></button>
        <button type="button" aria-label="关闭项目资源" title="关闭项目资源" @click="emit('close')"><X :size="18" aria-hidden="true" /></button>
      </div>
    </header>

    <div class="resource-tabs" role="tablist" aria-label="项目资源分类">
      <button
        v-for="(tab, index) in tabs"
        :key="tab.id"
        :ref="(element) => { if (element) tabRefs[index] = element as HTMLButtonElement }"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.id"
        :tabindex="activeTab === tab.id ? 0 : -1"
        @click="setActiveTab(tab.id)"
        @keydown="handleTabKeydown($event, index)"
      ><component :is="tab.icon" :size="15" aria-hidden="true" />{{ tab.label }}</button>
    </div>

    <p v-if="error" class="resource-message is-error" role="alert">{{ error }} <button type="button" @click="emit('retry')">重试</button></p>
    <div v-else-if="isLoading" class="resource-message" role="status"><LoaderCircle :size="18" class="is-spinning" aria-hidden="true" />正在加载项目资源</div>

    <section v-else-if="activeTab === 'assets'" class="resource-content" role="tabpanel" aria-label="项目资产">
      <div v-if="!readonly" class="resource-toolbar">
        <input ref="fileInput" class="visually-hidden" type="file" accept="image/*,video/*,audio/*" aria-label="选择要上传的项目资产" @change="handleFileChange" />
        <button type="button" class="primary-action" :disabled="isUploading" aria-label="上传项目资产" @click="fileInput?.click()">
          <LoaderCircle v-if="isUploading" :size="16" class="is-spinning" aria-hidden="true" /><Upload v-else :size="16" aria-hidden="true" />
          {{ isUploading ? '上传中' : '上传项目资产' }}
        </button>
      </div>
      <p v-if="!assets.length" class="empty-state">项目还没有资产。</p>
      <ul v-else class="resource-list">
        <li v-for="asset in assets" :key="asset.id" class="asset-card">
          <img v-if="asset.type === 'image' && asset.url" :src="asset.url" :alt="assetLabel(asset)" />
          <video v-else-if="asset.type === 'video' && asset.url" :src="asset.url" controls preload="metadata" :aria-label="`视频素材 ${assetLabel(asset)}`"></video>
          <audio v-else-if="asset.type === 'audio' && asset.url" :src="asset.url" controls preload="metadata" :aria-label="`音频素材 ${assetLabel(asset)}`"></audio>
          <div v-else class="media-placeholder" :aria-label="`${assetTypeLabel(asset.type)}素材 ${assetLabel(asset)}预览不可用`">
            <component :is="assetIcon(asset.type)" :size="22" aria-hidden="true" /><span>{{ assetTypeLabel(asset.type) }}预览不可用</span>
          </div>
          <div class="resource-copy"><strong>{{ assetLabel(asset) }}</strong><span>{{ assetTypeLabel(asset.type) }} · {{ asset.source === 'generation' ? '生成结果' : '项目素材' }}</span></div>
          <button v-if="!readonly" type="button" class="insert-action" :aria-label="`插入资产 ${assetLabel(asset)}到当前画布`" @click="emit('insertAsset', asset)"><Plus :size="16" aria-hidden="true" />插入</button>
        </li>
      </ul>
    </section>

    <section v-else-if="activeTab === 'templates'" class="resource-content" role="tabpanel" aria-label="画布模板">
      <div v-if="!readonly" class="capture-row">
        <button v-if="!isCaptureOpen" type="button" class="primary-action" @click="isCaptureOpen = true"><Save :size="16" aria-hidden="true" />保存当前画布为模板</button>
        <form v-else @submit.prevent="submitCapture"><label>模板名称<input v-model="templateName" maxlength="255" required /></label><button type="submit">保存</button></form>
      </div>
      <p v-if="!templates.length" class="empty-state">还没有可用模板。</p>
      <ul v-else class="resource-list">
        <li v-for="template in templates" :key="template.id" class="template-card">
          <FileStack :size="20" aria-hidden="true" />
          <div class="resource-copy"><strong>{{ template.name }}</strong><span>{{ template.node_count }} 个节点 · schema v{{ template.schema_version }}</span></div>
          <button v-if="!readonly" type="button" class="insert-action" :aria-label="`将模板 ${template.name}插入当前画布`" @click="emit('instantiateTemplate', template)"><Plus :size="16" aria-hidden="true" />使用</button>
        </li>
      </ul>
    </section>

    <section v-else class="resource-content" role="tabpanel" aria-label="生成记录">
      <p v-if="!tasks.length" class="empty-state">还没有生成记录。</p>
      <ol v-else class="resource-list task-list">
        <li v-for="task in tasks" :key="task.id" :class="`is-${task.status}`">
          <component :is="task.status === 'running' ? LoaderCircle : History" :size="18" :class="{ 'is-spinning': task.status === 'running' }" aria-hidden="true" />
          <div class="resource-copy"><strong>{{ task.id }}</strong><span>{{ task.media_type }} · {{ taskStatusLabel(task.status) }}<template v-if="resolveGenerationTaskProgressSummary(task)"> · {{ resolveGenerationTaskProgressSummary(task) }}</template></span><small v-if="task.error_message">{{ task.error_message }}</small></div>
        </li>
      </ol>
    </section>

    <div
      v-if="mode === 'panel'"
      class="panel-resizer"
      role="separator"
      aria-label="调整项目资源面板宽度"
      aria-orientation="vertical"
      aria-valuemin="280"
      aria-valuemax="420"
      :aria-valuenow="panelWidth"
      tabindex="0"
      @keydown="resizeWithKeyboard"
      @pointerdown="startResize"
      @pointercancel="stopResize"
      @lostpointercapture="stopResize"
    ></div>
  </aside>
</template>

<style scoped lang="scss">
.resource-panel { position: relative; display: flex; min-width: 0; height: 100%; flex-direction: column; overflow: visible; border: 1px solid var(--v2-border-standard); color: var(--v2-text-primary); background: var(--v2-surface-2); box-shadow: var(--v2-shadow-floating); }
.resource-panel.is-panel { border-radius: var(--v2-radius-md); }
.resource-panel.is-drawer { width: min(420px, 100vw); overflow: hidden; border-width: 0 1px 0 0; }
.panel-header, .panel-header > div, .header-actions, .resource-tabs, .resource-toolbar, .primary-action, .insert-action, .template-card, .task-list li { display: flex; align-items: center; }
.panel-header { min-height: 56px; justify-content: space-between; gap: 12px; padding: 8px 10px 8px 16px; border-bottom: 1px solid var(--v2-border-subtle); }
.panel-header > div { gap: 8px; }
button { min-width: 40px; min-height: 40px; border: 0; border-radius: var(--v2-radius-md); color: inherit; background: transparent; cursor: pointer; transition: color var(--v2-duration-fast), background-color var(--v2-duration-fast), transform var(--v2-duration-fast); }
button:active:not(:disabled) { transform: scale(var(--v2-press-scale)); }
button:focus-visible, input:focus-visible, .panel-resizer:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
button:disabled { opacity: .45; cursor: not-allowed; }
.resource-tabs { gap: 2px; padding: 8px; border-bottom: 1px solid var(--v2-border-subtle); }
.resource-tabs button { display: flex; min-width: 0; flex: 1; gap: 6px; justify-content: center; padding: 0 8px; color: var(--text-secondary); font-size: 12px; }
.resource-tabs button[aria-selected="true"] { color: var(--v2-accent); background: var(--v2-accent-soft); }
.resource-content { min-height: 0; flex: 1; overflow: auto; padding: 12px; overscroll-behavior: contain; }
.resource-toolbar, .capture-row { margin-bottom: 12px; }
.primary-action, .insert-action { gap: 7px; justify-content: center; padding: 0 12px; }
.primary-action { color: var(--v2-text-on-accent); background: var(--v2-accent); }
.resource-list { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
.asset-card { display: grid; grid-template-columns: 72px minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 9px; border: 1px solid var(--v2-border-subtle); border-radius: var(--v2-radius-md); background: var(--v2-surface-1); }
.asset-card img, .asset-card video, .media-placeholder { width: 72px; height: 56px; border-radius: var(--v2-radius-sm); object-fit: cover; background: var(--v2-canvas); }
.asset-card audio { width: 72px; }
.media-placeholder { display: grid; place-items: center; color: var(--text-muted); font-size: 9px; text-align: center; }
.media-placeholder span { display: block; }
.resource-copy { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.resource-copy strong, .resource-copy span, .resource-copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.resource-copy strong { font-size: 12px; }
.resource-copy span, .resource-copy small, .empty-state { color: var(--v2-text-secondary); font-size: 11px; }
.template-card, .task-list li { gap: 10px; min-height: 64px; padding: 9px 10px; border: 1px solid var(--v2-border-subtle); border-radius: var(--v2-radius-md); background: var(--v2-surface-1); }
.template-card .resource-copy, .task-list .resource-copy { flex: 1; }
.task-list li.is-failed, .task-list li.is-timed_out { border-color: var(--danger); }
.resource-message { display: flex; align-items: center; gap: 8px; margin: 12px; padding: 10px; border-radius: var(--v2-radius-md); color: var(--v2-text-secondary); background: var(--v2-surface-1); font-size: 12px; }
.resource-message.is-error { color: var(--v2-danger); }
.capture-row form { display: flex; align-items: end; gap: 6px; }
.capture-row label { display: grid; gap: 4px; color: var(--v2-text-secondary); font-size: 11px; }
.capture-row input { min-height: 40px; min-width: 0; padding: 0 10px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-md); color: var(--v2-text-primary); background: var(--v2-canvas); }
.panel-resizer { position: absolute; z-index: 2; top: 0; right: -40px; bottom: 0; width: 40px; cursor: ew-resize; touch-action: none; user-select: none; }
.panel-resizer::after { position: absolute; top: 40%; left: 0; width: 2px; height: 64px; border-radius: 2px; background: var(--v2-border-standard); content: ''; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.is-spinning { animation: resource-spin 900ms linear infinite; }
@keyframes resource-spin { to { transform: rotate(360deg); } }
@media (hover: hover) { button:not(:disabled):hover { color: var(--v2-accent); background: var(--v2-surface-3); } .primary-action:hover { color: var(--v2-text-on-accent); background: var(--v2-accent-hover); } }
@media (prefers-reduced-motion: reduce) { button { transition: none; } button:active:not(:disabled) { transform: none; } .is-spinning { animation: none; } }
</style>
