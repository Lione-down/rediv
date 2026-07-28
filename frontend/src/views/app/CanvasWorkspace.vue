<script setup lang="ts">
import { CircleCheck, CircleHelp, History, LoaderCircle } from 'lucide-vue-next'
import { darkTheme, NConfigProvider, NDrawer, NDrawerContent } from 'naive-ui'
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { v2CanvasNaiveTheme } from '../../assets/styles/v2-canvas-naive-theme'
import CanvasAssetPanel from '../../components/canvas/CanvasAssetPanel.vue'
import CanvasContextPanel from '../../components/canvas/CanvasContextPanel.vue'
import { resolveCanvasCardWorkModel } from '../../components/canvas/canvas-card-work-model'
import CanvasIdentityBar from '../../components/canvas/CanvasIdentityBar.vue'
import CanvasProfessionalActionPalette from '../../components/canvas/CanvasProfessionalActionPalette.vue'
import CanvasRevisionPanel from '../../components/canvas/CanvasRevisionPanel.vue'
import CanvasResultCompareTray from '../../components/canvas/CanvasResultCompareTray.vue'
import CanvasStage from '../../components/canvas/CanvasStage.vue'
import CanvasStoryboardView from '../../components/canvas/CanvasStoryboardView.vue'
import CanvasWorkflowTemplateDrawer from '../../components/canvas/CanvasWorkflowTemplateDrawer.vue'
import CanvasViewModeSwitch, { type CanvasViewMode } from '../../components/canvas/CanvasViewModeSwitch.vue'
import CanvasReplacementRuntime from '../../components/canvas-runtime/CanvasReplacementRuntime.vue'
import AccountSessionMenu from '../../components/layout/account-session-menu.vue'
import { resolveCanvasNodeContinuationTrigger } from '../../components/canvas/canvas-node-continuation-trigger'
import { resolveGenerationResultVariants } from '../../modules/canvas/generation-lineage'
import { useCanvasNodeActions } from '../../components/canvas/composables/use-canvas-node-actions'
import { useCanvasPersistenceLifecycle } from '../../components/canvas/composables/use-canvas-persistence-lifecycle'
import { useCanvasProfessionalActions } from '../../components/canvas/composables/use-canvas-professional-actions'
import { useCanvasImageOperations } from '../../components/canvas/composables/use-canvas-image-operations'
import { useCanvasScriptGeneration } from '../../components/canvas/composables/use-canvas-script-generation'
import { useCanvasResourceExperience } from '../../components/canvas/composables/use-canvas-resource-experience'
import { useCanvasTextGeneration } from '../../components/canvas/composables/use-canvas-text-generation'
import { useCanvasStoryboardRecipes } from '../../components/canvas/composables/use-canvas-storyboard-recipes'
import { useCanvasListStore } from '../../modules/canvas/canvas-list-store'
import { useCanvasRevisionStore } from '../../modules/canvas/canvas-revision-store'
import { canvasRouteLocation, normalizeRouteIdentifier } from '../../modules/canvas/metadata'
import { useProjectStore } from '../../modules/project/store'
import { useAuthStore } from '../../store/auth'
import { useCanvasStore } from '../../store/canvas'
import { createArrangeGenerationLineageCommand } from '../../modules/canvas/generation-lineage-arrangement'
import { resolveGenerationInputLineageBridges } from '../../modules/canvas/generation-input-lineage'
import { projectCanvasStoryboard } from '../../modules/canvas/storyboard-projection'
import { createReorderStoryboardGroupCommand } from '../../modules/canvas/storyboard-commands'
import { resolveOwnedMediaActionTarget } from '../../modules/canvas/professional-action-registry'
import {
  createAppendStoryShotCommand,
  createDeleteStoryShotCommand,
  createSetStoryPromptsConfirmedCommand,
  createSetStoryShotsConfirmedCommand,
  createUpdateStoryAssetCommand,
  createUpdateStoryShotCommand,
  type ScriptAuthoringIntent,
  type StoryAssetEditableField,
  type StoryShotEditableField,
  type TextWorkflowMode,
} from '../../modules/canvas/script-authoring'
import type { ProjectAsset } from '../../modules/canvas/project-resource-types'
import {
  resolveCanvasCardVideoBindings,
  type CanvasCardWorkModeId,
} from '../../components/canvas/canvas-card-work-model'
import type { CanvasCardConfigurationSnapshot } from '../../modules/canvas/canvas-card-configuration'
import type { StoryboardAssetEditIntent } from '../../modules/canvas/storyboard-asset-commands'
import {
  projectCanvasMaterializedCardFamilies,
  resolveCanvasMaterializedCardResult,
} from '../../components/canvas/canvas-materialized-card-projection'
import {
  resolveGenerationRequestContext,
  type GenerationNodeParameters,
  type VideoReferenceBinding,
  type VideoReferenceMode,
} from '../../modules/canvas/generation-parameters'
import { buildCanvasCardViewModel } from '../../modules/canvas/canvas-card-view-model'
import type {
  CanvasCardPromptDocument,
  CanvasCardReference,
} from '../../modules/canvas/canvas-card-view-model'
import {
  createRegistryNodeDraft,
  isNodeGroupContainer,
} from '../../modules/canvas/node-registry'
import {
  createStoryShotGenerationCommand,
  type StoryShotBatchOptions,
} from '../../modules/canvas/story-shot-generation'
import { createCanvasEntityId } from '../../modules/canvas/canvas-autosave'
import {
  createConnectNodesCommand,
  createDeleteSelectionCommand,
  createGroupNodesCommand,
  createMoveNodeMembershipCommand,
  createMoveNodesByDeltaCommand,
  createRenameNodeCommand,
  createUngroupNodesCommand,
} from '../../modules/canvas/canvas-commands'
import {
  createConnectionContinuationCommand,
  createMultiConnectionContinuationCommand,
  type ConnectionContinuationDirection,
  type ConnectionContinuationOption,
} from '../../modules/canvas/connection-continuation'
import {
  useCanvasContextSurface,
  type CanvasContextSurfaceKind,
} from '../../components/canvas/composables/use-canvas-context-surface'

type MoveDirection = -1 | 1
interface CanvasStageHandle { arrangeSelectedProvenanceTrace: () => boolean; closeTransientInteractions: () => void; fitSelectedProvenanceTrace: () => boolean; openSelectedContinuation: () => void; revealNode: (nodeId: string) => boolean }
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const projectStore = useProjectStore()
const canvasListStore = useCanvasListStore()
const canvasDocumentStore = useCanvasStore()
const canvasRevisionStore = useCanvasRevisionStore()
const isReplacementRuntime = computed(() => route.query.canvas_runtime !== 'legacy')
const CanvasVideoEditPreflightOverlay = defineAsyncComponent(() => import('../../components/canvas/CanvasVideoEditPreflightOverlay.vue'))
const CanvasAudioGenerationPreflightOverlay = defineAsyncComponent(() => import('../../components/canvas/CanvasAudioGenerationPreflightOverlay.vue'))
const CanvasAgentSkillPreflightOverlay = defineAsyncComponent(() => import('../../components/canvas/CanvasAgentSkillPreflightOverlay.vue'))
useCanvasPersistenceLifecycle()
const isReviewOnly = ref(false)
const isCompact = ref(false)
const viewMode = ref<CanvasViewMode>('workflow')
const isRevisionPanelOpen = ref(false)
const isResultCompareOpen = ref(false)
const workflowTemplateOpen = ref(false)
const videoEditPreflightOpen = ref(false)
const audioGenerationPreflightOpen = ref(false)
const agentSkillPreflightOpen = ref(false)
const scriptAuthoringIntent = ref<ScriptAuthoringIntent | null>(null)
const storyboardAssetEditIntent = ref<StoryboardAssetEditIntent | null>(null)
const revisionTriggerRef = ref<HTMLButtonElement | null>(null)
const canvasStageRef = ref<CanvasStageHandle | null>(null)
const isStageContextSurfaceOpen = ref(false)
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
  resourceIntent,
  cardSourceTargetNodeId,
  isContextDrawerOpen,
  isDesktopContextOpen,
  isUploading,
  isGenerating,
  generationCapabilities,
  generationCapabilitiesError,
  isGenerationCapabilitiesLoading,
  reloadGenerationCapabilities,
  selectedNode,
  selectedMediaType,
  selectedGenerationContext,
  selectedResultLineage,
  selectedQuota,
  selectedRuntimePresentation,
  generationRuntimePresentations, generationJobResults, pendingGenerationResults,
  latestTask,
  visibleError,
  generationError,
  generationSuccess,
  storyboardGenerationSummary,
  openResources,
  openCardSourceResources,
  closeResources,
  restoreResourceFocus,
  closeContext,
  openContext,
  suppressNextContextAutoOpen,
  selectNodeForCanvasLocation,
  setPanelWidth,
  getInsertionPoint,
  insertAsset,
  uploadAsset,
  uploadCardSource,
  attachCardSourceAsset,
  captureVideoFrame,
  splitImageGrid,
  captureTemplate,
  instantiateTemplate,
  generate,
  generateStoryboardGroup,
  setDirectorPreflight,
  generateRecipe,
  updatePrompt,
  updateGenerationParameters,
} = useCanvasResourceExperience({ projectId, canvasId, isCompact, isReviewOnly })
const isCardRuntimeErrorAuthority = computed(() => Boolean(
  selectedNode.value &&
  resolveCanvasCardWorkModel(selectedNode.value, {
    isReadOnly: isReviewOnly.value,
    isSelected: true,
  }).showsAttachedWorkSurface,
))
const textGeneration = useCanvasTextGeneration({
  canvasId,
  capabilities: generationCapabilities,
  generationJobResults,
  isReviewOnly,
  projectId,
})
const replacementModelOptions = computed(() => {
  const node = selectedNode.value
  const capabilities = generationCapabilities.value
  if (!node || !capabilities) return []
  const subtype = typeof node.contentData?.subtype === 'string' ? node.contentData.subtype : ''
  if (subtype === 'image') {
    return [{ id: capabilities.image.model, label: capabilities.image.model }]
  }
  if (subtype === 'video') {
    return [{ id: capabilities.video.model, label: capabilities.video.model }]
  }
  if (subtype === 'audio') {
    return capabilities.audio?.models.map((model) => ({ id: model.id, label: model.label })) ?? []
  }
  if (node.type === 'script' || node.type === 'text' || node.type === 'note') {
    return capabilities.text?.models.map((model) => ({ id: model.id, label: model.label })) ?? []
  }
  return []
})
const replacementMaterializedProjection = computed(() => (
  projectCanvasMaterializedCardFamilies(
    canvasDocumentStore.nodes,
    canvasDocumentStore.connections,
    canvasDocumentStore.selectedNodeIds,
  )
))
const replacementGenerationContext = computed(() => {
  const mediaType = selectedMediaType.value
  if (!mediaType) return null
  const node = replacementMaterializedProjection.value.nodes.find(
    (candidate) => candidate.id === canvasDocumentStore.selectedNodeId,
  )
  if (!node) return null
  return resolveGenerationRequestContext(
    node,
    mediaType,
    replacementMaterializedProjection.value.nodes,
    replacementMaterializedProjection.value.connections,
    generationCapabilities.value,
  )
})
const scriptGeneration = useCanvasScriptGeneration({
  canvasId,
  generationCapabilities,
  isReviewOnly,
  projectId,
})
const composerAttachments = ref<ProjectAsset[]>([])
const scriptCapability = computed(() => generationCapabilities.value?.text ?? null)
const composerCapabilityError = computed(() => {
  if (isGenerationCapabilitiesLoading.value) return ''
  if (generationCapabilitiesError.value) return generationCapabilitiesError.value
  if (generationCapabilities.value && !generationCapabilities.value.text) {
    return '脚本模型未就绪，请重启本地服务后重试。'
  }
  return ''
})

function openComposerResources(opener: HTMLElement) {
  activateContextSurface('resources', opener)
  openResources(opener, 'attach')
}

function openCanvasResources(opener: HTMLElement, tab: 'assets' | 'templates' | 'tasks' = 'assets') {
  activateContextSurface('resources', opener)
  openResources(opener, 'insert', tab)
}

function openSelectedCardAssets(nodeId: string, opener: HTMLElement) {
  activateContextSurface('resources', opener)
  openCardSourceResources(nodeId, opener)
}

async function uploadSelectedCardSource(nodeId: string, file: File) {
  await uploadCardSource(nodeId, file)
}

async function handleResourceUpload(file: File, type: 'image' | 'video' | 'audio') {
  if (resourceIntent.value === 'card-source' && cardSourceTargetNodeId.value) {
    await uploadCardSource(cardSourceTargetNodeId.value, file)
    return
  }
  await uploadAsset(file, type)
}

function attachComposerAsset(asset: ProjectAsset) {
  if (asset.project_id !== projectId.value) return
  if (composerAttachments.value.some((item) => item.id === asset.id)) {
    closeResourceSurface()
    return
  }
  composerAttachments.value = [...composerAttachments.value, asset].slice(0, 8)
  closeResourceSurface()
}

function attachSelectedResource(asset: ProjectAsset) {
  if (resourceIntent.value === 'card-source') {
    void attachCardSourceAsset(asset)
    return
  }
  attachComposerAsset(asset)
}

async function generateFromCard(nodeId: string, prompt: string, mode: CanvasCardWorkModeId) {
  if (selectedNode.value?.id !== nodeId || !selectedMediaType.value) return
  if (mode === 'image-upscale') {
    openContext()
    return
  }
  if (selectedMediaType.value === 'video') {
    const card = buildCanvasCardViewModel(selectedNode.value)
    const referenceMode: VideoReferenceMode | null = mode === 'text-to-video'
      ? 'text-to-video'
      : mode === 'first-frame-video'
        ? 'image-to-video'
        : mode === 'keyframes-video' ? 'keyframes' : null
    if (!referenceMode) return
    const aspectRatio = selectedGenerationContext.value?.aspectRatio ??
      generationCapabilities.value?.video.default_aspect_ratio ?? '16:9'
    const durationSeconds = selectedGenerationContext.value?.durationSeconds ??
      generationCapabilities.value?.video.default_duration_seconds ?? 5
    const primaryReferenceNodeId = selectedGenerationContext.value?.primaryReferenceNodeId ??
      selectedGenerationContext.value?.mediaSources.find((source) => source.state === 'included')?.nodeId
    const contextBindings = selectedGenerationContext.value?.videoReferences ?? []
    const bindingsByIdentity = new Map(contextBindings.map((binding) => [
      `${binding.node_id}:${binding.asset_id}`,
      binding,
    ]))
    const canonicalBindings = [...card.references]
      .sort((left, right) => left.order - right.order)
      .flatMap((reference, order) => {
        const binding = bindingsByIdentity.get(`${reference.stableId}:${reference.assetId}`)
        if (!binding || !['first-frame', 'last-frame', 'reference'].includes(reference.role)) return []
        return [{
          ...binding,
          role: reference.role as VideoReferenceBinding['role'],
          order,
        }]
      })
    const referenceBindings = resolveCanvasCardVideoBindings(
      referenceMode,
      canonicalBindings.length ? canonicalBindings : contextBindings,
    )
    const parameters: GenerationNodeParameters = {
      schema_version: 1,
      video: generationCapabilities.value?.contract_version === 6
        ? {
            aspect_ratio: aspectRatio,
            duration_seconds: durationSeconds,
            reference_bindings: referenceBindings,
            ...(selectedGenerationContext.value?.shotControls
              ? { shot_controls: selectedGenerationContext.value.shotControls }
              : {}),
          }
        : {
            aspect_ratio: aspectRatio,
            duration_seconds: durationSeconds,
            reference_mode: referenceMode,
            ...(referenceMode === 'image-to-video' && primaryReferenceNodeId
              ? { primary_reference_node_id: primaryReferenceNodeId }
              : {}),
            ...(selectedGenerationContext.value?.shotControls
              ? { shot_controls: selectedGenerationContext.value.shotControls }
              : {}),
          },
    }
    const references = referenceBindings.map((binding) => {
      const canonical = card.references.find((reference) => (
        reference.stableId === binding.node_id && reference.assetId === binding.asset_id
      ))
      const source = canvasDocumentStore.findNodeById(binding.node_id)
      const thumbnail = source?.contentData?.thumbnail_url ??
        source?.contentData?.preview_url ??
        source?.contentData?.url
      const sourceRevision = source?.contentData?.content_revision
      return {
        stableId: binding.node_id,
        assetId: binding.asset_id,
        displayName: canonical?.displayName ?? (source?.title?.trim() || '未命名素材'),
        thumbnailUrl: canonical?.thumbnailUrl ?? (typeof thumbnail === 'string' ? thumbnail : ''),
        sourceRevision: canonical?.sourceRevision ?? (typeof sourceRevision === 'number' ? sourceRevision : 0),
        role: binding.role,
        order: binding.order,
      }
    })
    await canvasDocumentStore.setNodeGenerationParameters(nodeId, parameters, {
      schemaVersion: 1,
      generationMode: referenceMode,
      modelId: card.configuration.modelId ?? generationCapabilities.value?.video.model ?? null,
      promptDocument: card.configuration.promptDocument,
      references,
    })
  }
  updatePrompt(prompt)
  await generate(prompt)
}

function generateFromReplacement() {
  const node = selectedNode.value
  if (!node) return
  const subtype = typeof node.contentData?.subtype === 'string' ? node.contentData.subtype : ''
  const prompt = node.content ?? ''
  if (subtype === 'image') {
    if (!generationCapabilities.value?.image.model) return
    void generateFromCard(node.id, prompt, 'text-to-image')
    return
  }
  if (subtype === 'video') {
    if (!generationCapabilities.value?.video.model) return
    const card = buildCanvasCardViewModel(node)
    const persistedMode = card.configuration.generationMode
    const mode: CanvasCardWorkModeId = persistedMode === 'keyframes' || persistedMode === 'keyframes-video'
      ? 'keyframes-video'
      : persistedMode === 'image-to-video' || persistedMode === 'first-frame-video'
        ? 'first-frame-video'
        : 'text-to-video'
    void generateFromCard(node.id, prompt, mode)
    return
  }
  if (subtype === 'audio') {
    const modelId = buildCanvasCardViewModel(node).configuration.modelId ?? ''
    const isAllowedModel = generationCapabilities.value?.audio?.models.some(
      (model) => model.id === modelId,
    )
    if (!isAllowedModel) return
    generateTextCard(
      node.id,
      prompt,
      'text-to-music',
      modelId,
    )
  }
}

function generateTextCard(
  nodeId: string,
  prompt: string,
  mode: CanvasCardWorkModeId,
  modelId: string,
) {
  if (!['text-to-video', 'image-to-prompt', 'text-to-music'].includes(mode)) return
  void textGeneration.submit({
    nodeId,
    prompt,
    mode: mode as TextWorkflowMode,
    modelId,
  })
}

watch([projectId, canvasId], () => { composerAttachments.value = [] })

function removeComposerAttachment(assetId: string) {
  composerAttachments.value = composerAttachments.value.filter((asset) => asset.id !== assetId)
}

async function submitMainComposerScript(brief: string) {
  scriptAuthoringIntent.value = 'script_draft'
  await scriptGeneration.generate({
    intent: 'script_draft',
    locale: scriptCapability.value?.defaultLocale ?? 'zh-CN',
    modelId: scriptCapability.value?.model ?? '',
    value: brief,
    referenceAssetIds: composerAttachments.value.map((asset) => asset.id),
  })
  if (scriptGeneration.success.value) scriptAuthoringIntent.value = null
}

async function addScriptShot(nodeId: string) {
  const source = canvasDocumentStore.findNodeById(nodeId)
  if (!source) return
  const command = createAppendStoryShotCommand({
    source,
    shotId: createCanvasEntityId(),
  })
  if (!command) return
  await canvasDocumentStore.dispatchCommand({ source: 'toolbar', command })
  await canvasDocumentStore.flushPendingPersistence()
}

async function updateScriptShot(payload: {
  field: StoryShotEditableField
  nodeId: string
  shotId: string
  value: string | number
}) {
  const source = canvasDocumentStore.findNodeById(payload.nodeId)
  if (!source) return
  const command = createUpdateStoryShotCommand({ source, ...payload })
  if (!command) return
  await canvasDocumentStore.dispatchCommand({ source: 'toolbar', command })
  await canvasDocumentStore.flushPendingPersistence()
}

async function updateScriptAsset(payload: {
  assetId: string
  field: StoryAssetEditableField
  nodeId: string
  value: string
}) {
  const source = canvasDocumentStore.findNodeById(payload.nodeId)
  if (!source) return
  const command = createUpdateStoryAssetCommand({ source, ...payload })
  if (!command) return
  await canvasDocumentStore.dispatchCommand({ source: 'toolbar', command })
  await canvasDocumentStore.flushPendingPersistence()
}

async function deleteScriptShot(payload: { nodeId: string; shotId: string }) {
  const source = canvasDocumentStore.findNodeById(payload.nodeId)
  if (!source) return
  const command = createDeleteStoryShotCommand({ source, shotId: payload.shotId })
  if (!command) return
  await canvasDocumentStore.dispatchCommand({ source: 'toolbar', command })
  await canvasDocumentStore.flushPendingPersistence()
}

async function setScriptShotsConfirmed(payload: { confirmed: boolean; nodeId: string }) {
  const source = canvasDocumentStore.findNodeById(payload.nodeId)
  if (!source) return
  const command = createSetStoryShotsConfirmedCommand({ source, confirmed: payload.confirmed })
  if (!command) return
  await canvasDocumentStore.dispatchCommand({ source: 'toolbar', command })
  await canvasDocumentStore.flushPendingPersistence()
}

async function setScriptPromptsConfirmed(payload: {
  confirmed: boolean
  nodeId: string
  shotIds: string[]
}) {
  const source = canvasDocumentStore.findNodeById(payload.nodeId)
  if (!source) return
  const command = createSetStoryPromptsConfirmedCommand({
    source,
    confirmed: payload.confirmed,
    shotIds: payload.shotIds,
  })
  if (!command) return
  await canvasDocumentStore.dispatchCommand({ source: 'toolbar', command })
  await canvasDocumentStore.flushPendingPersistence()
}

async function createScriptGenerationBatch(payload: {
  nodeId: string
  options: StoryShotBatchOptions
  shotIds: string[]
}) {
  if (isReviewOnly.value || canvasRevisionStore.restoringRevision !== null) return
  const source = canvasDocumentStore.findNodeById(payload.nodeId)
  if (!source) return
  const command = createStoryShotGenerationCommand({
    sourceNode: source,
    existingNodes: canvasDocumentStore.nodes,
    connections: canvasDocumentStore.connections,
    shotIds: payload.shotIds,
    options: payload.options,
  })
  if (!command) return
  await canvasDocumentStore.dispatchCommand({ source: 'toolbar', command })
  await canvasDocumentStore.flushPendingPersistence()
}
const { branchFromResult, branchVisualRecipe, reorderGenerationInput } = useCanvasNodeActions({ isReviewOnly, selectedNode, revealNode: (nodeId) => canvasStageRef.value?.revealNode(nodeId) })
const selectedProfessionalNodes = computed(() => {
  const nodes = canvasDocumentStore.selectedNodes
  if (nodes.length !== 1) return nodes
  const node = nodes[0]
  const result = resolveCanvasMaterializedCardResult(
    node, canvasDocumentStore.nodes, canvasDocumentStore.connections,
  )
  return [result ?? node]
})
const { createCinematicShotGraph, createShotGraph, createStoryboardRecipe, createVisualAssetRecipe } = useCanvasStoryboardRecipes({
  assets: () => resourceStore.assets,
  branchVisualRecipe,
  canvasId,
  generateVisualRecipe: generateRecipe,
  projectId,
  userId: () => authStore.user?.id ?? '',
})
const { createImageOperation } = useCanvasImageOperations({
  assets: () => resourceStore.assets, canvasId, generationCapabilities, projectId,
  getSelectedNodes: () => selectedProfessionalNodes.value,
  revealNode: (nodeId) => canvasStageRef.value?.revealNode(nodeId),
  userId: () => authStore.user?.id ?? '',
})
function openVideoEditPreflight(opener?: HTMLElement) {
  activateContextSurface('video-preflight', opener)
  videoEditPreflightOpen.value = true
}
function closeVideoEditPreflight() {
  contextSurfaceController.deactivate('video-preflight')
}
function openAudioGenerationPreflight() {
  activateContextSurface('audio-preflight')
  audioGenerationPreflightOpen.value = true
}
function closeAudioGenerationPreflight() {
  contextSurfaceController.deactivate('audio-preflight')
}
function openAgentSkillPreflight() {
  activateContextSurface('agent-skill')
  agentSkillPreflightOpen.value = true
}
function closeAgentSkillPreflight() {
  contextSurfaceController.deactivate('agent-skill')
}
function openScriptAuthoring(intent: ScriptAuthoringIntent) {
  activateContextSurface('context')
  scriptAuthoringIntent.value = null
  if (isCompact.value) isContextDrawerOpen.value = true
  void nextTick(() => { scriptAuthoringIntent.value = intent })
}
const professionalActionsBlocked = computed(() => (
  isRevisionPanelOpen.value || isResultCompareOpen.value || isResourceOpen.value ||
  (!isReplacementRuntime.value && (isContextDrawerOpen.value || isDesktopContextOpen.value)) ||
  videoEditPreflightOpen.value || audioGenerationPreflightOpen.value ||
  agentSkillPreflightOpen.value || workflowTemplateOpen.value || viewMode.value !== 'workflow'
))
const {
  actions: professionalActions,
  availableActionIdsFor,
  close: closeProfessionalActions,
  error: professionalActionError,
  execute: executeProfessionalAction,
  isOpen: professionalActionsOpen,
  open: openProfessionalActions,
  query: professionalActionQuery,
} = useCanvasProfessionalActions({
  assets: () => resourceStore.assets,
  canvasId,
  createShotGraph,
  createCinematicShotGraph,
  createImageOperation,
  createStoryboardRecipe,
  getInsertionPoint,
  imageOperationCapabilities: () => generationCapabilities.value?.image.operations ?? null,
  isBlocked: () => professionalActionsBlocked.value,
  isBusy: () => isUploading.value || isGenerating.value,
  isReadOnly: () => isReviewOnly.value || canvasRevisionStore.restoringRevision !== null,
  isWorkflowView: () => viewMode.value === 'workflow',
  openAgentSkillPreflight,
  openAudioGenerationPreflight,
  openScriptAuthoring,
  projectId,
  openVideoEditPreflight,
  splitImageGrid,
  userId: () => authStore.user?.id ?? '',
})
const replacementProfessionalActions = computed(() => professionalActions.value.filter((action) => (
  !/director|导演/i.test(`${action.id} ${action.title}`)
)))
const contextSurfaceController = useCanvasContextSurface({
  closeSurface(kind) {
    const closers: Record<CanvasContextSurfaceKind, () => void> = {
      'agent-skill': () => { agentSkillPreflightOpen.value = false },
      'audio-preflight': () => { audioGenerationPreflightOpen.value = false },
      compare: () => { isResultCompareOpen.value = false },
      context: () => { isContextDrawerOpen.value = false },
      professional: closeProfessionalActions,
      resources: () => { closeResources(false) },
      revision: () => { isRevisionPanelOpen.value = false },
      stage: () => { canvasStageRef.value?.closeTransientInteractions() },
      'video-preflight': () => { videoEditPreflightOpen.value = false },
      'workflow-template': () => { workflowTemplateOpen.value = false },
    }
    closers[kind]()
  },
  fallbackFocusTarget: () => document.querySelector<HTMLElement>('.canvas-surface'),
})
const contextSurface = contextSurfaceController.surface

function activateContextSurface(kind: CanvasContextSurfaceKind, opener?: HTMLElement | null) {
  contextSurfaceController.activate(kind, opener)
}

function openProfessionalActionsExclusive(opener: HTMLElement, initialQuery = '') {
  activateContextSurface('professional', opener)
  openProfessionalActions(
    opener,
    initialQuery,
    initialQuery && mediaActionTarget.value ? selectedProfessionalNodes.value : undefined,
  )
}

function openReplacementActions(payload: { opener: HTMLElement; query: string }) {
  openProfessionalActionsExclusive(payload.opener, payload.query)
}

function openWorkflowTemplateLibrary(opener: HTMLElement) {
  activateContextSurface('workflow-template', opener)
  workflowTemplateOpen.value = true
}

function closeWorkflowTemplateLibrary() {
  contextSurfaceController.deactivate('workflow-template')
}
const isDesktopContextVisible = computed(() => (
  isDesktopContextOpen.value &&
  !isStageContextSurfaceOpen.value &&
  !professionalActionsOpen.value &&
  !isRevisionPanelOpen.value &&
  !isResultCompareOpen.value &&
  !videoEditPreflightOpen.value &&
  !audioGenerationPreflightOpen.value &&
  !agentSkillPreflightOpen.value &&
  !workflowTemplateOpen.value
))
const EMPTY_PROFESSIONAL_ACTION_IDS: readonly string[] = Object.freeze([])
const mediaActionTarget = computed(() => {
  const selectedNodeIds = canvasDocumentStore.selectedNodeIds
  const selectedNode = selectedNodeIds.length === 1
    ? canvasDocumentStore.findNodeById(selectedNodeIds[0])
    : null
  const target = resolveOwnedMediaActionTarget({
    assets: resourceStore.assets,
    projectId: projectId.value,
    selectedNodes: selectedProfessionalNodes.value,
    userId: authStore.user?.id ?? '',
  })
  return target && selectedNode
    ? { ...target, nodeId: selectedNode.id, title: selectedNode.title }
    : target
})
const mediaProfessionalActionIds = computed(() => (
  mediaActionTarget.value
    ? availableActionIdsFor(selectedProfessionalNodes.value)
    : EMPTY_PROFESSIONAL_ACTION_IDS
))
const storyboardItems = computed(() => projectCanvasStoryboard({
  nodes: canvasDocumentStore.nodes,
  connections: canvasDocumentStore.connections,
  runtimePresentations: generationRuntimePresentations.value,
}))

const canvasViewportInsets = computed(() => ({ top: 96, right: isCompact.value && isContextDrawerOpen.value ? 376 : 16, bottom: 96, left: 16 }))
async function captureSelectedVideoFrame(nodeId: string, file: File, timeSeconds: number, aspectRatio: number) {
  const insertedNodeId = await captureVideoFrame(nodeId, file, timeSeconds, aspectRatio)
  if (insertedNodeId) await nextTick(() => canvasStageRef.value?.revealNode(insertedNodeId))
}
const selectedContinuationTrigger = computed(() => resolveCanvasNodeContinuationTrigger(canvasDocumentStore.nodes, canvasDocumentStore.selectedNodeIds, isReviewOnly.value || canvasRevisionStore.restoringRevision !== null))
const canFitProvenanceTrace = computed(() => Boolean(
  selectedResultLineage.value || (selectedNode.value && selectedMediaType.value && (
    selectedGenerationContext.value?.provenance.length ||
    resolveGenerationResultVariants(selectedNode.value, canvasDocumentStore.nodes, canvasDocumentStore.connections).length
  )),
))
const selectedGenerationInputLineage = computed(() => (
  selectedNode.value && selectedMediaType.value
    ? resolveGenerationInputLineageBridges(
        selectedNode.value, canvasDocumentStore.nodes, canvasDocumentStore.connections,
      )
    : []
))
const selectedGenerationVariants = computed(() => (
  selectedNode.value && selectedMediaType.value
    ? resolveGenerationResultVariants(selectedNode.value, canvasDocumentStore.nodes, canvasDocumentStore.connections)
    : []
))
const canArrangeProvenanceTrace = computed(() => Boolean(
  !isReviewOnly.value && selectedNode.value && createArrangeGenerationLineageCommand(
    canvasDocumentStore.nodes, canvasDocumentStore.connections, selectedNode.value.id,
  ),
))
let isDrawerContinuationPending = false
let isDrawerTraceArrangePending = false
let isDrawerTraceFitPending = false
let drawerLocateNodeId = ''

function continueFromContextDrawer() { isDrawerContinuationPending = true; isContextDrawerOpen.value = false }
function arrangeTraceFromContextDrawer() { isDrawerTraceArrangePending = true; isContextDrawerOpen.value = false }
function fitTraceFromContextDrawer() { isDrawerTraceFitPending = true; isContextDrawerOpen.value = false }
function locateNodeFromContext(nodeId: string) {
  storyboardAssetEditIntent.value = null
  if (isCompact.value) { drawerLocateNodeId = nodeId; isContextDrawerOpen.value = false; return }
  if (selectNodeForCanvasLocation(nodeId)) void nextTick(() => canvasStageRef.value?.revealNode(nodeId))
}
function editStoryboardAssetFromContext(intent: StoryboardAssetEditIntent) {
  storyboardAssetEditIntent.value = intent
  if (isCompact.value) { drawerLocateNodeId = intent.promptNodeId; isContextDrawerOpen.value = false; return }
  if (selectNodeForCanvasLocation(intent.promptNodeId)) {
    void nextTick(() => canvasStageRef.value?.revealNode(intent.promptNodeId))
  }
}
function handleContextDrawerAfterLeave() {
  if (isDrawerContinuationPending) { isDrawerContinuationPending = false; canvasStageRef.value?.openSelectedContinuation() }
  if (isDrawerTraceArrangePending) { isDrawerTraceArrangePending = false; canvasStageRef.value?.arrangeSelectedProvenanceTrace() }
  if (isDrawerTraceFitPending) { isDrawerTraceFitPending = false; canvasStageRef.value?.fitSelectedProvenanceTrace() }
  if (drawerLocateNodeId) {
    const nodeId = drawerLocateNodeId
    drawerLocateNodeId = ''
    if (selectNodeForCanvasLocation(nodeId)) void nextTick(() => canvasStageRef.value?.revealNode(nodeId))
  }
}

const comparisonVariants = computed(() => selectedResultLineage.value?.variants ?? selectedGenerationVariants.value)
const comparisonOriginTitle = computed(() => selectedResultLineage.value?.generationTitle ?? selectedNode.value?.title ?? '')
const comparisonItems = computed(() => comparisonVariants.value.flatMap((variant) => {
  const node = canvasDocumentStore.findNodeById(variant.nodeId)
  return node ? [{ node, order: variant.order, isSelected: variant.isSelected }] : []
}))
const compareTrayStyle = computed(() => ({ '--compare-left': isResourceOpen.value && !isCompact.value ? `${panelWidth.value + 16}px` : '16px', '--compare-right': isDesktopContextOpen.value ? '376px' : '16px' }))

function openResultComparison() {
  if (comparisonItems.value.length <= 1) return
  activateContextSurface('compare')
  isResultCompareOpen.value = true
}

function closeResultComparison() { contextSurfaceController.deactivate('compare') }

function closeProfessionalSurface() {
  contextSurfaceController.deactivate('professional', false)
}

function closeResourceSurface(restoreFocus = true) {
  closeResources(restoreFocus)
  contextSurfaceController.markClosed('resources')
}

function setViewMode(mode: CanvasViewMode) {
  if (viewMode.value === mode) return
  if (mode === 'storyboard') {
    contextSurfaceController.clear(false)
  }
  viewMode.value = mode
}

function selectStoryboardNode(nodeId: string) {
  if (canvasDocumentStore.findNodeById(nodeId)) canvasDocumentStore.selectNode(nodeId)
}

function reorderStoryboardItem(groupId: string, nodeId: string, direction: -1 | 1) {
  if (isReviewOnly.value) return
  const command = createReorderStoryboardGroupCommand(canvasDocumentStore.nodes, groupId, nodeId, direction)
  if (command) void canvasDocumentStore.dispatchCommand({ source: 'toolbar', command }).catch(() => undefined)
}

function selectComparedResult(nodeId: string) {
  contextSurfaceController.deactivate('compare', false)
  canvasDocumentStore.selectNode(nodeId)
  void nextTick(() => canvasStageRef.value?.revealNode(nodeId))
}
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
  const location = canvasRouteLocation(projectId.value, nextCanvas.id)
  await router.push(route.query.canvas_runtime === 'legacy'
    ? { ...location, query: { canvas_runtime: 'legacy' } }
    : location)
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

function openRevisionPanel(event?: Event | HTMLElement) {
  const opener = event instanceof HTMLElement ? event : event?.currentTarget
  if (!isRevisionPanelOpen.value) {
    activateContextSurface(
      'revision',
      opener instanceof HTMLElement ? opener : revisionTriggerRef.value,
    )
  }
  isRevisionPanelOpen.value = true
}

function updateReplacementPrompt(payload: { nodeId: string; prompt: string }) {
  void canvasDocumentStore.setNodeContent(payload.nodeId, payload.prompt)
}

function renameReplacementNode(payload: { nodeId: string; title: string }) {
  if (isReviewOnly.value || canvasRevisionStore.restoringRevision !== null) return
  const command = createRenameNodeCommand(
    canvasDocumentStore.nodes,
    payload.nodeId,
    payload.title,
  )
  if (command) void canvasDocumentStore.dispatchCommand({ source: 'accessibility', command })
}

async function updateReplacementComposition(payload: {
  generationMode: string | null
  nodeId: string
  parameters: GenerationNodeParameters | null
  prompt: string
  promptDocument: CanvasCardPromptDocument
  references: readonly CanvasCardReference[]
}) {
  const node = canvasDocumentStore.findNodeById(payload.nodeId)
  if (!node || isReviewOnly.value) return
  const card = buildCanvasCardViewModel(node)
  await canvasDocumentStore.setNodeCardConfiguration(payload.nodeId, {
    schemaVersion: 1,
    generationMode: payload.generationMode,
    modelId: card.configuration.modelId,
    promptDocument: payload.promptDocument,
    references: payload.references,
  }, payload.prompt)
  if (payload.parameters) {
    await canvasDocumentStore.setNodeGenerationParameters(payload.nodeId, payload.parameters)
  }
}

function moveReplacementNode(payload: { nodeId: string; x: number; y: number }) {
  if (isReviewOnly.value || canvasRevisionStore.restoringRevision !== null) return
  const node = canvasDocumentStore.nodes.find((candidate) => candidate.id === payload.nodeId)
  if (node && isNodeGroupContainer(node)) {
    const command = createMoveNodesByDeltaCommand(
      canvasDocumentStore.nodes,
      [node.id],
      { x: payload.x - node.x, y: payload.y - node.y },
    )
    if (command) void canvasDocumentStore.dispatchCommand({ source: 'pointer', command })
    return
  }
  const command = createMoveNodeMembershipCommand(
    canvasDocumentStore.nodes,
    payload.nodeId,
    { x: payload.x, y: payload.y },
  )
  if (command) void canvasDocumentStore.dispatchCommand({ source: 'pointer', command })
}

function moveReplacementSelection(payload: {
  deltaX: number
  deltaY: number
  nodeIds: string[]
}) {
  if (isReviewOnly.value || canvasRevisionStore.restoringRevision !== null) return
  const command = createMoveNodesByDeltaCommand(
    canvasDocumentStore.nodes,
    payload.nodeIds,
    { x: payload.deltaX, y: payload.deltaY },
  )
  if (command) void canvasDocumentStore.dispatchCommand({ source: 'pointer', command })
}

function connectReplacementNodes(payload: {
  sourceNodeId: string
  sourcePort?: string
  targetNodeId: string
  targetPort?: string
}) {
  if (isReviewOnly.value || canvasRevisionStore.restoringRevision !== null) return
  const command = createConnectNodesCommand(
    canvasDocumentStore.nodes,
    canvasDocumentStore.connections,
    payload.sourceNodeId,
    payload.targetNodeId,
    payload.sourcePort,
    payload.targetPort,
  )
  if (command) void canvasDocumentStore.dispatchCommand({ source: 'pointer', command })
}

function continueReplacementConnection(payload: {
  direction: ConnectionContinuationDirection
  option: ConnectionContinuationOption
  originNodeIds: string[]
  point: { x: number; y: number }
}) {
  if (isReviewOnly.value || canvasRevisionStore.restoringRevision !== null) return
  const origins = payload.originNodeIds.flatMap((nodeId) => {
    const origin = canvasDocumentStore.findNodeById(nodeId)
    return origin ? [origin] : []
  })
  if (!origins.length || origins.length !== payload.originNodeIds.length) return
  const command = origins.length > 1
    ? createMultiConnectionContinuationCommand(
      origins,
      payload.option,
      payload.point,
      undefined,
      canvasDocumentStore.nodes,
    )
    : createConnectionContinuationCommand(
      origins[0],
      payload.option,
      payload.point,
      payload.direction,
      undefined,
      canvasDocumentStore.nodes,
    )
  if (command) void canvasDocumentStore.dispatchCommand({ source: 'pointer', command })
}

function groupReplacementSelection() {
  if (isReviewOnly.value || canvasRevisionStore.restoringRevision !== null) return
  const command = createGroupNodesCommand(
    canvasDocumentStore.nodes,
    canvasDocumentStore.selectedNodeIds,
  )
  if (command) void canvasDocumentStore.dispatchCommand({ source: 'toolbar', command })
}

function ungroupReplacementSelection() {
  if (isReviewOnly.value || canvasRevisionStore.restoringRevision !== null) return
  const command = createUngroupNodesCommand(
    canvasDocumentStore.nodes,
    canvasDocumentStore.selectedNodeIds,
    canvasDocumentStore.connections,
  )
  if (command) void canvasDocumentStore.dispatchCommand({ source: 'toolbar', command })
}

function deleteReplacementSelection(source: 'keyboard' | 'context-menu') {
  if (isReviewOnly.value || canvasRevisionStore.restoringRevision !== null) return
  const command = createDeleteSelectionCommand(
    canvasDocumentStore.selectedNodeIds,
    canvasDocumentStore.selectedConnectionId ? [canvasDocumentStore.selectedConnectionId] : [],
  )
  if (command) void canvasDocumentStore.dispatchCommand({ source, command })
}

function selectReplacementNode(payload: {
  nodeId: string
  mode: 'replace' | 'toggle' | 'add'
}) {
  canvasDocumentStore.selectNode(payload.nodeId, payload.mode)
}

function updateReplacementConfiguration(payload: {
  configuration: CanvasCardConfigurationSnapshot
  nodeId: string
}) {
  void canvasDocumentStore.setNodeCardConfiguration(payload.nodeId, payload.configuration)
}

async function createReplacementNode(
  toolId:
    | 'text'
    | 'script'
    | 'image-generation'
    | 'video-generation'
    | 'video-composition'
    | 'audio-generation',
  point?: { x: number; y: number },
) {
  if (isReviewOnly.value || canvasRevisionStore.restoringRevision !== null) return
  if (toolId === 'audio-generation' && !generationCapabilities.value?.audio?.models.length) return
  const target = {
    text: { type: 'script' as const, subtype: 'prompt' },
    script: { type: 'script' as const, subtype: 'script' },
    'image-generation': { type: 'generation' as const, subtype: 'image' },
    'video-generation': { type: 'generation' as const, subtype: 'video' },
    'video-composition': { type: 'generation' as const, subtype: 'video-composition' },
    'audio-generation': { type: 'generation' as const, subtype: 'audio' },
  }[toolId]
  const offset = (canvasDocumentStore.nodes.length % 5) * 28
  const draft = createRegistryNodeDraft(target.type, target.subtype, point ?? {
    x: (window.innerWidth / 2 - canvasDocumentStore.viewport.x) / canvasDocumentStore.viewport.zoom - 170 + offset,
    y: (window.innerHeight / 2 - canvasDocumentStore.viewport.y) / canvasDocumentStore.viewport.zoom - 110 + offset,
  })
  const created = { id: createCanvasEntityId(), ...draft }
  await canvasDocumentStore.dispatchCommand({
    source: 'toolbar',
    command: { type: 'insert-graph', nodes: [created], connections: [] },
  })
  canvasDocumentStore.selectNode(created.id)
}

function switchReplacementCanvas(canvasId: string) {
  void navigateToCanvas(canvasId)
}

function closeRevisionPanel() {
  const opener = contextSurface.value.kind === 'revision' ? contextSurface.value.opener : null
  contextSurfaceController.deactivate('revision', false)
  void nextTick(() => {
    const canRestoreOpener = opener?.isConnected
      && opener.getAttribute('aria-disabled') !== 'true'
      && (!(opener instanceof HTMLButtonElement) || !opener.disabled)
    const target = canRestoreOpener ? opener : revisionTriggerRef.value
    target?.focus({ preventScroll: true })
  })
}

function retryProjectResources() {
  void resourceStore.refresh().catch(() => undefined)
}

function updateResourceDrawer(show: boolean) {
  if (!show) closeResourceSurface(false)
}

function updateContextDrawer(show: boolean) {
  if (!show) {
    closeContext()
    contextSurfaceController.markClosed('context')
  }
}

function dismissContextDrawer() {
  isContextDrawerOpen.value = false
  contextSurfaceController.markClosed('context')
}

function updateStageContextSurface(open: boolean) {
  isStageContextSurfaceOpen.value = open
  if (!open) contextSurfaceController.markClosed('stage')
}

watch([projectId, canvasId], ([nextProjectId, nextCanvasId], [previousProjectId]) => {
  const keepsProjectResources = previousProjectId === nextProjectId && contextSurface.value.kind === 'resources'
  if (!keepsProjectResources) contextSurfaceController.clear(false)
  viewMode.value = 'workflow'
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
    <template v-if="isReplacementRuntime">
      <CanvasReplacementRuntime
      :account-name="accountName"
      :allowed-audio-model-count="generationCapabilities?.audio?.models.length ?? 0"
      :assets="resourceStore.assets"
      :can-redo="canvasDocumentStore.canRedo"
      :can-undo="canvasDocumentStore.canUndo"
      :canvas-count="canvasListStore.items.length"
      :canvas-id="canvasId"
      :canvas-name="activeCanvas?.name || '画布'"
      :canvases="canvasListStore.items"
      :connections="replacementMaterializedProjection.connections"
      :document-ready="!canvasDocumentStore.isLoading"
      :generation-context="replacementGenerationContext"
      :generation-quota="replacementGenerationContext
        ? authStore.quotas[replacementGenerationContext.mediaType]
        : 0"
      :model-options="replacementModelOptions"
      :nodes="replacementMaterializedProjection.nodes"
      :project-name="projectName"
      :project-id="projectId"
      :readonly="isReviewOnly"
      :selected-node-id="canvasDocumentStore.selectedNodeId"
      :sync-label="syncLabel"
      :runtime-presentations="generationRuntimePresentations"
      :script-active="scriptGeneration.active.value"
      :script-capability="scriptGeneration.capability.value"
      :script-capability-error="composerCapabilityError"
      :script-capability-loading="isGenerationCapabilitiesLoading"
      :script-error="scriptGeneration.error.value"
      :script-quota="authStore.quotas.text"
      :script-success="scriptGeneration.success.value"
      :viewport="canvasDocumentStore.viewport"
      :view-mode="viewMode"
      :selected-node-ids="canvasDocumentStore.selectedNodeIds"
      @add-script-shot="addScriptShot"
      @cancel-script="scriptGeneration.cancel"
      @clear-selection="canvasDocumentStore.setSelection([])"
      @connect-nodes="connectReplacementNodes"
      @continue-connection="continueReplacementConnection"
      @create-node="createReplacementNode"
      @create-script-generation-batch="createScriptGenerationBatch"
      @delete-selection="deleteReplacementSelection"
      @delete-script-shot="deleteScriptShot"
      @generate="generateFromReplacement"
      @generate-script="scriptGeneration.generate"
      @group-selection="groupReplacementSelection"
      @move-node="moveReplacementNode"
      @move-selection="moveReplacementSelection"
      @open-actions="openReplacementActions"
      @open-templates="openWorkflowTemplateLibrary"
      @redo="canvasDocumentStore.redo()"
      @rename-node="renameReplacementNode"
      @retry-script-capability="reloadGenerationCapabilities"
      @select-node="selectReplacementNode"
      @set-selection="canvasDocumentStore.setSelection($event)"
      @set-script-prompts-confirmed="setScriptPromptsConfirmed"
      @set-script-shots-confirmed="setScriptShotsConfirmed"
      @switch-canvas="switchReplacementCanvas"
      @ungroup-selection="ungroupReplacementSelection"
      @undo="canvasDocumentStore.undo()"
      @update-configuration="updateReplacementConfiguration"
      @update-composition="updateReplacementComposition"
      @update-generation-parameters="updateGenerationParameters"
      @update-prompt="updateReplacementPrompt"
      @update-script-asset="updateScriptAsset"
      @update-script-shot="updateScriptShot"
      @update-viewport="canvasDocumentStore.updateViewport"
      @update:view-mode="setViewMode"
      />
      <CanvasProfessionalActionPalette
        v-if="professionalActionsOpen"
        :actions="replacementProfessionalActions"
        :error="professionalActionError"
        :query="professionalActionQuery"
        @close="closeProfessionalSurface"
        @select="executeProfessionalAction"
        @update:query="professionalActionQuery = $event"
      />
      <CanvasWorkflowTemplateDrawer
        v-if="workflowTemplateOpen"
        :assets="resourceStore.assets"
        :canvas-id="canvasId"
        :project-id="projectId"
        :review-only="isReviewOnly"
        @close="closeWorkflowTemplateLibrary"
      />
    </template>
    <div
      v-else
      class="v2-canvas-theme canvas-workspace"
      :data-context-surface="contextSurface.kind"
      :class="{
        'is-review-only': isReviewOnly,
        'is-storyboard-mode': viewMode === 'storyboard',
        'has-resource-panel': isResourceOpen && !isCompact,
        'has-context-panel': isDesktopContextOpen,
      }"
      :style="{ '--resource-panel-width': `${panelWidth}px` }"
    >
      <a class="skip-link" href="#canvas-main">跳到画布内容</a>

      <div v-show="viewMode === 'workflow'" class="canvas-layer" :aria-hidden="viewMode !== 'workflow'">
        <CanvasStage
          ref="canvasStageRef"
          :action-error="visibleError"
          :capture-pending="isUploading"
          :readonly="isReviewOnly || canvasRevisionStore.restoringRevision !== null"
          :context-overlay-open="isContextDrawerOpen && isCompact"
          :professional-actions-blocked="professionalActionsOpen || professionalActionsBlocked"
          :professional-action-ids="mediaProfessionalActionIds"
          :media-action-target="mediaActionTarget"
          :generation-runtime-presentations="generationRuntimePresentations" :pending-generation-results="pendingGenerationResults"
          :resources-open="isResourceOpen"
          :composer-attachments="composerAttachments"
          :composer-busy="scriptGeneration.active.value"
          :composer-capability-error="composerCapabilityError"
          :composer-capability-loading="isGenerationCapabilitiesLoading"
          :composer-model-id="scriptCapability?.model ?? ''"
          :composer-model-label="scriptCapability?.modelLabel ?? ''"
          :card-work-busy="isGenerating"
          :card-work-can-generate="viewMode === 'workflow' && Boolean(selectedMediaType) && selectedQuota > 0 && !isReviewOnly"
          :card-work-error="generationError"
          :card-work-generation-context="selectedGenerationContext"
          :card-work-has-source="Boolean(selectedGenerationContext?.imageIds.length)"
          :allowed-audio-model-count="generationCapabilities?.audio?.models.length ?? 0"
          :card-work-model-label="selectedMediaType ? (generationCapabilities?.[selectedMediaType]?.model ?? '') : ''"
          :card-work-parameter-summary="selectedGenerationContext?.parameterSummary ?? []"
          :card-work-source-count="selectedGenerationContext?.imageIds.length ?? 0"
          :storyboard-generation-summary="storyboardGenerationSummary"
          :script-authoring-active="scriptGeneration.active.value"
          :script-authoring-capability="scriptGeneration.capability.value"
          :script-authoring-capability-error="composerCapabilityError"
          :script-authoring-capability-loading="isGenerationCapabilitiesLoading"
          :script-authoring-error="scriptGeneration.error.value"
          :script-authoring-intent="scriptAuthoringIntent"
          :script-authoring-success="scriptGeneration.success.value"
          :script-quota="authStore.quotas.text"
          :text-generation-errors="textGeneration.errors.value"
          :text-generation-pending-node-ids="textGeneration.pendingNodeIds.value"
          :viewport-insets="canvasViewportInsets"
          @activate-context-surface="activateContextSurface('stage')"
          @card-generate="generateFromCard"
          @generate-storyboard-group="generateStoryboardGroup"
          @card-open-assets="openSelectedCardAssets"
          @card-upload="uploadSelectedCardSource"
          @card-update-parameters="updateGenerationParameters"
          @cancel-script-authoring="scriptGeneration.cancel"
          @context-surface-state="updateStageContextSurface"
          @materialized-card-pointer-select="suppressNextContextAutoOpen"
          @open-composer-resources="openComposerResources"
          @open-audio-generation-preflight="openAudioGenerationPreflight"
          @open-resources="openCanvasResources"
          @open-video-edit-preflight="openVideoEditPreflight"
          @open-professional-actions="openProfessionalActionsExclusive"
          @open-node-details="openContext"
          @open-revisions="openRevisionPanel"
          @branch-result="branchFromResult"
          @capture-video-frame="captureSelectedVideoFrame"
          @generate-script="scriptGeneration.generate"
          @generate-text-card="generateTextCard"
          @remove-composer-attachment="removeComposerAttachment"
          @retry-capabilities="reloadGenerationCapabilities"
          @retry-script-capability="reloadGenerationCapabilities"
          @submit-script="submitMainComposerScript"
        />
      </div>

      <CanvasProfessionalActionPalette
        v-if="professionalActionsOpen"
        :actions="professionalActions"
        :error="professionalActionError"
        :query="professionalActionQuery"
        @close="closeProfessionalSurface"
        @select="executeProfessionalAction"
        @update:query="professionalActionQuery = $event"
      />

      <CanvasVideoEditPreflightOverlay
        v-if="videoEditPreflightOpen"
        :assets="resourceStore.assets"
        :canvas-id="canvasId"
        :is-review-only="isReviewOnly"
        :project-id="projectId"
        @close="closeVideoEditPreflight"
      />

      <CanvasAudioGenerationPreflightOverlay
        v-if="audioGenerationPreflightOpen"
        :assets="resourceStore.assets"
        :capabilities="generationCapabilities"
        :canvas-id="canvasId"
        :is-review-only="isReviewOnly"
        :project-id="projectId"
        @close="closeAudioGenerationPreflight"
      />

      <CanvasAgentSkillPreflightOverlay
        v-if="agentSkillPreflightOpen"
        :canvas-id="canvasId"
        :is-review-only="isReviewOnly"
        :project-id="projectId"
        @close="closeAgentSkillPreflight"
      />

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
          <AccountSessionMenu :compact="isCompact" :display-name="accountName" />
        </div>
      </header>

      <CanvasViewModeSwitch class="workspace-view-switch" :model-value="viewMode" @update:model-value="setViewMode" />

      <div v-if="viewMode === 'storyboard'" class="storyboard-shell">
        <CanvasStoryboardView :items="storyboardItems" :nodes="canvasDocumentStore.nodes" :readonly="isReviewOnly" @reorder="reorderStoryboardItem" @select="selectStoryboardNode" />
      </div>

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
          :asset-action="resourceIntent"
          :error="visibleError"
          :is-loading="resourceStore.isLoading"
          :is-uploading="isUploading"
          mode="panel"
          :panel-width="panelWidth"
          :readonly="isReviewOnly"
          :tasks="resourceStore.tasks"
          :templates="resourceStore.templates"
          @attach-asset="attachSelectedResource"
          @capture-template="captureTemplate"
          @close="closeResourceSurface"
          @insert-asset="insertAsset"
          @instantiate-template="instantiateTemplate"
          @resize="setPanelWidth"
          @retry="retryProjectResources"
          @upload="handleResourceUpload"
        />
      </div>

      <div v-if="selectedNode && isDesktopContextVisible" class="context-panel-shell">
        <CanvasContextPanel
          :allow-generation-execution="viewMode === 'workflow'"
          :can-arrange-trace="viewMode === 'workflow' && canArrangeProvenanceTrace"
          :can-fit-trace="viewMode === 'workflow' && canFitProvenanceTrace"
          :error="generationError"
          :is-generating="isGenerating"
          :latest-task="latestTask"
          :runtime-presentation="selectedRuntimePresentation"
          :suppress-runtime-error="isCardRuntimeErrorAuthority"
          :generation-context="selectedGenerationContext"
          :generation-input-lineage="selectedGenerationInputLineage"
          :generation-tasks="resourceStore.tasks"
          :media-type="selectedMediaType"
          :project-id="projectId"
          :canvas-id="canvasId"
          :result-lineage="selectedResultLineage"
          mode="panel"
          :node="selectedNode"
          :output-variant-count="selectedGenerationVariants.length"
          :quota="selectedQuota"
          :readonly="isReviewOnly"
          :success="generationSuccess"
          :script-authoring-active="scriptGeneration.active.value"
          :script-authoring-capability="scriptGeneration.capability.value"
          :script-authoring-capability-error="composerCapabilityError"
          :script-authoring-capability-loading="isGenerationCapabilitiesLoading"
          :script-authoring-error="scriptGeneration.error.value"
          :script-authoring-intent="scriptAuthoringIntent"
          :script-authoring-in-card="!isReviewOnly"
          :script-authoring-success="scriptGeneration.success.value"
          :script-quota="authStore.quotas.text"
          :storyboard-asset-edit-intent="storyboardAssetEditIntent"
          @cancel-script-authoring="scriptGeneration.cancel"
          @generate-script="scriptGeneration.generate"
          @retry-script-capability="reloadGenerationCapabilities"
          @branch-generation="branchFromResult"
          @visual-recipe="createVisualAssetRecipe"
          @arrange-trace="canvasStageRef?.arrangeSelectedProvenanceTrace()"
          @close="closeContext"
          @compare-results="openResultComparison"
          @fit-trace="canvasStageRef?.fitSelectedProvenanceTrace()"
          @generate="generate"
          @edit-storyboard-asset="editStoryboardAssetFromContext"
          @director-preflight-ready="setDirectorPreflight"
          @locate-node="locateNodeFromContext"
          @reorder-input="reorderGenerationInput"
          @retry-recipe="generateRecipe"
          @update-prompt="updatePrompt"
          @update-parameters="updateGenerationParameters"
        />
      </div>

      <CanvasResultCompareTray
        v-if="isResultCompareOpen && comparisonItems.length > 1"
        :items="comparisonItems"
        :origin-title="comparisonOriginTitle"
        :style="compareTrayStyle"
        @close="closeResultComparison"
        @select="selectComparedResult"
      />

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
              :asset-action="resourceIntent"
              autofocus
              :error="visibleError"
              :is-loading="resourceStore.isLoading"
              :is-uploading="isUploading"
              mode="drawer"
              :readonly="isReviewOnly"
              :tasks="resourceStore.tasks"
              :templates="resourceStore.templates"
              @attach-asset="attachSelectedResource"
              @capture-template="captureTemplate"
              @close="closeResourceSurface"
              @insert-asset="insertAsset"
              @instantiate-template="instantiateTemplate"
              @retry="retryProjectResources"
              @upload="handleResourceUpload"
            />
          </div>
        </NDrawerContent>
      </NDrawer>

      <NDrawer
        :show="isContextDrawerOpen && isCompact && Boolean(selectedNode)"
        placement="right"
        :width="isReviewOnly ? '100%' : 360"
        @update:show="updateContextDrawer"
        @after-leave="handleContextDrawerAfterLeave"
      >
        <NDrawerContent body-content-style="height: 100%; padding: 0;">
          <div class="v2-canvas-theme drawer-theme">
            <CanvasContextPanel
              :allow-generation-execution="viewMode === 'workflow'"
              v-if="selectedNode"
              :can-arrange-trace="viewMode === 'workflow' && canArrangeProvenanceTrace"
              :can-continue="viewMode === 'workflow' && Boolean(selectedContinuationTrigger)"
              :can-fit-trace="viewMode === 'workflow' && canFitProvenanceTrace"
              :error="generationError"
              :is-generating="isGenerating"
              :latest-task="latestTask"
              :runtime-presentation="selectedRuntimePresentation"
              :suppress-runtime-error="isCardRuntimeErrorAuthority"
              :generation-context="selectedGenerationContext"
              :generation-input-lineage="selectedGenerationInputLineage"
              :generation-tasks="resourceStore.tasks"
              :media-type="selectedMediaType"
              :project-id="projectId"
              :canvas-id="canvasId"
              :result-lineage="selectedResultLineage"
              mode="drawer"
              :node="selectedNode"
              :output-variant-count="selectedGenerationVariants.length"
              :quota="selectedQuota"
              :readonly="isReviewOnly"
              :success="generationSuccess"
              :script-authoring-active="scriptGeneration.active.value"
              :script-authoring-capability="scriptGeneration.capability.value"
              :script-authoring-capability-error="composerCapabilityError"
              :script-authoring-capability-loading="isGenerationCapabilitiesLoading"
              :script-authoring-error="scriptGeneration.error.value"
              :script-authoring-intent="scriptAuthoringIntent"
              :script-authoring-in-card="!isReviewOnly"
              :script-authoring-success="scriptGeneration.success.value"
              :script-quota="authStore.quotas.text"
              :storyboard-asset-edit-intent="storyboardAssetEditIntent"
              @cancel-script-authoring="scriptGeneration.cancel"
              @generate-script="scriptGeneration.generate"
              @retry-script-capability="reloadGenerationCapabilities"
              @branch-generation="branchFromResult"
              @visual-recipe="createVisualAssetRecipe"
              @arrange-trace="arrangeTraceFromContextDrawer"
              @close="dismissContextDrawer"
              @continue-node="continueFromContextDrawer"
              @compare-results="openResultComparison"
              @fit-trace="fitTraceFromContextDrawer"
              @generate="generate"
              @edit-storyboard-asset="editStoryboardAssetFromContext"
              @director-preflight-ready="setDirectorPreflight"
              @locate-node="locateNodeFromContext"
              @reorder-input="reorderGenerationInput"
              @retry-recipe="generateRecipe"
              @update-prompt="updatePrompt"
              @update-parameters="updateGenerationParameters"
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
