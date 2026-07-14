<script setup lang="ts">
import { CircleCheck, CircleHelp, History, LoaderCircle, UserRound } from 'lucide-vue-next'
import { darkTheme, NConfigProvider, NDrawer, NDrawerContent } from 'naive-ui'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { v2CanvasNaiveTheme } from '../../assets/styles/v2-canvas-naive-theme'
import CanvasAssetPanel from '../../components/canvas/CanvasAssetPanel.vue'
import CanvasContextPanel from '../../components/canvas/CanvasContextPanel.vue'
import CanvasIdentityBar from '../../components/canvas/CanvasIdentityBar.vue'
import CanvasRevisionPanel from '../../components/canvas/CanvasRevisionPanel.vue'
import CanvasStage from '../../components/canvas/CanvasStage.vue'
import { useCanvasPersistenceLifecycle } from '../../components/canvas/composables/use-canvas-persistence-lifecycle'
import { useCanvasResourceExperience } from '../../components/canvas/composables/use-canvas-resource-experience'
import { useCanvasListStore } from '../../modules/canvas/canvas-list-store'
import { useCanvasRevisionStore } from '../../modules/canvas/canvas-revision-store'
import { canvasRouteLocation, normalizeRouteIdentifier } from '../../modules/canvas/metadata'
import { useProjectStore } from '../../modules/project/store'
import { useAuthStore } from '../../store/auth'
import { useCanvasStore } from '../../store/canvas'

type MoveDirection = -1 | 1

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const projectStore = useProjectStore()
const canvasListStore = useCanvasListStore()
const canvasDocumentStore = useCanvasStore()
const canvasRevisionStore = useCanvasRevisionStore()

useCanvasPersistenceLifecycle()

const isReviewOnly = ref(false)
const isCompact = ref(false)
const isRevisionPanelOpen = ref(false)
const revisionTriggerRef = ref<HTMLButtonElement | null>(null)
let revisionPanelOpener: HTMLElement | null = null
let reviewMediaQuery: MediaQueryList | null = null
let compactMediaQuery: MediaQueryList | null = null

const projectId = computed(() => normalizeRouteIdentifier(route.params.projectId))
const canvasId = computed(() => normalizeRouteIdentifier(route.params.canvasId))
const activeCanvas = computed(() => (
  canvasListStore.items.find((canvas) => canvas.id === canvasId.value) ?? null
))
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
const {
  resourceStore,
  activeTab,
  panelWidth,
  isResourceOpen,
  isContextDrawerOpen,
  isDesktopContextOpen,
  isUploading,
  isGenerating,
  selectedNode,
  selectedMediaType,
  selectedGenerationContext,
  selectedQuota,
  latestTask,
  visibleError,
  generationError,
  generationSuccess,
  openResources,
  closeResources,
  restoreResourceFocus,
  closeContext,
  setPanelWidth,
  insertAsset,
  uploadAsset,
  captureTemplate,
  instantiateTemplate,
  generate,
  updatePrompt,
} = useCanvasResourceExperience({ projectId, canvasId, isCompact, isReviewOnly })

function updateResponsiveBoundaries() {
  isReviewOnly.value = reviewMediaQuery?.matches ?? false
  isCompact.value = compactMediaQuery?.matches ?? false
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

function retryProjectResources() {
  void resourceStore.refresh().catch(() => undefined)
}

function updateResourceDrawer(show: boolean) {
  if (!show) closeResources(false)
}

function updateContextDrawer(show: boolean) {
  if (!show) closeContext()
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
  compactMediaQuery = window.matchMedia('(max-width: 1023px)')
  updateResponsiveBoundaries()
  reviewMediaQuery.addEventListener('change', updateResponsiveBoundaries)
  compactMediaQuery.addEventListener('change', updateResponsiveBoundaries)
})

onBeforeUnmount(() => {
  reviewMediaQuery?.removeEventListener('change', updateResponsiveBoundaries)
  compactMediaQuery?.removeEventListener('change', updateResponsiveBoundaries)
  reviewMediaQuery = null
  compactMediaQuery = null
})
</script>

<template>
  <NConfigProvider :theme="darkTheme" :theme-overrides="v2CanvasNaiveTheme">
    <div
      class="v2-canvas-theme canvas-workspace"
      :class="{
        'is-review-only': isReviewOnly,
        'has-resource-panel': isResourceOpen && !isCompact,
        'has-context-panel': isDesktopContextOpen,
      }"
      :style="{ '--resource-panel-width': `${panelWidth}px` }"
    >
      <a class="skip-link" href="#canvas-main">跳到画布内容</a>

      <div class="canvas-layer" aria-hidden="false">
        <CanvasStage
          :readonly="isReviewOnly || canvasRevisionStore.restoringRevision !== null"
          :resources-open="isResourceOpen"
          @open-resources="openResources"
        />
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

      <div v-if="isResourceOpen && !isCompact" class="resource-panel-shell">
        <CanvasAssetPanel
          v-model:active-tab="activeTab"
          :assets="resourceStore.assets"
          :error="visibleError"
          :is-loading="resourceStore.isLoading"
          :is-uploading="isUploading"
          mode="panel"
          :panel-width="panelWidth"
          :readonly="isReviewOnly"
          :tasks="resourceStore.tasks"
          :templates="resourceStore.templates"
          @capture-template="captureTemplate"
          @close="closeResources"
          @insert-asset="insertAsset"
          @instantiate-template="instantiateTemplate"
          @resize="setPanelWidth"
          @retry="retryProjectResources"
          @upload="uploadAsset"
        />
      </div>

      <div v-if="selectedNode && isDesktopContextOpen" class="context-panel-shell">
        <CanvasContextPanel
          :error="generationError"
          :is-generating="isGenerating"
          :latest-task="latestTask"
          :generation-context="selectedGenerationContext"
          :media-type="selectedMediaType"
          mode="panel"
          :node="selectedNode"
          :quota="selectedQuota"
          :readonly="isReviewOnly"
          :success="generationSuccess"
          @close="closeContext"
          @generate="generate"
          @update-prompt="updatePrompt"
        />
      </div>

      <NDrawer
        :show="isResourceOpen && isCompact"
        placement="left"
        :width="isReviewOnly ? '100%' : 420"
        @after-leave="restoreResourceFocus"
        @update:show="updateResourceDrawer"
      >
        <NDrawerContent body-content-style="height: 100%; padding: 0;">
          <div class="v2-canvas-theme drawer-theme">
            <CanvasAssetPanel
              v-model:active-tab="activeTab"
              :assets="resourceStore.assets"
              autofocus
              :error="visibleError"
              :is-loading="resourceStore.isLoading"
              :is-uploading="isUploading"
              mode="drawer"
              :readonly="isReviewOnly"
              :tasks="resourceStore.tasks"
              :templates="resourceStore.templates"
              @capture-template="captureTemplate"
              @close="closeResources"
              @insert-asset="insertAsset"
              @instantiate-template="instantiateTemplate"
              @retry="retryProjectResources"
              @upload="uploadAsset"
            />
          </div>
        </NDrawerContent>
      </NDrawer>

      <NDrawer
        :show="isContextDrawerOpen && isCompact && Boolean(selectedNode)"
        placement="right"
        :width="isReviewOnly ? '100%' : 360"
        @update:show="updateContextDrawer"
      >
        <NDrawerContent body-content-style="height: 100%; padding: 0;">
          <div class="v2-canvas-theme drawer-theme">
            <CanvasContextPanel
              v-if="selectedNode"
              :error="generationError"
              :is-generating="isGenerating"
              :latest-task="latestTask"
              :generation-context="selectedGenerationContext"
              :media-type="selectedMediaType"
              mode="drawer"
              :node="selectedNode"
              :quota="selectedQuota"
              :readonly="isReviewOnly"
              :success="generationSuccess"
              @close="closeContext"
              @generate="generate"
              @update-prompt="updatePrompt"
            />
          </div>
        </NDrawerContent>
      </NDrawer>

      <main id="canvas-main" class="canvas-main" tabindex="-1" aria-label="Canvas 主内容">
        <p class="canvas-context">
          <span>{{ activeCanvas?.name || '画布' }}</span>
          <span aria-hidden="true">/</span>
          <span>Canvas document · r{{ canvasDocumentStore.graphRevision }}</span>
        </p>
      </main>

      <div v-if="isReviewOnly" class="review-boundary" role="status">
        <strong>浏览审阅模式</strong>
        <span>可平移、缩放和检查内容，编辑与画布管理操作已关闭。</span>
      </div>
    </div>
  </NConfigProvider>
</template>

<style scoped lang="scss" src="./canvas-workspace.scss"></style>
