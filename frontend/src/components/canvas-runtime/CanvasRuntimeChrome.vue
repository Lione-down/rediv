<script setup lang="ts">
import {
  AudioWaveform,
  ChevronDown,
  Clapperboard,
  FolderOpen,
  Image,
  LayoutTemplate,
  Maximize2,
  MessageSquareText,
  Minus,
  Plus,
  Redo2,
  ScrollText,
  Share2,
  Type,
  Undo2,
  Video,
  Workflow,
} from 'lucide-vue-next'
import { computed, ref } from 'vue'
import AccountSessionMenu from '../layout/account-session-menu.vue'
import type { CanvasMetadataDto } from '../../modules/canvas/types'
import type { ProjectAsset } from '../../modules/canvas/project-resource-types'
import type { ReplacementCanvasView } from './CanvasReplacementRuntime.vue'

type ReplacementToolId =
  | 'text'
  | 'script'
  | 'image-generation'
  | 'video-generation'
  | 'video-composition'
  | 'audio-generation'

const props = defineProps<{
  accountName: string
  allowedAudioModelCount: number
  assets: readonly ProjectAsset[]
  canRedo: boolean
  canUndo: boolean
  canvasCount: number
  canvasName: string
  canvases: readonly CanvasMetadataDto[]
  documentReady: boolean
  projectName: string
  syncLabel: string
  viewMode: ReplacementCanvasView
  zoomPercent: string
}>()

const emit = defineEmits<{
  changeZoom: [delta: number]
  createNode: [toolId: ReplacementToolId]
  fitAll: []
  openAssist: [opener: HTMLElement]
  openTemplates: [opener: HTMLElement]
  redo: []
  switchCanvas: [canvasId: string]
  undo: []
  updateViewMode: [mode: ReplacementCanvasView]
}>()

const isCanvasMenuOpen = ref(false)
const isAssetLibraryOpen = ref(false)
const isShareOpen = ref(false)
const shareStatus = ref('')
const authoringTools = computed(() => [
  { id: 'text' as const, label: '文本', icon: Type, disabled: false },
  { id: 'script' as const, label: '脚本', icon: ScrollText, disabled: false },
  { id: 'image-generation' as const, label: '图片生成', icon: Image, disabled: false },
  { id: 'video-generation' as const, label: '视频生成', icon: Video, disabled: false },
  { id: 'video-composition' as const, label: '视频合成', icon: Clapperboard, disabled: false },
  {
    id: 'audio-generation' as const,
    label: props.allowedAudioModelCount > 0 ? '音频生成' : '音频生成，当前无兼容模型',
    icon: AudioWaveform,
    disabled: props.allowedAudioModelCount === 0,
  },
])

function selectCanvas(canvasId: string) {
  isCanvasMenuOpen.value = false
  emit('switchCanvas', canvasId)
}

async function copyCanvasLink() {
  shareStatus.value = ''
  try {
    await navigator.clipboard.writeText(window.location.href)
    shareStatus.value = '链接已复制'
  } catch {
    shareStatus.value = '浏览器未允许复制，请从地址栏复制当前链接。'
  }
}

function openAssist(event: MouseEvent) {
  const opener = event.currentTarget
  if (opener instanceof HTMLElement) emit('openAssist', opener)
}

function openTemplates(event: MouseEvent) {
  const opener = event.currentTarget
  if (opener instanceof HTMLElement) emit('openTemplates', opener)
}
</script>

<template>
  <nav class="replacement-runtime__project" aria-label="项目与画布">
    <button type="button" aria-label="选择项目与画布" @click="isCanvasMenuOpen = !isCanvasMenuOpen">
      <span class="replacement-runtime__mark" aria-hidden="true">R</span>
      <span class="replacement-runtime__project-copy">
        <strong>{{ canvasName || '画布' }}</strong>
        <small>{{ projectName }} · {{ canvasCount }} 个画布</small>
      </span>
      <ChevronDown :size="15" aria-hidden="true" />
    </button>
    <div v-if="isCanvasMenuOpen" class="replacement-runtime__canvas-menu" data-canvas-menu>
      <span>{{ projectName }}</span>
      <button
        v-for="canvas in canvases"
        :key="canvas.id"
        type="button"
        :aria-current="canvas.name === canvasName ? 'page' : undefined"
        @click="selectCanvas(canvas.id)"
      >
        {{ canvas.name }}
      </button>
    </div>
  </nav>

  <div class="replacement-runtime__view-switch" role="group" aria-label="画布视图">
    <button
      type="button"
      :aria-pressed="viewMode === 'workflow'"
      @click="emit('updateViewMode', 'workflow')"
    >
      <Workflow :size="15" aria-hidden="true" />
      工作流
    </button>
    <button
      type="button"
      :aria-pressed="viewMode === 'storyboard'"
      @click="emit('updateViewMode', 'storyboard')"
    >
      <Clapperboard :size="15" aria-hidden="true" />
      故事板
    </button>
  </div>

  <div class="replacement-runtime__account" role="group" aria-label="画布协作与账户">
    <span class="replacement-runtime__sync" role="status">{{ syncLabel }}</span>
    <button type="button" aria-label="分享画布" @click="isShareOpen = !isShareOpen">
      <Share2 :size="16" aria-hidden="true" />
    </button>
    <AccountSessionMenu :compact="true" :display-name="accountName" />
    <section
      v-if="isShareOpen"
      class="replacement-runtime__share-dialog"
      role="dialog"
      aria-label="分享画布"
    >
      <strong>分享当前画布</strong>
      <p>复制当前项目与画布链接。</p>
      <button type="button" @click="copyCanvasLink">复制画布链接</button>
      <small v-if="shareStatus" role="status">{{ shareStatus }}</small>
      <button type="button" aria-label="关闭分享画布" @click="isShareOpen = false">×</button>
    </section>
  </div>

  <div class="replacement-runtime__utilities" role="group" aria-label="资源与视图控制">
    <button type="button" aria-label="打开模板库" @click="openTemplates">
      <LayoutTemplate :size="17" aria-hidden="true" />
    </button>
    <button type="button" aria-label="打开素材库" @click="isAssetLibraryOpen = true">
      <FolderOpen :size="17" aria-hidden="true" />
    </button>
    <span aria-hidden="true"></span>
    <button type="button" aria-label="缩小画布" @click="emit('changeZoom', -0.1)">
      <Minus :size="16" aria-hidden="true" />
    </button>
    <output aria-label="当前缩放">{{ zoomPercent }}</output>
    <button type="button" aria-label="放大画布" @click="emit('changeZoom', 0.1)">
      <Plus :size="16" aria-hidden="true" />
    </button>
    <button type="button" aria-label="适应全部内容" @click="emit('fitAll')">
      <Maximize2 :size="16" aria-hidden="true" />
    </button>
  </div>

  <aside
    v-if="isAssetLibraryOpen"
    class="replacement-runtime__asset-library"
    data-asset-library
    aria-label="素材库"
  >
    <header>
      <div>
        <span>Assets</span>
        <strong>素材与引用</strong>
      </div>
      <button type="button" aria-label="关闭素材库" @click="isAssetLibraryOpen = false">×</button>
    </header>
    <p>素材只用于导入、引用与复用，不会创建 Result 节点。</p>
    <div class="replacement-runtime__asset-list">
      <article v-for="asset in assets" :key="asset.id">
        <div>
          <img v-if="asset.url && asset.type === 'image'" :src="asset.url" alt="" />
          <span v-else aria-hidden="true"><FolderOpen :size="18" /></span>
        </div>
        <p>{{ asset.content_text || asset.url || '未命名素材' }}</p>
        <small>{{ asset.type }}</small>
      </article>
      <p v-if="assets.length === 0">当前项目还没有素材。</p>
    </div>
  </aside>

  <div class="replacement-runtime__dock-shell">
    <div class="replacement-runtime__history" role="group" aria-label="历史操作">
      <button type="button" aria-label="撤销" :disabled="!canUndo" @click="emit('undo')">
        <Undo2 :size="16" aria-hidden="true" />
      </button>
      <button type="button" aria-label="重做" :disabled="!canRedo" @click="emit('redo')">
        <Redo2 :size="16" aria-hidden="true" />
      </button>
    </div>
    <div class="replacement-runtime__dock" role="toolbar" aria-label="画布创作工具">
      <button
        v-for="tool in authoringTools"
        :key="tool.id"
        type="button"
        :aria-label="tool.label"
        :disabled="tool.disabled"
        :data-tool="tool.id"
        @click="emit('createNode', tool.id)"
      >
        <component :is="tool.icon" :size="18" aria-hidden="true" />
        <span>{{ tool.id === 'audio-generation' ? '音频' : tool.label }}</span>
      </button>
    </div>
    <button
      class="replacement-runtime__assist"
      type="button"
      aria-label="创作帮助"
      @click="openAssist"
    >
      <MessageSquareText :size="17" aria-hidden="true" />
    </button>
  </div>

  <p v-if="!documentReady" class="replacement-runtime__loading" role="status">
    正在载入画布…
  </p>
</template>
