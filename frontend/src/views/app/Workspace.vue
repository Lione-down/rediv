<script setup lang="ts">
import { isAxiosError } from 'axios'
import { computed, ref } from 'vue'
import { NButton, NTag, useMessage } from 'naive-ui'
import {
  AlertTriangle,
  Database,
  Hand,
  Image as ImageIcon,
  MousePointer2,
  PanelsTopLeft,
  Play,
  Sparkles,
  Type,
  WandSparkles,
} from 'lucide-vue-next'
import { request } from '../../api/request'
import AppTopBar from '../../components/layout/AppTopBar.vue'
import CanvasStage from '../../components/canvas/CanvasStage.vue'
import { useAssetStore } from '../../store/assets'
import { useAuthStore } from '../../store/auth'
import { useCanvasStore } from '../../store/canvas'
import type { Asset } from '../../types/asset'
import type { CanvasNode } from '../../types/canvas'

type WorkspaceTab = 'assets' | 'templates' | 'properties'
type QuotaType = 'text' | 'image' | 'video'

interface GenerationOutcome {
  asset?: Asset
  successMessage: string
  updatedContent?: string
}

const PROJECT_NAME = '午夜车站概念片'

const message = useMessage()
const authStore = useAuthStore()
const assetStore = useAssetStore()
const canvasStore = useCanvasStore()

const activeTab = ref<WorkspaceTab>('assets')
const isMobilePanelOpen = ref(false)
const isGenerating = ref(false)
const lastErrorMessage = ref('')
const lastSuccessMessage = ref('')

const tools = [
  { key: 'select', label: '选择', icon: MousePointer2 },
  { key: 'hand', label: '移动', icon: Hand },
  { key: 'text', label: '文本', icon: Type },
  { key: 'image', label: '图片', icon: ImageIcon },
  { key: 'generate', label: '生成', icon: Sparkles },
] as const

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
const activeToolLabel = computed(() => tools.find((tool) => tool.key === canvasStore.mode)?.label || '选择')
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
  if (error instanceof Error) {
    return error.message
  }

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
      <aside class="tool-rail" aria-label="画布工具">
        <button
          v-for="tool in tools"
          :key="tool.key"
          class="tool-button focus-ring"
          :class="{ active: canvasStore.mode === tool.key }"
          type="button"
          :title="tool.label"
          :aria-label="tool.label"
          :aria-pressed="canvasStore.mode === tool.key"
          @click="canvasStore.setMode(tool.key)"
        >
          <component :is="tool.icon" :size="18" />
        </button>
      </aside>

      <section class="canvas-column" aria-label="工作流主舞台">
        <div class="canvas-chrome">
          <div>
            <p class="eyebrow">当前项目</p>
            <h1>{{ PROJECT_NAME }}</h1>
          </div>
          <div class="canvas-status">
            <span class="status-pill">{{ activeToolLabel }}模式</span>
            <button
              class="mobile-panel-toggle focus-ring"
              type="button"
              :aria-expanded="isMobilePanelOpen"
              aria-controls="workspace-side-panel"
              @click="toggleMobilePanel"
            >
              <PanelsTopLeft :size="16" />
              面板
            </button>
          </div>
        </div>

        <div class="stage-frame">
          <CanvasStage />
        </div>
      </section>

      <aside
        id="workspace-side-panel"
        class="right-panel"
        :class="{ 'mobile-open': isMobilePanelOpen }"
        aria-label="资产与属性"
      >
        <div class="panel-tabs" role="tablist" aria-label="工作台面板">
          <button
            class="panel-tab focus-ring"
            :class="{ active: activeTab === 'assets' }"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'assets'"
            @click="setActiveTab('assets')"
          >
            Assets
          </button>
          <button
            class="panel-tab focus-ring"
            :class="{ active: activeTab === 'templates' }"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'templates'"
            @click="setActiveTab('templates')"
          >
            Templates
          </button>
          <button
            class="panel-tab focus-ring"
            :class="{ active: activeTab === 'properties' }"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'properties'"
            @click="setActiveTab('properties')"
          >
            Properties
          </button>
        </div>

        <div class="panel-body">
          <template v-if="activeTab === 'assets'">
            <section class="panel-section">
              <div class="section-heading">
                <div>
                  <p class="panel-label">个人资产</p>
                  <h2>最近素材</h2>
                </div>
                <span class="count-pill">{{ assetStore.items.length }}</span>
              </div>

              <div class="asset-grid">
                <article v-for="asset in visibleAssets" :key="asset.id" class="asset-card">
                  <div class="asset-thumb">
                    <Database :size="16" />
                  </div>
                  <strong>{{ asset.content_text || asset.type }}</strong>
                  <span>{{ asset.source }} · {{ asset.status }}</span>
                </article>
              </div>
            </section>
          </template>

          <template v-else-if="activeTab === 'templates'">
            <section class="panel-section">
              <p class="panel-label">模板库</p>
              <div class="template-list">
                <article v-for="template in templates" :key="template.id" class="template-card">
                  <strong>{{ template.name }}</strong>
                  <p>{{ template.description }}</p>
                </article>
              </div>
            </section>
          </template>

          <template v-else>
            <section class="panel-section">
              <p class="panel-label">节点属性</p>
              <h2>{{ selectedTitle }}</h2>
              <div class="property-list">
                <div class="property-row">
                  <span>类型</span>
                  <strong>{{ selectedNodeType }}</strong>
                </div>
                <div class="property-row">
                  <span>状态</span>
                  <strong>{{ selectedNodeStatus }}</strong>
                </div>
                <div class="property-row">
                  <span>模式</span>
                  <strong>{{ activeToolLabel }}</strong>
                </div>
                <div v-if="selectedQuotaType" class="property-row">
                  <span>剩余额度</span>
                  <strong>{{ selectedQuotaRemaining }}</strong>
                </div>
              </div>
              <p class="muted">后续节点参数、模型配置和输出控制会在这里继续承接。</p>

              <div v-if="lastErrorMessage" class="inline-feedback inline-feedback-error">
                <AlertTriangle :size="15" />
                <span>{{ lastErrorMessage }}</span>
              </div>
              <div v-else-if="lastSuccessMessage" class="inline-feedback inline-feedback-success">
                <Sparkles :size="15" />
                <span>{{ lastSuccessMessage }}</span>
              </div>
            </section>
          </template>
        </div>

        <section class="panel-section quota-section">
          <div class="section-heading">
            <div>
              <p class="panel-label">今日额度</p>
              <h2>Quota</h2>
            </div>
          </div>
          <div class="quota-grid">
            <span>文本 {{ authStore.quotas.text }}</span>
            <span>图片 {{ authStore.quotas.image }}</span>
            <span>视频 {{ authStore.quotas.video }}</span>
          </div>
        </section>
      </aside>
    </div>

    <footer class="prompt-dock">
      <div class="dock-copy">
        <WandSparkles :size="18" />
        <span>{{ selectedNode ? `继续处理「${selectedTitle}」节点的生成任务。` : '请选择一个节点后开始生成。' }}</span>
      </div>
      <div class="dock-actions">
        <div v-if="isQuotaInsufficient" class="quota-warning">
          <n-tag type="warning" size="small" round>
            额度不足
          </n-tag>
        </div>
        <button class="panel-action focus-ring" type="button" @click="toggleMobilePanel">
          <PanelsTopLeft :size="16" />
          面板
        </button>
        <n-button
          class="generate-action focus-ring"
          strong
          :loading="isGenerating"
          :disabled="!selectedNode"
          @click="handleGenerate"
        >
          <template #icon>
            <Play :size="17" />
          </template>
          {{ generationButtonLabel }}
        </n-button>
      </div>
      <div v-if="lastErrorMessage" class="dock-feedback dock-feedback-error">
        <AlertTriangle :size="15" />
        <span>{{ lastErrorMessage }}</span>
      </div>
    </footer>
  </main>
</template>

<style scoped lang="scss">
.workspace-page {
  min-height: 100dvh;
  background: var(--bg-app);
}

.workspace-shell {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) minmax(280px, 320px);
  min-height: calc(100dvh - 52px);
}

.tool-rail {
  display: grid;
  align-content: start;
  justify-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-2);
  border-right: 1px solid var(--border-subtle);
  background: var(--bg-panel);
}

.tool-button {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 0;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  background: transparent;
  transition:
    color 120ms ease,
    background-color 120ms ease,
    box-shadow 120ms ease,
    transform 120ms ease;
}

.tool-button:hover,
.tool-button.active {
  color: var(--text-primary);
  background: oklch(58% 0.115 252 / 0.12);
}

.tool-button:active {
  transform: scale(0.96);
}

.canvas-column {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
}

.canvas-chrome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-4);
  padding: 14px 18px var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
  background: oklch(100% 0.004 92 / 0.64);
}

.eyebrow,
.panel-label {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--font-size-hint);
  line-height: var(--line-height-hint);
}

.canvas-chrome h1,
.right-panel h2 {
  margin: 4px 0 0;
  font-size: var(--font-size-panel-heading);
  font-weight: var(--font-weight-panel-heading);
  line-height: var(--line-height-panel-heading);
}

.canvas-status {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.status-pill,
.count-pill {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  border-radius: var(--radius-pill);
  padding: 0 10px;
  background: var(--bg-panel-subtle);
  color: var(--text-secondary);
  font-size: var(--font-size-hint);
}

.stage-frame {
  position: relative;
  min-height: 0;
  overflow: hidden;
}

.right-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: minmax(280px, 320px);
  min-width: 280px;
  max-width: 360px;
  border-left: 1px solid var(--border-subtle);
  background: var(--bg-panel);
}

.panel-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 14px var(--space-4) var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
  min-width: 0;
}

.panel-tab {
  min-height: 34px;
  border: 0;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  background: transparent;
  transition:
    color 120ms ease,
    background-color 120ms ease,
    transform 120ms ease;
}

.panel-tab:hover,
.panel-tab.active {
  color: var(--text-primary);
  background: var(--bg-panel-subtle);
}

.panel-tab:active,
.mobile-panel-toggle:active,
.panel-action:active {
  transform: scale(0.96);
}

.panel-body {
  min-height: 0;
  overflow: auto;
  padding: var(--space-4);
}

.panel-section {
  display: grid;
  gap: 14px;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.section-heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 10px;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.asset-card,
.template-card {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-panel-subtle);
}

.asset-thumb {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: var(--radius-sm);
  color: var(--accent-select);
  background: oklch(58% 0.115 252 / 0.1);
}

.asset-card strong,
.template-card strong,
.property-row strong {
  font-size: 13px;
  line-height: 1.45;
}

.asset-card span,
.template-card p,
.muted,
.property-row span {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-hint);
  line-height: 1.55;
}

.template-list,
.property-list {
  display: grid;
  gap: 10px;
}

.property-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
}

.inline-feedback,
.dock-feedback {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.5;
}

.inline-feedback-error,
.dock-feedback-error {
  color: var(--danger);
  background: color-mix(in oklch, var(--danger) 12%, white 88%);
}

.inline-feedback-success {
  color: var(--success);
  background: color-mix(in oklch, var(--success) 12%, white 88%);
}

.quota-section {
  border-bottom: 0;
}

.quota-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
}

.quota-grid span {
  display: grid;
  place-items: center;
  min-height: 48px;
  border-radius: var(--radius-sm);
  background: var(--bg-panel-subtle);
  color: var(--text-secondary);
  font-size: var(--font-size-hint);
  text-align: center;
}

.mobile-panel-toggle,
.panel-action {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 0;
  border-radius: var(--radius-sm);
  padding: 0 var(--space-3);
  color: var(--text-secondary);
  background: var(--bg-panel-subtle);
  transition:
    color 120ms ease,
    background-color 120ms ease,
    box-shadow 120ms ease,
    transform 120ms ease;
}

.generate-action {
  --n-border: none;
  --n-border-hover: none;
  --n-border-pressed: none;
  --n-border-focus: none;
  --n-color: var(--accent-generate);
  --n-color-hover: var(--accent-generate-hover);
  --n-color-pressed: var(--accent-generate-hover);
  --n-color-focus: var(--accent-generate-hover);
  --n-text-color: white;
  --n-text-color-hover: white;
  --n-text-color-pressed: white;
  --n-text-color-focus: white;
  --n-border-radius: var(--radius-sm);
  --n-padding: 0 14px;
  --n-height: 38px;
  --n-font-weight: 600;
}

.prompt-dock {
  position: fixed;
  right: 340px;
  bottom: 18px;
  left: 88px;
  z-index: 12;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px 14px;
  min-height: 58px;
  padding: 9px 10px 9px var(--space-4);
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  background: oklch(100% 0.004 92 / 0.88);
  box-shadow: var(--shadow-soft);
}

.dock-copy,
.dock-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.dock-copy {
  min-width: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.dock-copy span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dock-actions {
  justify-content: flex-end;
}

.quota-warning {
  display: inline-flex;
  align-items: center;
}

.dock-feedback {
  grid-column: 1 / -1;
}

.mobile-panel-toggle,
.panel-action {
  display: none;
}

@media (max-width: 920px) {
  .workspace-page {
    padding-bottom: 166px;
  }

  .workspace-shell {
    grid-template-columns: 1fr;
  }

  .tool-rail {
    position: fixed;
    right: 12px;
    bottom: 12px;
    left: 12px;
    z-index: 18;
    display: flex;
    justify-content: space-between;
    padding: 8px 10px calc(8px + env(safe-area-inset-bottom, 0px));
    border: 1px solid var(--border-subtle);
    border-radius: 18px;
    background: oklch(100% 0.004 92 / 0.92);
    box-shadow: var(--shadow-soft);
  }

  .canvas-chrome {
    padding: 12px 14px 10px;
  }

  .canvas-chrome h1 {
    font-size: 14px;
  }

  .status-pill {
    display: none;
  }

  .mobile-panel-toggle,
  .panel-action {
    display: inline-flex;
  }

  .right-panel {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 20;
    width: auto;
    min-width: 0;
    max-width: none;
    max-height: 60dvh;
    border-top: 1px solid var(--border-subtle);
    border-left: 0;
    border-radius: 18px 18px 0 0;
    transform: translateY(calc(100% - 56px));
    transition: transform 160ms ease;
    box-shadow: 0 -18px 40px oklch(20% 0.02 245 / 0.08);
  }

  .right-panel.mobile-open {
    transform: translateY(0);
  }

  .panel-body {
    padding-bottom: var(--space-6);
  }

  .asset-grid {
    grid-template-columns: 1fr 1fr;
  }

  .prompt-dock {
    right: 12px;
    bottom: 86px;
    left: 12px;
    grid-template-columns: 1fr;
    padding: 12px;
  }

  .dock-copy,
  .dock-actions {
    width: 100%;
  }

  .dock-actions {
    flex-wrap: wrap;
    justify-content: stretch;
  }

  .dock-actions > * {
    flex: 1;
  }
}

@media (max-width: 560px) {
  .canvas-chrome {
    gap: 12px;
    padding: 12px 12px 10px;
  }

  .canvas-status {
    width: 100%;
    justify-content: space-between;
  }

  .panel-tabs {
    padding: 12px 12px 10px;
  }

  .panel-body,
  .panel-section {
    padding-left: 12px;
    padding-right: 12px;
  }

  .asset-grid,
  .quota-grid {
    grid-template-columns: 1fr;
  }

  .prompt-dock {
    bottom: 84px;
    padding: 10px;
    border-radius: 16px;
  }

  .dock-copy {
    font-size: 13px;
  }
}
</style>
