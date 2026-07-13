<script setup lang="ts">
import { isAxiosError } from 'axios'
import { AlertTriangle, CircleCheck, CircleHelp, History, LoaderCircle, Play, UserRound, WandSparkles } from 'lucide-vue-next'
import { darkTheme, NConfigProvider } from 'naive-ui'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { request } from '../../api/request'
import { v2CanvasNaiveTheme } from '../../assets/styles/v2-canvas-naive-theme'
import CanvasIdentityBar from '../../components/canvas/CanvasIdentityBar.vue'
import CanvasRevisionPanel from '../../components/canvas/CanvasRevisionPanel.vue'
import CanvasStage from '../../components/canvas/CanvasStage.vue'
import { useCanvasPersistenceLifecycle } from '../../components/canvas/composables/use-canvas-persistence-lifecycle'
import { useCanvasListStore } from '../../modules/canvas/canvas-list-store'
import { useCanvasRevisionStore } from '../../modules/canvas/canvas-revision-store'
import { canvasRouteLocation, normalizeRouteIdentifier } from '../../modules/canvas/metadata'
import { useProjectStore } from '../../modules/project/store'
import { useAuthStore } from '../../store/auth'
import { useAssetStore } from '../../store/assets'
import { useCanvasStore } from '../../store/canvas'
import type { Asset } from '../../types/asset'
import type { CanvasNode } from '../../types/canvas'

type MoveDirection = -1 | 1

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const assetStore = useAssetStore()
const projectStore = useProjectStore()
const canvasListStore = useCanvasListStore()
const canvasDocumentStore = useCanvasStore()
const canvasRevisionStore = useCanvasRevisionStore()

useCanvasPersistenceLifecycle()

const isReviewOnly = ref(false)
const isGenerating = ref(false)
const generationError = ref('')
const generationSuccess = ref('')
const isRevisionPanelOpen = ref(false)
const revisionTriggerRef = ref<HTMLButtonElement | null>(null)
let revisionPanelOpener: HTMLElement | null = null
let reviewMediaQuery: MediaQueryList | null = null

const projectId = computed(() => normalizeRouteIdentifier(route.params.projectId))
const canvasId = computed(() => normalizeRouteIdentifier(route.params.canvasId))
const activeCanvas = computed(() => (
  canvasListStore.items.find((canvas) => canvas.id === canvasId.value) ?? null
))
const selectedNode = computed(() => canvasDocumentStore.selectedNode)
const projectName = computed(() => (
  projectStore.items.find((project) => project.id === projectId.value)?.name ?? 'Revid 项目'
))
const accountName = computed(() => authStore.user?.nickname || authStore.user?.username || '个人空间')
const syncLabel = computed(() => {
  if (canvasDocumentStore.saveState === 'conflict') {
    return `保存冲突 · server r${canvasDocumentStore.conflictRevision ?? canvasDocumentStore.graphRevision}`
  }
  if (canvasDocumentStore.saveState === 'error') {
    return canvasDocumentStore.canRetryAutosave
      ? '画布未保存，点击重试'
      : canvasDocumentStore.saveError || '检测到本地恢复副本'
  }
  if (canvasDocumentStore.saveState === 'saving') return '正在保存画布'
  if (canvasDocumentStore.isViewportSaving) return '正在保存视口'
  if (canvasListStore.isMutating) return '正在保存画布'
  if (canvasListStore.mutationError) return '画布需要恢复'
  return `画布已同步 · r${canvasDocumentStore.graphRevision}`
})
const syncTone = computed(() => {
  if (canvasDocumentStore.saveState === 'conflict') return 'conflict'
  if (canvasListStore.mutationError || canvasDocumentStore.saveState === 'error') return 'error'
  if (
    canvasListStore.isMutating || canvasDocumentStore.isViewportSaving ||
    canvasDocumentStore.saveState === 'saving'
  ) return 'saving'
  return 'saved'
})
const hasDetectedRecovery = computed(() => (
  canvasDocumentStore.hasLocalRecovery &&
  canvasDocumentStore.saveState === 'error' &&
  !canvasDocumentStore.canRetryAutosave
))
const syncIcon = computed(() => {
  if (syncTone.value === 'error' || syncTone.value === 'conflict') return CircleHelp
  if (syncTone.value === 'saving') return LoaderCircle
  return CircleCheck
})
const selectedQuotaType = computed<'text' | 'image' | 'video' | null>(() => {
  if (selectedNode.value?.type === 'text') return 'text'
  if (selectedNode.value?.type === 'image' || selectedNode.value?.type === 'model') return 'image'
  if (selectedNode.value?.type === 'video') return 'video'
  return null
})
const isQuotaInsufficient = computed(() => {
  const quotaType = selectedQuotaType.value
  return quotaType ? authStore.quotas[quotaType] < 1 : false
})

function updateReviewBoundary(event?: MediaQueryListEvent) {
  isReviewOnly.value = event?.matches ?? reviewMediaQuery?.matches ?? false
}

async function loadWorkspaceContext(nextProjectId: string, nextCanvasId: string) {
  if (!nextProjectId || !nextCanvasId) return
  await Promise.allSettled([
    canvasListStore.loadCanvases(nextProjectId),
    projectStore.loadProjects(),
    canvasDocumentStore.loadCanvas(nextProjectId, nextCanvasId),
  ])
}

async function navigateToCanvas(nextCanvasId: string) {
  const nextCanvas = canvasListStore.items.find((canvas) => canvas.id === nextCanvasId)
  if (!projectId.value || !nextCanvas) return
  if (nextCanvas.id === canvasId.value) {
    canvasListStore.rememberCanvas(projectId.value, nextCanvas.id)
    return
  }
  await router.push(canvasRouteLocation(projectId.value, nextCanvas.id))
  canvasListStore.rememberCanvas(projectId.value, nextCanvas.id)
}

async function createCanvas(name: string) {
  const created = await canvasListStore.createCanvas(projectId.value, name)
  await navigateToCanvas(created.id)
}

async function renameCanvas(targetCanvasId: string, name: string) {
  await canvasListStore.renameCanvas(projectId.value, targetCanvasId, name)
}

async function moveCanvas(targetCanvasId: string, direction: MoveDirection) {
  const currentIndex = canvasListStore.items.findIndex((canvas) => canvas.id === targetCanvasId)
  const nextIndex = currentIndex + direction
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= canvasListStore.items.length) return
  const orderedIds = canvasListStore.items.map((canvas) => canvas.id)
  ;[orderedIds[currentIndex], orderedIds[nextIndex]] = [orderedIds[nextIndex], orderedIds[currentIndex]]
  await canvasListStore.reorderCanvases(projectId.value, orderedIds)
}

async function duplicateCanvas(targetCanvasId: string, name: string) {
  const duplicated = await canvasListStore.duplicateCanvas(projectId.value, targetCanvasId, name)
  await navigateToCanvas(duplicated.id)
}

async function archiveCanvas(targetCanvasId: string) {
  await canvasListStore.archiveCanvas(projectId.value, targetCanvasId)
  const fallback = canvasListStore.items[0]
  if (fallback && targetCanvasId === canvasId.value) await navigateToCanvas(fallback.id)
}

async function retryCanvasList() {
  await canvasListStore.loadCanvases(projectId.value, true)
  const resolved = canvasListStore.items.find((canvas) => canvas.id === canvasId.value) ?? canvasListStore.items[0]
  if (resolved) await navigateToCanvas(resolved.id)
}

async function retryCanvasState(event?: MouseEvent) {
  if (hasDetectedRecovery.value) {
    openRevisionPanel(event)
    return
  }
  const operations: Promise<unknown>[] = [canvasListStore.loadCanvases(projectId.value, true)]
  if (canvasDocumentStore.saveState === 'error') operations.push(canvasDocumentStore.retryAutosave())
  else operations.push(canvasDocumentStore.reloadActiveDocument())
  await Promise.allSettled(operations)
}

function openRevisionPanel(event?: Event) {
  const opener = event?.currentTarget
  if (!isRevisionPanelOpen.value) {
    revisionPanelOpener = opener instanceof HTMLElement ? opener : null
  }
  isRevisionPanelOpen.value = true
}

function canRestoreFocus(element: HTMLElement | null) {
  if (!element?.isConnected || element.getAttribute('aria-disabled') === 'true') return false
  return !(element instanceof HTMLButtonElement && element.disabled)
}

function closeRevisionPanel() {
  isRevisionPanelOpen.value = false
  const focusTarget = canRestoreFocus(revisionPanelOpener)
    ? revisionPanelOpener
    : revisionTriggerRef.value
  revisionPanelOpener = null
  void nextTick(() => focusTarget?.focus({ preventScroll: true }))
}

function extractGenerationError(error: unknown) {
  if (isAxiosError<{ detail?: string }>(error)) {
    return error.response?.data?.detail || error.message || '生成失败，请稍后重试。'
  }
  return error instanceof Error ? error.message : '生成失败，请稍后重试。'
}

function prependAsset(asset?: Asset) {
  if (!asset?.id) return
  assetStore.items = [asset, ...assetStore.items.filter((item) => item.id !== asset.id)]
}

async function requestGeneration(node: CanvasNode) {
  const prompt = node.content?.trim() || node.title.trim()
  if (node.type === 'text') {
    throw new Error('当前兼容图层尚未接入 Canvas-scoped 文本生成，请选择图片或视频节点。')
  }
  if (node.type !== 'image' && node.type !== 'model' && node.type !== 'video') {
    throw new Error('当前节点类型暂不支持生成。')
  }
  const path = node.type === 'video' ? '/api/video-generate' : '/api/image-generate'
  const response = await request.post(path, { prompt })
  return response.data.asset as Asset | undefined
}

async function generateFromSelectedNode() {
  const node = selectedNode.value
  const quotaType = selectedQuotaType.value
  if (!node || isReviewOnly.value || isGenerating.value) return
  if (!quotaType) {
    generationError.value = '当前节点类型暂不支持生成。'
    canvasDocumentStore.setNodeStatus(node.id, 'warning')
    return
  }
  if (isQuotaInsufficient.value) {
    generationError.value = `${quotaType} quota 不足，当前生成已阻止。`
    canvasDocumentStore.setNodeStatus(node.id, 'warning')
    return
  }

  isGenerating.value = true
  generationError.value = ''
  generationSuccess.value = ''
  canvasDocumentStore.setNodeStatus(node.id, 'running')
  try {
    const asset = await requestGeneration(node)
    prependAsset(asset)
    authStore.quotas = {
      ...authStore.quotas,
      [quotaType]: Math.max(0, authStore.quotas[quotaType] - 1),
    }
    canvasDocumentStore.setNodeStatus(node.id, 'success')
    if (asset?.url) {
      canvasDocumentStore.setNodeContent(
        node.id,
        node.type === 'video'
          ? '视频任务已完成，可在 Assets 面板查看。'
          : '关键帧已生成，可在 Assets 面板查看。',
      )
    }
    generationSuccess.value = node.type === 'video'
      ? '视频生成完成，结果已写入资产区。'
      : '图片生成完成，结果已写入资产区。'
  } catch (error) {
    generationError.value = extractGenerationError(error)
    canvasDocumentStore.setNodeStatus(node.id, 'warning')
  } finally {
    isGenerating.value = false
  }
}

watch([projectId, canvasId], ([nextProjectId, nextCanvasId]) => {
  void loadWorkspaceContext(nextProjectId, nextCanvasId)
}, { immediate: true })

watch([projectId, canvasId], ([nextProjectId, nextCanvasId]) => {
  if (nextProjectId && nextCanvasId) canvasListStore.rememberCanvas(nextProjectId, nextCanvasId)
}, { immediate: true })

watch(() => canvasDocumentStore.saveState, (state) => {
  if (state === 'conflict') openRevisionPanel()
})

onMounted(() => {
  reviewMediaQuery = window.matchMedia('(max-width: 767px)')
  updateReviewBoundary()
  reviewMediaQuery.addEventListener('change', updateReviewBoundary)
})

onBeforeUnmount(() => {
  reviewMediaQuery?.removeEventListener('change', updateReviewBoundary)
  reviewMediaQuery = null
})
</script>

<template>
  <NConfigProvider :theme="darkTheme" :theme-overrides="v2CanvasNaiveTheme">
    <div class="v2-canvas-theme canvas-workspace" :class="{ 'is-review-only': isReviewOnly }">
      <a class="skip-link" href="#canvas-main">跳到画布内容</a>

      <div class="canvas-layer" aria-hidden="false">
        <CanvasStage :readonly="isReviewOnly || canvasRevisionStore.restoringRevision !== null" />
      </div>

      <header class="route-chrome" aria-label="Canvas route controls">
        <CanvasIdentityBar
          :project-name="projectName"
          :active-canvas="activeCanvas"
          :canvases="canvasListStore.items"
          :can-edit="!isReviewOnly && canvasRevisionStore.restoringRevision === null"
          :is-loading="canvasListStore.isLoading"
          :is-mutating="canvasListStore.isMutating"
          :mutation-error="canvasListStore.mutationError"
          :on-switch="navigateToCanvas"
          :on-create="createCanvas"
          :on-rename="renameCanvas"
          :on-move="moveCanvas"
          :on-duplicate="duplicateCanvas"
          :on-archive="archiveCanvas"
          :on-retry="retryCanvasList"
        />

        <div class="route-status">
          <button
            ref="revisionTriggerRef"
            type="button"
            class="revision-trigger"
            aria-label="打开修订历史"
            title="修订历史"
            :aria-expanded="isRevisionPanelOpen"
            @click="openRevisionPanel"
          >
            <History :size="17" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="sync-status"
            :class="`is-${syncTone}`"
            :disabled="!canvasListStore.mutationError && !canvasDocumentStore.canRetryAutosave && !hasDetectedRecovery"
            :aria-label="hasDetectedRecovery ? `${syncLabel}，打开恢复选项` : (canvasListStore.mutationError || canvasDocumentStore.canRetryAutosave ? `${syncLabel}，重试同步` : syncLabel)"
            @click="retryCanvasState"
          >
            <component :is="syncIcon" :size="16" aria-hidden="true" />
            <span>{{ syncLabel }}</span>
          </button>
          <RouterLink class="account-link" to="/app/space" :aria-label="`打开${accountName}`" :title="accountName">
            <UserRound :size="17" aria-hidden="true" />
            <span>{{ accountName }}</span>
          </RouterLink>
        </div>
      </header>

      <CanvasRevisionPanel
        v-if="isRevisionPanelOpen"
        :project-id="projectId"
        :canvas-id="canvasId"
        :readonly="isReviewOnly"
        @close="closeRevisionPanel"
      />

      <main id="canvas-main" class="canvas-main" tabindex="-1" aria-label="Canvas 主内容">
        <p class="canvas-context">
          <span>{{ activeCanvas?.name || '画布' }}</span>
          <span aria-hidden="true">/</span>
          <span>Canvas document · r{{ canvasDocumentStore.graphRevision }}</span>
        </p>
      </main>

      <section v-if="selectedNode" class="node-context" aria-label="节点上下文">
        <div class="node-context-copy">
          <WandSparkles :size="18" aria-hidden="true" />
          <div>
            <strong>{{ selectedNode.title }}</strong>
            <span v-if="isReviewOnly">审阅节点内容与连接状态。</span>
            <span v-else>继续处理“{{ selectedNode.title }}”节点的生成任务。</span>
          </div>
        </div>
        <button
          v-if="!isReviewOnly"
          type="button"
          class="generate-action"
          :disabled="isGenerating || isQuotaInsufficient"
          @click="generateFromSelectedNode"
        >
          <LoaderCircle v-if="isGenerating" :size="17" class="is-spinning" aria-hidden="true" />
          <Play v-else :size="17" aria-hidden="true" />
          {{ isGenerating ? '生成中' : '立即生成' }}
        </button>
        <p v-if="generationError" class="node-feedback is-error" role="alert">
          <AlertTriangle :size="15" aria-hidden="true" />
          {{ generationError }}
        </p>
        <p v-else-if="generationSuccess" class="node-feedback is-success" role="status">
          <CircleCheck :size="15" aria-hidden="true" />
          {{ generationSuccess }}
        </p>
      </section>

      <div v-if="isReviewOnly" class="review-boundary" role="status">
        <strong>浏览审阅模式</strong>
        <span>可平移、缩放和检查内容，编辑与画布管理操作已关闭。</span>
      </div>
    </div>
  </NConfigProvider>
</template>

<style scoped lang="scss" src="./canvas-workspace.scss"></style>
