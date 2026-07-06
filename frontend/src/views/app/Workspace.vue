<script setup lang="ts">
import { isAxiosError } from 'axios'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { NDrawer, NDrawerContent, useMessage } from 'naive-ui'
import { request } from '../../api/request'
import AppTopBar from '../../components/layout/AppTopBar.vue'
import CanvasStage from '../../components/canvas/CanvasStage.vue'
import WorkspaceToolRail from './components/workspace/WorkspaceToolRail.vue'
import WorkspaceInspector from './components/workspace/WorkspaceInspector.vue'
import WorkspacePromptDock from './components/workspace/WorkspacePromptDock.vue'
import WorkspaceStatusBar from './components/workspace/WorkspaceStatusBar.vue'
import { useAssetStore } from '../../store/assets'
import { useAuthStore } from '../../store/auth'
import { useCanvasStore } from '../../store/canvas'
import type { Asset } from '../../types/asset'
import type { CanvasNode } from '../../types/canvas'

type WorkspaceTab = 'assets' | 'templates' | 'properties'
type QuotaType = 'text' | 'image' | 'video'
type ToolKey = 'select' | 'hand' | 'text' | 'image' | 'generate'

interface GenerationOutcome {
  asset?: Asset
  successMessage: string
  updatedContent?: string
}

const route = useRoute()
const message = useMessage()
const authStore = useAuthStore()
const assetStore = useAssetStore()
const canvasStore = useCanvasStore()

// Project context from route query (not hardcoded)
const projectId = computed(() => (route.query.project_id as string) || '')
const projectContext = computed(() => projectId.value || '未选择项目')

const activeTab = ref<WorkspaceTab>('assets')
const isMobilePanelOpen = ref(false)
const isGenerating = ref(false)
const lastErrorMessage = ref('')
const lastSuccessMessage = ref('')

const templates = [
  { id: 'tpl-shot', name: '镜头脚本', description: '先产出节奏与分镜结构。' },
  { id: 'tpl-style', name: '风格对齐', description: '先锁定角色、场景和质感。' },
  { id: 'tpl-output', name: '生成链路', description: '把素材、模型和结果收成一条链。' },
]

const statusTextMap: Record<NonNullable<CanvasNode['status']>, string> = {
  idle: '待生成',
  selected: '已选中',
  running: '运行中',
  success: '已完成',
  warning: '需处理',
}

const selectedNode = computed(() => canvasStore.selectedNode)
const selectedTitle = computed(() => selectedNode.value?.title || '未选中节点')
const selectedNodeType = computed(() => selectedNode.value?.type || '未选择')
const selectedNodeStatus = computed(() => {
  const status = selectedNode.value?.status || 'idle'
  return statusTextMap[status]
})
const visibleAssets = computed(() => assetStore.items.slice(0, 4))
const activeToolLabel = computed(() => {
  const toolMap: Record<ToolKey, string> = {
    select: '选择',
    hand: '移动',
    text: '文本',
    image: '图片',
    generate: '生成',
  }
  return toolMap[canvasStore.mode as ToolKey] || '选择'
})
const selectedQuotaType = computed<QuotaType | null>(() => getQuotaType(selectedNode.value))
const selectedQuotaRemaining = computed(() => {
  if (!selectedQuotaType.value) return null
  return authStore.quotas[selectedQuotaType.value]
})
const isQuotaInsufficient = computed(() => {
  if (selectedQuotaRemaining.value == null) return false
  return selectedQuotaRemaining.value < 1
})
const generationButtonLabel = computed(() => (isGenerating.value ? '生成中' : '立即生成'))

function setActiveTab(tab: WorkspaceTab) {
  activeTab.value = tab
  isMobilePanelOpen.value = true
}

function toggleMobilePanel() {
  isMobilePanelOpen.value = !isMobilePanelOpen.value
}

function getQuotaType(node: CanvasNode | null): QuotaType | null {
  if (!node) return null
  if (node.type === 'image' || node.type === 'model') return 'image'
  if (node.type === 'video') return 'video'
  if (node.type === 'text') return 'text'
  return null
}

function buildPrompt(node: CanvasNode) {
  return node.content?.trim() || node.title.trim()
}

function extractErrorMessage(error: unknown) {
  if (isAxiosError<{ detail?: string }>(error)) {
    return error.response?.data?.detail || error.message || '生成失败，请稍后重试。'
  }
  if (error instanceof Error) return error.message
  return '生成失败，请稍后重试。'
}

function prependAsset(asset?: Asset) {
  if (!asset?.id) return
  assetStore.items = [asset, ...assetStore.items.filter((item) => item.id !== asset.id)]
}

function consumeQuota(quotaType: QuotaType) {
  authStore.quotas = {
    ...authStore.quotas,
    [quotaType]: Math.max(0, authStore.quotas[quotaType] - 1),
  }
}

async function requestGeneration(node: CanvasNode): Promise<GenerationOutcome> {
  const prompt = buildPrompt(node)

  if (node.type === 'text') {
    throw new Error('当前工作流页尚未接入真实 project_id，文本节点暂不能直连 Agnes 文本生成接口。')
  }

  if (node.type === 'image' || node.type === 'model') {
    const response = await request.post('/api/image-generate', { prompt })
    const asset = response.data.asset as Asset | undefined
    return {
      asset,
      successMessage: '图片生成完成，结果已写入资产区。',
      updatedContent: asset?.url ? '关键帧已生成，可在 Assets 面板查看。' : '图片生成已完成。',
    }
  }

  if (node.type === 'video') {
    const response = await request.post('/api/video-generate', { prompt })
    const asset = response.data.asset as Asset | undefined
    return {
      asset,
      successMessage: '视频生成完成，结果已写入资产区。',
      updatedContent: asset?.url ? '视频任务已完成，可在 Assets 面板查看。' : '视频生成已完成。',
    }
  }

  throw new Error('当前节点类型暂不支持生成。')
}

async function handleGenerate() {
  const node = selectedNode.value
  const quotaType = selectedQuotaType.value

  if (!node) {
    message.warning('请先选择一个节点。')
    return
  }

  if (!projectId.value) {
    message.warning('请先选择一个项目后再执行生成操作。')
    return
  }

  if (!quotaType) {
    canvasStore.setNodeStatus(node.id, 'warning')
    lastErrorMessage.value = '当前节点类型暂不支持生成。'
    lastSuccessMessage.value = ''
    message.warning(lastErrorMessage.value)
    return
  }

  if (isQuotaInsufficient.value) {
    canvasStore.setNodeStatus(node.id, 'warning')
    lastErrorMessage.value = `${quotaType} quota 不足，当前生成已阻止。`
    lastSuccessMessage.value = ''
    message.warning(lastErrorMessage.value)
    return
  }

  isGenerating.value = true
  lastErrorMessage.value = ''
  lastSuccessMessage.value = ''
  canvasStore.setNodeStatus(node.id, 'running')

  try {
    const outcome = await requestGeneration(node)
    prependAsset(outcome.asset)
    consumeQuota(quotaType)
    canvasStore.setNodeStatus(node.id, 'success')

    if (outcome.updatedContent) {
      canvasStore.setNodeContent(node.id, outcome.updatedContent)
    }

    lastSuccessMessage.value = outcome.successMessage
    message.success(outcome.successMessage)
  } catch (error) {
    const detail = extractErrorMessage(error)
    canvasStore.setNodeStatus(node.id, 'warning')
    lastErrorMessage.value = detail
    message.error(detail)
  } finally {
    isGenerating.value = false
  }
}
</script>

<template>
  <main class="workspace-page">
    <AppTopBar />

    <div class="workspace-shell">
      <!-- Tool Rail: 76px absolute overlay on left -->
      <WorkspaceToolRail
        :active-tool="canvasStore.mode as ToolKey"
        :on-tool-change="(tool: ToolKey) => canvasStore.setMode(tool)"
      />

      <!-- Canvas Column -->
      <section class="canvas-column" aria-label="工作流主舞台">
        <WorkspaceStatusBar
          :project-context="projectContext"
          :active-tool-label="activeToolLabel"
          :is-mobile-panel-open="isMobilePanelOpen"
          :on-toggle-panel="toggleMobilePanel"
        />

        <div class="stage-frame">
          <CanvasStage />
        </div>
      </section>

      <!-- Desktop Inspector (320px right panel) -->
      <WorkspaceInspector
        :active-tab="activeTab"
        :visible-assets="visibleAssets"
        :templates="templates"
        :selected-node="selectedNode"
        :selected-title="selectedTitle"
        :selected-node-type="selectedNodeType"
        :selected-node-status="selectedNodeStatus"
        :active-tool-label="activeToolLabel"
        :selected-quota-type="selectedQuotaType"
        :selected-quota-remaining="selectedQuotaRemaining"
        :is-quota-insufficient="isQuotaInsufficient"
        :last-error-message="lastErrorMessage"
        :last-success-message="lastSuccessMessage"
        :auth-quotas="authStore.quotas"
        :on-tab-change="setActiveTab"
        :drawer-open="false"
        :on-drawer-close="() => {}"
      />
    </div>

    <!-- Prompt Dock -->
    <WorkspacePromptDock
      :selected-node="selectedNode"
      :selected-title="selectedTitle"
      :is-quota-insufficient="isQuotaInsufficient"
      :is-generating="isGenerating"
      :generation-button-label="generationButtonLabel"
      :last-error-message="lastErrorMessage"
      :drawer-open="isMobilePanelOpen"
      :on-toggle-panel="toggleMobilePanel"
      :on-generate="handleGenerate"
    />

    <!-- Mobile Inspector Drawer (below 920px) -->
    <NDrawer v-model:show="isMobilePanelOpen" placement="bottom" :height="isMobilePanelOpen ? '60dvh' : 'auto'">
      <NDrawerContent closable>
        <WorkspaceInspector
          :active-tab="activeTab"
          :visible-assets="visibleAssets"
          :templates="templates"
          :selected-node="selectedNode"
          :selected-title="selectedTitle"
          :selected-node-type="selectedNodeType"
          :selected-node-status="selectedNodeStatus"
          :active-tool-label="activeToolLabel"
          :selected-quota-type="selectedQuotaType"
          :selected-quota-remaining="selectedQuotaRemaining"
          :is-quota-insufficient="isQuotaInsufficient"
          :last-error-message="lastErrorMessage"
          :last-success-message="lastSuccessMessage"
          :auth-quotas="authStore.quotas"
          :on-tab-change="setActiveTab"
          :drawer-open="isMobilePanelOpen"
          :on-drawer-close="() => { isMobilePanelOpen = false }"
        />
      </NDrawerContent>
    </NDrawer>
  </main>
</template>

<style scoped lang="scss">
.workspace-page {
  min-height: 100dvh;
  background: var(--bg-app);
}

.workspace-shell {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  min-height: calc(100dvh - 52px);
}

.canvas-column {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
}

.stage-frame {
  position: relative;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 920px) {
  .workspace-page {
    padding-bottom: 166px;
  }

  .workspace-shell {
    grid-template-columns: 1fr;
  }

  .canvas-column {
    min-height: calc(100dvh - 52px - 166px);
  }
}

@media (max-width: 560px) {
  .canvas-column {
    min-height: calc(100dvh - 52px - 164px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .workspace-page,
  .workspace-shell,
  .canvas-column,
  .stage-frame {
    transition-duration: 0s;
  }
}
</style>
