<script setup lang="ts">
import { isAxiosError } from 'axios'
import { AlertTriangle, CircleCheck, CircleHelp, LoaderCircle, Play, UserRound, WandSparkles } from 'lucide-vue-next'
import { darkTheme, NConfigProvider } from 'naive-ui'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { request } from '../../api/request'
import { v2CanvasNaiveTheme } from '../../assets/styles/v2-canvas-naive-theme'
import CanvasIdentityBar from '../../components/canvas/CanvasIdentityBar.vue'
import CanvasStage from '../../components/canvas/CanvasStage.vue'
import { useCanvasPersistenceLifecycle } from '../../components/canvas/composables/use-canvas-persistence-lifecycle'
import { useCanvasListStore } from '../../modules/canvas/canvas-list-store'
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
const legacyCanvasStore = useCanvasStore()

useCanvasPersistenceLifecycle()

const isReviewOnly = ref(false)
const isGenerating = ref(false)
const generationError = ref('')
const generationSuccess = ref('')
let reviewMediaQuery: MediaQueryList | null = null

const projectId = computed(() => normalizeRouteIdentifier(route.params.projectId))
const canvasId = computed(() => normalizeRouteIdentifier(route.params.canvasId))
const activeCanvas = computed(() => (
  canvasListStore.items.find((canvas) => canvas.id === canvasId.value) ?? null
))
const selectedNode = computed(() => legacyCanvasStore.selectedNode)
const projectName = computed(() => (
  projectStore.items.find((project) => project.id === projectId.value)?.name ?? 'Revid 项目'
))
const accountName = computed(() => authStore.user?.nickname || authStore.user?.username || '个人空间')
const syncLabel = computed(() => {
  if (canvasListStore.isMutating) return '正在保存画布'
  if (canvasListStore.mutationError) return '画布需要恢复'
  return `画布已同步 · r${canvasListStore.orderRevision}`
})
const syncTone = computed(() => {
  if (canvasListStore.mutationError) return 'error'
  if (canvasListStore.isMutating) return 'saving'
  return 'saved'
})
const syncIcon = computed(() => {
  if (syncTone.value === 'error') return CircleHelp
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

async function loadWorkspaceContext(nextProjectId: string) {
  if (!nextProjectId) return
  await Promise.allSettled([
    canvasListStore.loadCanvases(nextProjectId),
    projectStore.loadProjects(),
    legacyCanvasStore.loadProject(nextProjectId),
  ])
}

async function navigateToCanvas(nextCanvasId: string) {
  const nextCanvas = canvasListStore.items.find((canvas) => canvas.id === nextCanvasId)
  if (!projectId.value || !nextCanvas) return
  canvasListStore.rememberCanvas(projectId.value, nextCanvas.id)
  if (nextCanvas.id === canvasId.value) return
  await router.push(canvasRouteLocation(projectId.value, nextCanvas.id))
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
    legacyCanvasStore.setNodeStatus(node.id, 'warning')
    return
  }
  if (isQuotaInsufficient.value) {
    generationError.value = `${quotaType} quota 不足，当前生成已阻止。`
    legacyCanvasStore.setNodeStatus(node.id, 'warning')
    return
  }

  isGenerating.value = true
  generationError.value = ''
  generationSuccess.value = ''
  legacyCanvasStore.setNodeStatus(node.id, 'running')
  try {
    const asset = await requestGeneration(node)
    prependAsset(asset)
    authStore.quotas = {
      ...authStore.quotas,
      [quotaType]: Math.max(0, authStore.quotas[quotaType] - 1),
    }
    legacyCanvasStore.setNodeStatus(node.id, 'success')
    if (asset?.url) {
      legacyCanvasStore.setNodeContent(
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
    legacyCanvasStore.setNodeStatus(node.id, 'warning')
  } finally {
    isGenerating.value = false
  }
}

watch(projectId, (nextProjectId) => {
  void loadWorkspaceContext(nextProjectId)
}, { immediate: true })

watch([projectId, canvasId], ([nextProjectId, nextCanvasId]) => {
  if (nextProjectId && nextCanvasId) canvasListStore.rememberCanvas(nextProjectId, nextCanvasId)
}, { immediate: true })

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
        <CanvasStage :readonly="isReviewOnly" />
      </div>

      <header class="route-chrome" aria-label="Canvas route controls">
        <CanvasIdentityBar
          :project-name="projectName"
          :active-canvas="activeCanvas"
          :canvases="canvasListStore.items"
          :can-edit="!isReviewOnly"
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
            type="button"
            class="sync-status"
            :class="`is-${syncTone}`"
            :disabled="!canvasListStore.mutationError"
            :aria-label="canvasListStore.mutationError ? `${syncLabel}，重新加载画布列表` : syncLabel"
            @click="retryCanvasList"
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

      <main id="canvas-main" class="canvas-main" tabindex="-1" aria-label="Canvas 主内容">
        <p class="canvas-context">
          <span>{{ activeCanvas?.name || '画布' }}</span>
          <span aria-hidden="true">/</span>
          <span>Graph compatibility</span>
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
