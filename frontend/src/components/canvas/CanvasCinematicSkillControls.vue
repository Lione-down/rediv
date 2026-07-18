<script setup lang="ts">
import { AtSign, ChevronDown, CircleAlert, CircleCheck, LoaderCircle, Trash2 } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { request } from '../../api/request'
import {
  loadCinematicSkillCapabilities,
  loadCinematicSkillSources,
  parseCinematicSkillNodeSettings,
  recommendedCinematicSkillNodeSettings,
  requestCinematicSkillPreflight,
  type CinematicSkillNodeSettings,
  type CinematicSkillPreflight,
  type CinematicSkillSource,
} from '../../modules/canvas/cinematic-skills'
import { acknowledgeProviderCost } from '../../modules/canvas/provider-cost-acknowledgement'
import { useCanvasStore } from '../../store/canvas'
import type { CanvasNode } from '../../types/canvas'

const props = withDefaults(defineProps<{
  canvasId?: string
  disabled?: boolean
  generationParameters?: object
  mediaType: 'image' | 'video'
  node: CanvasNode
  projectId?: string
  readonly?: boolean
  userInstruction?: string
}>(), {
  canvasId: '',
  disabled: false,
  generationParameters: () => ({}),
  projectId: '',
  readonly: false,
  userInstruction: '',
})

const canvasStore = useCanvasStore()
const capabilities = ref<Awaited<ReturnType<typeof loadCinematicSkillCapabilities>> | null>(null)
const sources = ref<CinematicSkillSource[]>([])
const sourceCanvasRevision = ref(0)
const isLoading = ref(false)
const isChooserOpen = ref(false)
const instruction = ref('')
const selectedRole = ref(props.mediaType === 'image' ? 'identity' : 'first-frame')
const error = ref('')
const preflight = ref<CinematicSkillPreflight | null>(null)
const acknowledgementHours = ref(24)
const isAcknowledging = ref(false)
const isAcknowledged = ref(false)
const loadedScope = ref('')

const scopeKey = computed(() => `${props.projectId}:${props.canvasId}:${props.node.id}`)

const roleOptions = computed(() => props.mediaType === 'image'
  ? [
      ['general', '通用参考'], ['style', '画风'], ['identity', '角色身份'], ['wardrobe', '服装'],
      ['scene', '场景'], ['product', '产品'], ['context', '文本上下文'],
    ]
  : [
      ['general', '通用参考'], ['first-frame', '视频首帧'], ['last-frame', '视频尾帧'],
      ['identity', '角色身份'], ['style', '画风'], ['scene', '场景'], ['action', '动作节奏'],
      ['first-and-last-frame', '同图首尾帧（capability 预检）'], ['context', '文本上下文'],
    ])

const availableModels = computed(() => capabilities.value?.providers.flatMap((provider) => (
  provider.models.filter((model) => model.media_type === props.mediaType).map((model) => ({ provider, model }))
)) ?? [])
const recommended = computed(() => {
  const choice = availableModels.value[0]
  return recommendedCinematicSkillNodeSettings(
    props.mediaType, choice?.provider.id ?? 'unavailable', choice?.model.id ?? 'unavailable',
  )
})
const persisted = computed(() => {
  try {
    return parseCinematicSkillNodeSettings(props.node.contentData?.cinematic_skill, props.mediaType)
  } catch {
    return null
  }
})
const settings = computed(() => persisted.value ?? recommended.value)
const sourceById = computed(() => new Map(sources.value.map((source) => [source.node_id, source])))
function selectModel(event: Event) {
  const [providerId, modelId] = (event.target as HTMLSelectElement).value.split('::', 2)
  const choice = availableModels.value.find(({ provider, model }) => provider.id === providerId && model.id === modelId)
  if (choice) void persist({ ...settings.value, provider_id: providerId, model_id: modelId })
}

function formatError(value: unknown) {
  const candidate = value as { response?: { data?: { detail?: unknown } }; message?: unknown }
  const detail = candidate?.response?.data?.detail
  if (typeof detail === 'string' && detail) return detail
  return typeof candidate?.message === 'string' && candidate.message ? candidate.message : 'Cinematic Skill 操作失败。'
}

async function loadContract() {
  if (!props.projectId || !props.canvasId) return
  if (loadedScope.value === scopeKey.value && capabilities.value) return
  isLoading.value = true
  error.value = ''
  try {
    const [nextCapabilities, nextSources] = await Promise.all([
      loadCinematicSkillCapabilities(props.projectId, props.canvasId, request),
      loadCinematicSkillSources(props.projectId, props.canvasId, request),
    ])
    capabilities.value = nextCapabilities
    sources.value = nextSources.items.filter((source) => source.node_id !== props.node.id)
    sourceCanvasRevision.value = nextSources.canvas_revision
    loadedScope.value = scopeKey.value
  } catch (value) {
    capabilities.value = null
    sources.value = []
    error.value = formatError(value)
  } finally {
    isLoading.value = false
  }
}

async function persist(next: CinematicSkillNodeSettings) {
  if (props.readonly || props.disabled) return
  preflight.value = null
  error.value = ''
  await canvasStore.setNodeCinematicSkillSettings(props.node.id, next)
}

async function toggleEnabled(event: Event) {
  const isEnabled = (event.target as HTMLInputElement).checked
  if (!isEnabled) {
    await persist({ ...settings.value, enabled: false })
    return
  }
  if (!capabilities.value) await loadContract()
  const choice = availableModels.value[0]
  if (!choice) {
    error.value = '当前 Canvas 没有可用的 Cinematic Skill provider/model。'
    return
  }
  await persist({
    ...settings.value,
    enabled: true,
    provider_id: choice.provider.id,
    model_id: choice.model.id,
  })
}

function openChooser(event: KeyboardEvent) {
  if (event.key === '@') isChooserOpen.value = true
  if (event.key === 'Escape') isChooserOpen.value = false
}

async function addMention(source: CinematicSkillSource) {
  let nextInstruction = instruction.value.trim()
  if (nextInstruction.startsWith('@')) nextInstruction = nextInstruction.slice(1).trim()
  if (!nextInstruction) {
    error.value = '请先填写这个 @ 引用要保留或允许改变的内容。'
    return
  }
  if (settings.value.mentions.some((mention) => mention.node_id === source.node_id)) {
    error.value = '同一节点不能重复绑定。'
    return
  }
  await persist({
    ...settings.value,
    enabled: true,
    mentions: [...settings.value.mentions, {
      node_id: source.node_id,
      role: selectedRole.value,
      instruction: nextInstruction,
      source_revision: source.source_revision,
    }],
  })
  instruction.value = ''
  isChooserOpen.value = false
}

function removeMention(nodeId: string) {
  void persist({
    ...settings.value,
    mentions: settings.value.mentions.filter((mention) => mention.node_id !== nodeId),
  })
}

async function runPreflight() {
  if (!settings.value.enabled || !props.userInstruction.trim() || !props.projectId || !props.canvasId) return
  isLoading.value = true
  error.value = ''
  preflight.value = null
  try {
    if (!persisted.value) await persist(settings.value)
    await canvasStore.flushPendingPersistence()
    const nextSources = await loadCinematicSkillSources(props.projectId, props.canvasId, request)
    sources.value = nextSources.items.filter((source) => source.node_id !== props.node.id)
    sourceCanvasRevision.value = nextSources.canvas_revision
    preflight.value = await requestCinematicSkillPreflight({
      projectId: props.projectId,
      canvasId: props.canvasId,
      canvasRevision: nextSources.canvas_revision,
      skillId: settings.value.skill_id,
      skillVersion: 1,
      providerId: settings.value.provider_id,
      modelId: settings.value.model_id,
      userInstruction: props.userInstruction,
      mentions: settings.value.mentions.map((mention) => ({
        ...mention,
        display_title: sourceById.value.get(mention.node_id)?.title ?? mention.node_id,
      })),
      generationParameters: { ...props.generationParameters },
    }, request)
    isAcknowledged.value = !preflight.value.requires_acknowledgement
  } catch (value) {
    error.value = formatError(value)
  } finally {
    isLoading.value = false
  }
}

async function confirmProviderCost() {
  if (!preflight.value?.requires_acknowledgement) return
  isAcknowledging.value = true
  error.value = ''
  try {
    const result = await acknowledgeProviderCost(
      preflight.value.provider_id, acknowledgementHours.value, request,
    )
    isAcknowledged.value = result.active
    if (!result.active) throw new Error('计费确认未生效，生成仍被阻止。')
  } catch (value) {
    error.value = formatError(value)
  } finally {
    isAcknowledging.value = false
  }
}

function cancelProviderCost() {
  isAcknowledged.value = false
  preflight.value = null
  error.value = '已取消用户计费确认；本次执行未创建任务或消耗 quota。'
}

watch(() => [props.projectId, props.canvasId, props.node.id], () => {
  if (persisted.value?.enabled && loadedScope.value !== scopeKey.value) void loadContract()
})
watch(() => props.mediaType, () => {
  selectedRole.value = props.mediaType === 'image' ? 'identity' : 'first-frame'
  preflight.value = null
})
onMounted(() => {
  if (persisted.value?.enabled) void loadContract()
})
</script>

<template>
  <section class="cinematic-skill" aria-label="Cinematic Skill 与结构化引用">
    <header>
      <span><AtSign :size="14" aria-hidden="true" />Cinematic Skill</span>
      <label v-if="!readonly" class="skill-toggle">
        <input type="checkbox" :checked="settings.enabled" :disabled="disabled" @change="toggleEnabled">
        <span>{{ persisted ? '已选择' : '推荐' }}</span>
      </label>
      <span v-else>{{ settings.enabled ? '已启用' : '未启用' }}</span>
    </header>
    <div v-if="settings.enabled" class="skill-identity">
      <strong>{{ settings.skill_id }}.v{{ settings.skill_version }}</strong>
      <small>{{ settings.provider_id }} / {{ settings.model_id }}</small>
    </div>
    <label v-if="!readonly && settings.enabled" class="model-field">
      <span>Provider / model（用户选择）</span>
      <select :value="`${settings.provider_id}::${settings.model_id}`" :disabled="disabled || availableModels.length < 2" aria-label="Cinematic Skill model" @change="selectModel">
        <option v-for="choice in availableModels" :key="`${choice.provider.id}::${choice.model.id}`" :value="`${choice.provider.id}::${choice.model.id}`">{{ choice.provider.id }} / {{ choice.model.id }}</option>
      </select>
    </label>

    <template v-if="settings.enabled">
      <div v-if="!readonly" class="mention-composer">
        <label>
          <span>引用角色</span>
          <select v-model="selectedRole" :disabled="disabled" aria-label="结构化引用角色">
            <option v-for="option in roleOptions" :key="option[0]" :value="option[0]">{{ option[1] }}</option>
          </select>
        </label>
        <label>
          <span>输入 @ 打开当前 Canvas 节点</span>
          <input
            v-model="instruction"
            type="text"
            maxlength="500"
            aria-label="结构化 @ 引用指令"
            placeholder="@ 保持脸型、发型和服装"
            :disabled="disabled"
            @focus="isChooserOpen = instruction.includes('@')"
            @keydown="openChooser"
          >
        </label>
        <div v-if="isChooserOpen" class="mention-chooser" role="listbox" aria-label="当前 Canvas 可引用节点">
          <button
            v-for="source in sources"
            :key="source.node_id"
            type="button"
            role="option"
            :disabled="settings.mentions.some((mention) => mention.node_id === source.node_id)"
            @click="addMention(source)"
          ><span>{{ source.title }}</span><small>{{ source.node_type }} · {{ source.subtype }}</small></button>
          <p v-if="!sources.length">没有可引用的 canonical 节点。</p>
        </div>
      </div>

      <ul v-if="settings.mentions.length" class="mention-tokens" aria-label="已绑定结构化引用">
        <li v-for="mention in settings.mentions" :key="mention.node_id">
          <span><strong>@{{ sourceById.get(mention.node_id)?.title ?? mention.node_id }}</strong><small>{{ mention.role }} · {{ mention.instruction }}</small></span>
          <CircleAlert v-if="sourceById.get(mention.node_id)?.source_revision !== mention.source_revision" :size="14" aria-label="引用来源已变更" />
          <button v-if="!readonly" type="button" :aria-label="`移除引用 ${sourceById.get(mention.node_id)?.title ?? mention.node_id}`" @click="removeMention(mention.node_id)"><Trash2 :size="14" aria-hidden="true" /></button>
        </li>
      </ul>
      <p v-else class="empty-mentions">尚未绑定引用；Skill 只优化当前 prompt 与参数。</p>

      <button v-if="!readonly" type="button" class="preflight-button" :disabled="disabled || isLoading || !userInstruction.trim()" @click="runPreflight">
        <LoaderCircle v-if="isLoading" :size="14" class="is-spinning" aria-hidden="true" />
        <ChevronDown v-else :size="14" aria-hidden="true" />
        预检优化请求
      </button>
      <p v-if="error" class="skill-error" role="alert">{{ error }}</p>
      <section v-if="preflight" class="skill-summary" aria-label="Cinematic Skill 执行摘要">
        <span><CircleCheck :size="14" aria-hidden="true" />预检通过</span>
        <strong>{{ preflight.skill.id }}.v{{ preflight.skill.version }}</strong>
        <p>{{ preflight.references.length }} 个引用 · {{ preflight.provider_id }} / {{ preflight.model_id }} · {{ preflight.requires_acknowledgement ? '需要用户计费确认' : '无需用户计费确认' }}</p>
        <details>
          <summary>查看 exact optimized request</summary>
          <pre>{{ preflight.exact_request }}</pre>
        </details>
        <section
          v-if="preflight.requires_acknowledgement && !isAcknowledged"
          class="billing-reminder"
          role="dialog"
          aria-modal="false"
          aria-label="用户计费 provider 提醒"
        >
          <strong>{{ preflight.provider_id }} / {{ preflight.model_id }} 将消耗你的 provider quota 或余额</strong>
          <label>不再提醒时长
            <select v-model.number="acknowledgementHours" aria-label="计费提醒抑制时长">
              <option :value="1">1 小时</option>
              <option :value="24">24 小时（默认）</option>
              <option :value="168">7 天</option>
              <option :value="720">30 天（最大）</option>
            </select>
          </label>
          <div>
            <button type="button" :disabled="isAcknowledging" @click="confirmProviderCost">确认并允许执行</button>
            <button type="button" :disabled="isAcknowledging" @click="cancelProviderCost">取消</button>
          </div>
        </section>
        <p v-else-if="preflight.requires_acknowledgement" class="billing-confirmed">计费提醒已确认；server acknowledgement 有效期内可显式执行。</p>
      </section>
    </template>
    <p v-else class="empty-mentions">已关闭推荐 Skill；普通 generation 不会静默套用优化。</p>
  </section>
</template>

<style scoped>
.cinematic-skill { display: grid; gap: 9px; padding: 11px; border: 1px solid var(--v2-border-subtle); border-radius: var(--v2-radius-md); background: color-mix(in srgb, var(--v2-surface-2) 84%, transparent); }
.cinematic-skill header, .cinematic-skill header span, .skill-toggle, .skill-summary > span { display: flex; align-items: center; gap: 6px; }.cinematic-skill header { justify-content: space-between; color: var(--v2-text-secondary); font-size: 11px; }.skill-toggle { cursor: pointer; }.skill-identity { display: grid; gap: 2px; }.skill-identity strong { color: var(--v2-accent-hover); font-size: 12px; }.skill-identity small, .mention-tokens small { color: var(--v2-text-muted); font-size: 10px; }.model-field, .mention-composer, .mention-composer label { display: grid; gap: 5px; color: var(--v2-text-secondary); font-size: 10px; }.mention-composer { position: relative; grid-template-columns: minmax(112px, .55fr) minmax(0, 1fr); }.cinematic-skill input[type='text'], .cinematic-skill select { min-height: 34px; padding: 6px 8px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-sm); color: var(--v2-text-primary); background: var(--v2-canvas); font: inherit; }.mention-chooser { position: absolute; z-index: 2; top: calc(100% + 4px); right: 0; display: grid; width: min(100%, 310px); max-height: 190px; padding: 5px; overflow-y: auto; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-md); background: var(--v2-surface-3); box-shadow: var(--v2-shadow-prominent); }.mention-chooser button { display: grid; gap: 2px; padding: 8px; border: 0; border-radius: var(--v2-radius-sm); color: var(--v2-text-primary); background: transparent; text-align: left; cursor: pointer; }.mention-chooser button:hover, .mention-chooser button:focus-visible { background: var(--v2-accent-soft); }.mention-tokens { display: grid; gap: 5px; margin: 0; padding: 0; list-style: none; }.mention-tokens li { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 6px; align-items: center; padding: 7px 8px; border-radius: var(--v2-radius-sm); background: var(--v2-surface-1); }.mention-tokens li span { display: grid; min-width: 0; }.mention-tokens strong { overflow: hidden; text-overflow: ellipsis; color: var(--v2-text-primary); font-size: 11px; white-space: nowrap; }.mention-tokens button { display: grid; width: 28px; height: 28px; place-items: center; border: 0; border-radius: var(--v2-radius-sm); color: var(--v2-text-muted); background: transparent; cursor: pointer; }.preflight-button { display: flex; min-height: 36px; align-items: center; justify-content: center; gap: 7px; border: 1px solid var(--v2-accent-border); border-radius: var(--v2-radius-sm); color: var(--v2-accent-hover); background: var(--v2-accent-soft); cursor: pointer; }.preflight-button:disabled { cursor: not-allowed; opacity: .5; }.skill-error, .empty-mentions, .skill-summary p { margin: 0; color: var(--v2-text-muted); font-size: 10px; line-height: 1.5; }.skill-error { color: var(--v2-danger); }.skill-summary { display: grid; gap: 6px; padding-top: 4px; border-top: 1px solid var(--v2-border-subtle); }.skill-summary > span { color: var(--v2-success); font-size: 11px; }.skill-summary details { min-width: 0; }.skill-summary summary { color: var(--v2-text-secondary); cursor: pointer; font-size: 10px; }.skill-summary pre { max-height: 180px; margin: 6px 0 0; padding: 8px; overflow: auto; border-radius: var(--v2-radius-sm); color: var(--v2-text-secondary); background: var(--v2-canvas); font: 10px/1.5 ui-monospace, monospace; white-space: pre-wrap; overflow-wrap: anywhere; }.cinematic-skill :focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }.is-spinning { animation: spin 1s linear infinite; }@keyframes spin { to { transform: rotate(360deg); } }@media (prefers-reduced-motion: reduce) { .is-spinning { animation: none; } }@media (max-width: 420px) { .mention-composer { grid-template-columns: 1fr; } }
.billing-reminder { display: grid; gap: 8px; padding: 9px; border: 1px solid var(--v2-warning); border-radius: var(--v2-radius-sm); background: var(--v2-surface-1); }.billing-reminder label { display: grid; gap: 4px; color: var(--v2-text-secondary); font-size: 10px; }.billing-reminder div { display: flex; flex-wrap: wrap; gap: 6px; }.billing-reminder button { min-height: 32px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-sm); color: var(--v2-text-primary); background: var(--v2-surface-3); }.billing-confirmed { color: var(--v2-success) !important; }
</style>
