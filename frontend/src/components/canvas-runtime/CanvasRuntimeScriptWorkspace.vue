<script setup lang="ts">
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Columns3,
  Download,
  ImagePlus,
  Plus,
  Sparkles,
  Video,
  X,
} from 'lucide-vue-next'
import { computed, ref } from 'vue'
import type {
  StoryAssetEditableField,
  StoryShotEditableField,
} from '../../modules/canvas/script-authoring'
import {
  resolveStoryShotSingleFrameIds,
  type StoryShotBatchOptions,
} from '../../modules/canvas/story-shot-generation'
import type { CanvasConnection, CanvasNode } from '../../types/canvas'

type ScriptStage = 'confirm' | 'assets' | 'prompts'
type AssetKind = 'roles' | 'scenes' | 'props'

interface StoryRecord {
  [key: string]: unknown
}

const props = defineProps<{
  active?: boolean
  connections: readonly CanvasConnection[]
  error?: string
  node: CanvasNode
  nodes: readonly CanvasNode[]
  success?: string
}>()

const emit = defineEmits<{
  addShot: [nodeId: string]
  close: []
  completeStoryboard: [nodeId: string]
  createGenerationBatch: [payload: {
    nodeId: string
    options: StoryShotBatchOptions
    shotIds: string[]
  }]
  deleteShot: [payload: { nodeId: string; shotId: string }]
  setPromptsConfirmed: [payload: { confirmed: boolean; nodeId: string; shotIds: string[] }]
  setShotsConfirmed: [payload: { confirmed: boolean; nodeId: string }]
  updateAsset: [payload: {
    assetId: string
    field: StoryAssetEditableField
    nodeId: string
    value: string
  }]
  updateShot: [payload: {
    field: StoryShotEditableField
    nodeId: string
    shotId: string
    value: string | number
  }]
}>()

function record(value: unknown): StoryRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as StoryRecord
    : null
}

function text(value: unknown) {
  return typeof value === 'string' ? value : ''
}

const production = computed(() => record(props.node.contentData?.story_production))
const shots = computed(() => {
  const candidates = production.value?.shots
  if (!Array.isArray(candidates)) return []
  return candidates.flatMap((candidate, index) => {
    const shot = record(candidate)
    if (!shot) return []
    const editable = record(shot.editable_fields) ?? {}
    const locked = record(shot.locked_fields) ?? {}
    const number = typeof shot.shot_number === 'number' ? shot.shot_number : index + 1
    return [{
      cameraMovement: text(shot.camera_movement),
      confirmed: locked.user_confirmation === true,
      dialogue: text(shot.dialogue),
      duration: typeof shot.duration_seconds === 'number' ? shot.duration_seconds : 5,
      finalPrompt: text(shot.video_prompt) || text(shot.image_prompt),
      framing: text(shot.framing),
      framingZh: text(editable.framing_zh) || localizeFraming(text(shot.framing)),
      id: text(shot.shot_id) || `shot-${number}`,
      lightingAtmosphere: text(editable.lighting_atmosphere),
      musicSfx: text(shot.music_sfx),
      number,
      promptConfirmed: locked.prompt_confirmation === true,
      promptZh: text(editable.video_prompt_zh) || text(editable.image_prompt_zh),
      visualDescription: text(shot.visual_description),
    }]
  })
})

const assetKindLabels: Record<AssetKind, string> = {
  roles: '角色',
  scenes: '场景',
  props: '道具',
}
const assetGroups = computed(() => {
  const source = record(production.value?.assets)
  return (Object.keys(assetKindLabels) as AssetKind[]).map((kind) => {
    const candidates = source?.[kind]
    const items = Array.isArray(candidates)
      ? candidates.flatMap((candidate) => {
          const asset = record(candidate)
          if (!asset) return []
          const editable = record(asset.editable_fields) ?? {}
          return [{
            description: text(asset.description),
            id: text(asset.asset_id),
            imagePrompt: text(asset.image_prompt),
            imagePromptZh: text(editable.image_prompt_zh),
            kind,
            name: text(asset.name),
          }]
        })
      : []
    return { items, kind, label: assetKindLabels[kind] }
  })
})

const stage = ref<ScriptStage>('confirm')
const selectedAssetId = ref('')
const promptDialogOpen = ref(false)
const selectedPromptIds = ref(new Set<string>())
const columnSettingsOpen = ref(false)
const exportOpen = ref(false)
const showDialogue = ref(true)
const showDuration = ref(true)
const batchDialog = ref<'' | 'image' | 'video'>('')
const batchShotIds = ref(new Set<string>())
const imageAspectRatio = ref('16:9')
const imageSize = ref('2K')
const videoAspectRatio = ref('16:9')
const videoDuration = ref(5)
const videoResolution = ref<'480p' | '720p' | '1080p'>('720p')
const videoMode = ref<'text-to-video' | 'image-to-video'>('text-to-video')
const storyConfirmed = computed(() => shots.value.length > 0 && shots.value.every((shot) => shot.confirmed))
const promptConfirmedCount = computed(() => shots.value.filter((shot) => shot.promptConfirmed).length)
const batchReady = computed(() => (
  storyConfirmed.value &&
  shots.value.length > 0 &&
  promptConfirmedCount.value === shots.value.length
))
const singleFrameShotIds = computed(() => resolveStoryShotSingleFrameIds({
  sourceNode: props.node,
  nodes: props.nodes,
  connections: props.connections,
}))
const selectedShotCount = computed(() => batchShotIds.value.size)
const imageToVideoReady = computed(() => (
  selectedShotCount.value > 0 &&
  [...batchShotIds.value].every((shotId) => singleFrameShotIds.value.has(shotId))
))
const selectedAsset = computed(() => assetGroups.value
  .flatMap((group) => group.items)
  .find((asset) => asset.id === selectedAssetId.value) ?? null)

function localizeFraming(value: string) {
  const normalized = value.trim().toLowerCase()
  const labels: Record<string, string> = {
    'close-up': '近景',
    'extreme close-up': '特写',
    'extreme wide shot': '大远景',
    'full shot': '全景',
    'long shot': '远景',
    'medium close-up': '中近景',
    'medium shot': '中景',
    'wide shot': '全景',
  }
  return labels[normalized] ?? (/[一-龥]/.test(value) ? value : '')
}

function setStage(nextStage: ScriptStage) {
  selectedAssetId.value = ''
  promptDialogOpen.value = false
  stage.value = nextStage
}

function updateShot(
  shotId: string,
  field: StoryShotEditableField,
  event: Event,
  numeric = false,
) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  emit('updateShot', {
    field,
    nodeId: props.node.id,
    shotId,
    value: numeric ? Number(target.value) : target.value,
  })
}

function updateAsset(field: StoryAssetEditableField, event: Event) {
  if (!selectedAsset.value) return
  emit('updateAsset', {
    assetId: selectedAsset.value.id,
    field,
    nodeId: props.node.id,
    value: (event.target as HTMLInputElement | HTMLTextAreaElement).value,
  })
}

function confirmShots() {
  emit('setShotsConfirmed', { confirmed: true, nodeId: props.node.id })
  setStage('assets')
}

function reopenShots() {
  emit('setShotsConfirmed', { confirmed: false, nodeId: props.node.id })
}

function openPromptConfirmation() {
  selectedPromptIds.value = new Set(shots.value.map((shot) => shot.id))
  promptDialogOpen.value = true
}

function togglePrompt(shotId: string, checked: boolean) {
  const next = new Set(selectedPromptIds.value)
  if (checked) next.add(shotId)
  else next.delete(shotId)
  selectedPromptIds.value = next
}

function confirmPrompts() {
  emit('setPromptsConfirmed', {
    confirmed: true,
    nodeId: props.node.id,
    shotIds: [...selectedPromptIds.value],
  })
  promptDialogOpen.value = false
}

function openBatchDialog(mediaType: 'image' | 'video') {
  if (!batchReady.value) return
  batchShotIds.value = new Set(shots.value.map((shot) => shot.id))
  videoMode.value = 'text-to-video'
  batchDialog.value = mediaType
}

function toggleBatchShot(shotId: string, checked: boolean) {
  const next = new Set(batchShotIds.value)
  if (checked) next.add(shotId)
  else next.delete(shotId)
  batchShotIds.value = next
  if (videoMode.value === 'image-to-video' && !imageToVideoReady.value) {
    videoMode.value = 'text-to-video'
  }
}

function createGenerationBatch() {
  if (!selectedShotCount.value || !batchDialog.value) return
  const options: StoryShotBatchOptions = batchDialog.value === 'image'
    ? {
        mediaType: 'image',
        aspectRatio: imageAspectRatio.value,
        imageSize: imageSize.value,
      }
    : {
        mediaType: 'video',
        aspectRatio: videoAspectRatio.value,
        durationSeconds: videoDuration.value,
        videoResolution: videoResolution.value,
        videoMode: videoMode.value,
      }
  emit('createGenerationBatch', {
    nodeId: props.node.id,
    options,
    shotIds: [...batchShotIds.value],
  })
  batchDialog.value = ''
}

function storyProduction() {
  return production.value
}

function safeExportName() {
  return (props.node.title.trim() || '脚本').replace(/[\\/:*?"<>|]+/g, '-')
}

function exportJson() {
  const current = storyProduction()
  if (!current) return
  const blob = new Blob([JSON.stringify(current, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${safeExportName()}-分镜.json`
  anchor.click()
  URL.revokeObjectURL(url)
  exportOpen.value = false
}
</script>

<template>
  <section class="runtime-script-workspace" data-script-workspace :aria-label="`${node.title} 结构化脚本`">
    <header class="runtime-script-workspace__header">
      <button type="button" aria-label="返回画布" @click="emit('close')">
        <ArrowLeft :size="18" aria-hidden="true" />
      </button>
      <div>
        <span>结构化脚本</span>
        <strong>{{ node.title }}</strong>
      </div>
      <div class="runtime-script-workspace__header-actions">
        <div>
          <button type="button" data-script-column-settings :aria-expanded="columnSettingsOpen" @click="columnSettingsOpen = !columnSettingsOpen; exportOpen = false">
            <Columns3 :size="15" aria-hidden="true" />列设置
          </button>
          <div v-if="columnSettingsOpen" class="runtime-script-workspace__menu" aria-label="分镜列设置">
            <label><input v-model="showDialogue" type="checkbox" /> 对白</label>
            <label><input v-model="showDuration" type="checkbox" /> 时长</label>
          </div>
        </div>
        <div>
          <button type="button" data-script-export :disabled="!shots.length" :aria-expanded="exportOpen" @click="exportOpen = !exportOpen; columnSettingsOpen = false">
            <Download :size="15" aria-hidden="true" />导出<ChevronDown :size="13" aria-hidden="true" />
          </button>
          <div v-if="exportOpen" class="runtime-script-workspace__menu" role="menu">
            <button type="button" role="menuitem" @click="exportJson">导出 JSON</button>
          </div>
        </div>
      </div>
    </header>

    <nav class="runtime-script-workspace__stages" aria-label="脚本制作阶段">
      <button type="button" :aria-current="stage === 'confirm' ? 'step' : undefined" @click="setStage('confirm')">
        <b>1</b><span>确认镜头<small>{{ shots.length }} 个镜头</small></span>
      </button>
      <i aria-hidden="true"></i>
      <button type="button" :aria-current="stage === 'assets' ? 'step' : undefined" @click="setStage('assets')">
        <b>2</b><span>准备资产<small>{{ assetGroups.reduce((sum, group) => sum + group.items.length, 0) }} 个资产</small></span>
      </button>
      <i aria-hidden="true"></i>
      <button type="button" :aria-current="stage === 'prompts' ? 'step' : undefined" @click="setStage('prompts')">
        <b>3</b><span>合成提示词<small>{{ promptConfirmedCount }}/{{ shots.length }} 已确认</small></span>
      </button>
    </nav>

    <main>
      <div class="runtime-script-workspace__summary">
        <div><small>脚本内容</small><p>{{ node.content || '尚未填写脚本简介。' }}</p></div>
        <button type="button" class="is-primary" :disabled="active" @click="emit('completeStoryboard', node.id)">
          <Sparkles :size="15" aria-hidden="true" />{{ active ? '正在创建…' : '自主创建分镜' }}
        </button>
      </div>
      <p v-if="error" class="runtime-script-workspace__message is-error" role="alert">{{ error }}</p>
      <p v-else-if="success" class="runtime-script-workspace__message" role="status">{{ success }}</p>
      <section class="runtime-script-workspace__batch-actions" aria-label="分镜生成节点">
        <p v-if="!batchReady">确认全部镜头与提示词后，可为所选镜头批量创建生成节点；创建节点不会自动调用 provider。</p>
        <p v-else>按 Agnes 官方能力创建文生图、文生视频或单图图生视频节点；角色与场景图不会直接送入 Video 做语义融合。</p>
        <div>
          <button type="button" :disabled="!batchReady" @click="openBatchDialog('image')">
            <ImagePlus :size="15" aria-hidden="true" />批量创建图片生成节点
          </button>
          <button type="button" :disabled="!batchReady" @click="openBatchDialog('video')">
            <Video :size="15" aria-hidden="true" />批量创建视频生成节点
          </button>
        </div>
      </section>

      <section v-if="stage === 'confirm'" class="runtime-script-workspace__stage-panel" aria-label="确认镜头">
        <div class="runtime-script-workspace__table-scroll">
          <table>
            <thead><tr>
              <th>镜号</th><th v-if="showDuration">时长</th><th>画面描述</th><th>景别</th>
              <th>中文景别</th><th>光影氛围</th><th v-if="showDialogue">对白/旁白</th>
              <th>音效</th><th>运镜</th><th>操作</th>
            </tr></thead>
            <tbody>
              <tr v-for="shot in shots" :key="shot.id">
                <td><strong>{{ String(shot.number).padStart(2, '0') }}</strong></td>
                <td v-if="showDuration" data-story-column="duration"><input :value="shot.duration" :disabled="shot.confirmed" :aria-label="`镜头 ${shot.number} 时长`" type="number" min="1" max="30" @change="updateShot(shot.id, 'duration_seconds', $event, true)" /></td>
                <td><textarea :value="shot.visualDescription" :disabled="shot.confirmed" :aria-label="`镜头 ${shot.number} 画面描述`" rows="3" @blur="updateShot(shot.id, 'visual_description', $event)"></textarea></td>
                <td><input :value="shot.framing" :disabled="shot.confirmed" :aria-label="`镜头 ${shot.number} 原始景别`" @blur="updateShot(shot.id, 'framing', $event)" /></td>
                <td><input :value="shot.framingZh" :disabled="shot.confirmed" :aria-label="`镜头 ${shot.number} 中文景别`" placeholder="请填写中文景别" @blur="updateShot(shot.id, 'framing_zh', $event)" /></td>
                <td><textarea :value="shot.lightingAtmosphere" :disabled="shot.confirmed" :aria-label="`镜头 ${shot.number} 光影氛围`" rows="3" @blur="updateShot(shot.id, 'lighting_atmosphere', $event)"></textarea></td>
                <td v-if="showDialogue" data-story-column="dialogue"><textarea :value="shot.dialogue" :disabled="shot.confirmed" :aria-label="`镜头 ${shot.number} 对白或旁白`" rows="3" @blur="updateShot(shot.id, 'dialogue', $event)"></textarea></td>
                <td><textarea :value="shot.musicSfx" :disabled="shot.confirmed" :aria-label="`镜头 ${shot.number} 音效`" rows="3" @blur="updateShot(shot.id, 'music_sfx', $event)"></textarea></td>
                <td><textarea :value="shot.cameraMovement" :disabled="shot.confirmed" :aria-label="`镜头 ${shot.number} 运镜`" rows="3" @blur="updateShot(shot.id, 'camera_movement', $event)"></textarea></td>
                <td><button type="button" class="is-danger" :disabled="shot.confirmed || shots.length <= 1" :aria-label="`删除镜头 ${shot.number}`" @click="emit('deleteShot', { nodeId: node.id, shotId: shot.id })">删除</button></td>
              </tr>
              <tr v-if="!shots.length"><td :colspan="10" role="status">当前脚本还没有已验证的分镜数据。</td></tr>
            </tbody>
          </table>
        </div>
        <footer class="runtime-script-workspace__footer">
          <button type="button" :disabled="storyConfirmed || !shots.length || shots.length >= 25" @click="emit('addShot', node.id)"><Plus :size="15" />添加镜头</button>
          <button v-if="storyConfirmed" type="button" @click="reopenShots">继续编辑镜头</button>
          <button v-else type="button" class="is-primary" :disabled="!shots.length" @click="confirmShots"><Check :size="15" />确认镜头并进入准备资产</button>
        </footer>
      </section>

      <section v-else-if="stage === 'assets'" class="runtime-script-workspace__assets" aria-label="故事资产">
        <div v-for="group in assetGroups" :key="group.kind" class="runtime-script-workspace__asset-group">
          <header><h2>{{ group.label }}</h2><small>{{ group.items.length }} 个</small></header>
          <div class="runtime-script-workspace__asset-grid">
            <button v-for="asset in group.items" :key="asset.id" type="button" :aria-label="`编辑${group.label} ${asset.name}`" @click="selectedAssetId = asset.id">
              <span class="runtime-script-workspace__asset-preview"><ImagePlus :size="24" /><small>在画布生成或关联{{ group.label }}图</small></span>
              <strong>{{ asset.name }}</strong><small>{{ asset.description }}</small>
            </button>
            <p v-if="!group.items.length">当前脚本没有{{ group.label }}资产。</p>
          </div>
        </div>
        <footer class="runtime-script-workspace__footer">
          <button type="button" @click="setStage('confirm')">上一步：确认镜头</button>
          <button type="button" class="is-primary" @click="setStage('prompts')">下一步：合成提示词</button>
        </footer>
      </section>

      <section v-else class="runtime-script-workspace__stage-panel" aria-label="合成提示词">
        <p class="runtime-script-workspace__notice">原始提示词保留给海外模型；中文提示词仅显示 provider 返回值或你的编辑，不自动臆译。</p>
        <div class="runtime-script-workspace__table-scroll">
          <table class="is-prompts">
            <thead><tr><th>镜号</th><th>画面描述</th><th>原始景别</th><th>中文景别</th><th>最终提示词（原文）</th><th>最终提示词（中文）</th><th>状态</th></tr></thead>
            <tbody>
              <tr v-for="shot in shots" :key="shot.id">
                <td><strong>{{ String(shot.number).padStart(2, '0') }}</strong></td>
                <td>{{ shot.visualDescription }}</td><td>{{ shot.framing }}</td><td>{{ shot.framingZh || '待填写' }}</td>
                <td><textarea :value="shot.finalPrompt" :disabled="shot.promptConfirmed" :aria-label="`镜头 ${shot.number} 最终提示词（原文）`" rows="4" @blur="updateShot(shot.id, 'video_prompt', $event)"></textarea></td>
                <td><textarea :value="shot.promptZh" :disabled="shot.promptConfirmed" :aria-label="`镜头 ${shot.number} 最终提示词（中文）`" placeholder="请填写中文提示词" rows="4" @blur="updateShot(shot.id, 'video_prompt_zh', $event)"></textarea></td>
                <td>{{ shot.promptConfirmed ? '已确认' : '待确认' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <footer class="runtime-script-workspace__footer">
          <span>{{ promptConfirmedCount }}/{{ shots.length }} 个提示词已确认</span>
          <button type="button" class="is-primary" :disabled="!shots.length" @click="openPromptConfirmation">确认全部提示词</button>
        </footer>
      </section>
    </main>

    <aside v-if="selectedAsset" class="runtime-script-workspace__drawer" role="dialog" aria-modal="true" :aria-label="`编辑${assetKindLabels[selectedAsset.kind]}`">
      <header><strong>编辑{{ assetKindLabels[selectedAsset.kind] }}</strong><button type="button" aria-label="关闭资产编辑" @click="selectedAssetId = ''"><X :size="18" /></button></header>
      <div class="runtime-script-workspace__asset-image"><ImagePlus :size="30" /><span>资产形象</span><small>复用画布现有 Image Generation 节点生成或关联</small></div>
      <button type="button" @click="emit('close')">返回画布生成资产</button>
      <label>{{ assetKindLabels[selectedAsset.kind] }}名称<input :value="selectedAsset.name" :aria-label="`${assetKindLabels[selectedAsset.kind]} ${selectedAsset.name} 名称`" @blur="updateAsset('name', $event)" /></label>
      <label>{{ assetKindLabels[selectedAsset.kind] }}描述<textarea :value="selectedAsset.description" :aria-label="`${assetKindLabels[selectedAsset.kind]} ${selectedAsset.name} 描述`" rows="10" @blur="updateAsset('description', $event)"></textarea></label>
      <label>图像提示词（原文）<textarea :value="selectedAsset.imagePrompt" rows="5" @blur="updateAsset('image_prompt', $event)"></textarea></label>
      <label>图像提示词（中文）<textarea :value="selectedAsset.imagePromptZh" placeholder="请填写中文提示词" rows="5" @blur="updateAsset('image_prompt_zh', $event)"></textarea></label>
    </aside>

    <div v-if="promptDialogOpen" class="runtime-script-workspace__backdrop">
      <section class="runtime-script-workspace__prompt-dialog" role="dialog" aria-modal="true" aria-label="确认提示词">
        <header><strong>确认提示词</strong><button type="button" aria-label="关闭确认提示词" @click="promptDialogOpen = false"><X :size="18" /></button></header>
        <div class="runtime-script-workspace__prompt-list">
          <label v-for="shot in shots" :key="shot.id">
            <input type="checkbox" :checked="selectedPromptIds.has(shot.id)" :aria-label="`选择镜头 ${shot.number}`" @change="togglePrompt(shot.id, ($event.target as HTMLInputElement).checked)" />
            <strong>镜头 {{ shot.number }}</strong><span>{{ shot.visualDescription }}</span>
          </label>
        </div>
        <footer><span>已选 {{ selectedPromptIds.size }}/{{ shots.length }}</span><button type="button" class="is-primary" :disabled="!selectedPromptIds.size" @click="confirmPrompts">确认所选提示词</button></footer>
      </section>
    </div>

    <div v-if="batchDialog" class="runtime-script-workspace__backdrop">
      <section
        class="runtime-script-workspace__batch-dialog"
        role="dialog"
        aria-modal="true"
        :aria-label="batchDialog === 'image' ? '批量创建图片生成节点' : '批量创建视频生成节点'"
      >
        <header>
          <div>
            <strong>{{ batchDialog === 'image' ? '批量创建图片生成节点' : '批量创建视频生成节点' }}</strong>
            <small>仅写入当前 Canvas；确认后仍需在各节点手动生成。</small>
          </div>
          <button type="button" aria-label="关闭批量创建" @click="batchDialog = ''"><X :size="18" /></button>
        </header>
        <div class="runtime-script-workspace__batch-list">
          <label v-for="shot in shots" :key="shot.id">
            <input
              type="checkbox"
              :checked="batchShotIds.has(shot.id)"
              :aria-label="`选择镜头 ${shot.number}`"
              @change="toggleBatchShot(shot.id, ($event.target as HTMLInputElement).checked)"
            />
            <strong>镜头 {{ shot.number }}</strong>
            <span>{{ batchDialog === 'image' ? shot.finalPrompt || shot.visualDescription : shot.finalPrompt }}</span>
            <small v-if="batchDialog === 'video'">
              {{ singleFrameShotIds.has(shot.id) ? '已有一张可用画面' : '可创建文生视频；单图模式需先生成画面' }}
            </small>
          </label>
        </div>
        <fieldset v-if="batchDialog === 'video'" class="runtime-script-workspace__batch-modes">
          <legend>Agnes Video 官方模式</legend>
          <label><input v-model="videoMode" type="radio" value="text-to-video" />文生视频</label>
          <label :title="imageToVideoReady ? '' : '所选镜头需要各有且仅有一张已生成画面'">
            <input v-model="videoMode" type="radio" value="image-to-video" :disabled="!imageToVideoReady" />单图图生视频
          </label>
          <small>关键帧需要按顺序提供首帧、中间关键帧和尾帧；当前批量分镜没有足够的官方输入，暂不可用。</small>
        </fieldset>
        <div class="runtime-script-workspace__batch-parameters">
          <label v-if="batchDialog === 'image'">图片比例
            <select v-model="imageAspectRatio" aria-label="图片比例">
              <option v-for="ratio in ['1:1', '3:4', '4:3', '16:9', '9:16', '2:3', '3:2', '21:9']" :key="ratio" :value="ratio">{{ ratio }}</option>
            </select>
          </label>
          <label v-if="batchDialog === 'image'">图片规格
            <select v-model="imageSize" aria-label="图片规格">
              <option v-for="size in ['1K', '2K', '3K', '4K']" :key="size" :value="size">{{ size }}</option>
            </select>
          </label>
          <label v-if="batchDialog === 'video'">视频比例
            <select v-model="videoAspectRatio" aria-label="视频比例">
              <option v-for="ratio in ['16:9', '9:16', '1:1', '4:3', '3:4']" :key="ratio" :value="ratio">{{ ratio }}</option>
            </select>
          </label>
          <label v-if="batchDialog === 'video'">视频清晰度
            <select v-model="videoResolution" aria-label="视频清晰度">
              <option v-for="resolution in ['480p', '720p', '1080p']" :key="resolution" :value="resolution">{{ resolution }}</option>
            </select>
          </label>
          <label v-if="batchDialog === 'video'">视频时长
            <select v-model="videoDuration" aria-label="视频时长">
              <option v-for="duration in [3, 5, 10, 18]" :key="duration" :value="duration">{{ duration }}s</option>
            </select>
          </label>
        </div>
        <p v-if="batchDialog === 'video'" class="runtime-script-workspace__batch-note">
          清晰度是 Agnes 请求档位；provider 会标准化宽高，实际尺寸以生成结果为准。
        </p>
        <footer>
          <span>已选 {{ selectedShotCount }}/{{ shots.length }}</span>
          <button
            type="button"
            class="is-primary"
            :disabled="!selectedShotCount || (videoMode === 'image-to-video' && !imageToVideoReady)"
            @click="createGenerationBatch"
          >
            创建 {{ selectedShotCount }} 个{{ batchDialog === 'image' ? '图片' : '视频' }}生成节点
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>

<style scoped src="./canvas-runtime-script-workspace.scss" lang="scss"></style>
