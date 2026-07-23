<script setup lang="ts">
import { Boxes, Check, Clapperboard, MapPin, PackageOpen, Plus, Trash2, UserRound, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useCanvasStore } from '../../store/canvas'
import type { CanvasNode } from '../../types/canvas'
import {
  resolveStoryboardAssetGroupPresentation,
  type StoryboardAssetGroupAsset,
  type StoryboardAssetKind,
} from '../../modules/canvas/storyboard-asset-group-presentation'
import {
  createAddStoryboardAssetCommand,
  createRemoveStoryboardAssetCommand,
  type StoryboardAssetEditIntent,
} from '../../modules/canvas/storyboard-asset-commands'

const props = withDefaults(defineProps<{ node: CanvasNode; readonly?: boolean }>(), { readonly: false })
const emit = defineEmits<{
  editAsset: [intent: StoryboardAssetEditIntent]
  locateNode: [nodeId: string]
}>()
const canvasStore = useCanvasStore()
const presentation = computed(() => resolveStoryboardAssetGroupPresentation(props.node, canvasStore.nodes))
const addKind = ref<StoryboardAssetKind | null>(null)
const addName = ref('')
const targetPromptNodeId = ref('')
const error = ref('')
const sections = computed(() => [
  { kind: 'role' as const, label: '角色', icon: UserRound, assets: presentation.value.roleAssets, empty: '当前分镜未声明角色资产。' },
  { kind: 'scene' as const, label: '场景', icon: MapPin, assets: presentation.value.sceneAssets, empty: '当前分镜未声明场景资产。' },
  { kind: 'prop' as const, label: '道具', icon: PackageOpen, assets: presentation.value.propAssets, empty: '当前分镜未声明道具资产。' },
])

watch(() => props.node.id, resetAdd, { flush: 'sync' })

function resetAdd() {
  addKind.value = null
  addName.value = ''
  targetPromptNodeId.value = ''
  error.value = ''
}

function beginAdd(kind: StoryboardAssetKind) {
  if (props.readonly || !presentation.value.shots.length) return
  addKind.value = kind
  addName.value = ''
  targetPromptNodeId.value = presentation.value.shots[0].promptNodeId
  error.value = ''
}

function editAsset(asset: StoryboardAssetGroupAsset) {
  const promptNodeId = asset.promptNodeIds[0]
  if (!promptNodeId) return
  emit('editAsset', { groupId: props.node.id, kind: asset.kind, name: asset.name, promptNodeId })
}

async function commitAdd() {
  if (!addKind.value) return
  const command = createAddStoryboardAssetCommand(
    canvasStore.nodes, props.node.id, targetPromptNodeId.value, addKind.value, addName.value,
  )
  if (!command) {
    error.value = '请选择有效镜头并填写未重复的资产名称。'
    return
  }
  try {
    await canvasStore.dispatchCommand({ source: 'toolbar', command })
    const intent = {
      groupId: props.node.id,
      kind: addKind.value,
      name: command.value,
      promptNodeId: command.promptNodeId,
    }
    resetAdd()
    emit('editAsset', intent)
  } catch {
    error.value = '资产未保存，画布状态已恢复，请重试。'
  }
}

async function removeAsset(asset: StoryboardAssetGroupAsset) {
  if (props.readonly) return
  const command = createRemoveStoryboardAssetCommand(canvasStore.nodes, props.node.id, asset.kind, asset.name)
  if (!command) return
  error.value = ''
  try {
    await canvasStore.dispatchCommand({ source: 'toolbar', command })
  } catch {
    error.value = '资产未移除，画布状态已恢复，请重试。'
  }
}
</script>

<template>
  <section v-if="presentation.isAssetGroup" class="asset-group-details" aria-label="分镜资产组详情">
    <header>
      <span><Boxes :size="16" aria-hidden="true" />分镜资产</span>
      <strong>{{ presentation.shots.length }} 个镜头</strong>
    </header>
    <div v-if="presentation.storyStructure || presentation.characterConsistency" class="asset-group-details__brief">
      <p v-if="presentation.storyStructure"><span>叙事结构</span>{{ presentation.storyStructure }}</p>
      <p v-if="presentation.characterConsistency"><span>一致性</span>{{ presentation.characterConsistency }}</p>
    </div>

    <div class="asset-group-details__collections">
      <section v-for="section in sections" :key="section.kind" :aria-label="`${section.label}资产`">
        <h3><component :is="section.icon" :size="14" aria-hidden="true" />{{ section.label }} <small>{{ section.assets.length }}</small></h3>
        <div class="asset-group-details__cards">
          <article v-for="asset in section.assets" :key="asset.name" class="asset-card">
            <button type="button" class="asset-card__select" :aria-label="`编辑${section.label} ${asset.name}`" @click="editAsset(asset)">
              <span class="asset-card__preview"><component :is="section.icon" :size="18" aria-hidden="true" /></span>
              <strong>{{ asset.name }}</strong>
              <small>{{ asset.shotIds.length }} 个镜头使用</small>
            </button>
            <button v-if="!readonly" type="button" class="asset-card__remove" :aria-label="`移除${section.label} ${asset.name}`" @click="removeAsset(asset)"><Trash2 :size="13" aria-hidden="true" /></button>
          </article>
          <button v-if="!readonly" type="button" class="asset-card is-add" :aria-label="`新增${section.label}`" @click="beginAdd(section.kind)">
            <Plus :size="18" aria-hidden="true" /><span>新增</span>
          </button>
        </div>
        <p v-if="!section.assets.length && readonly">{{ section.empty }}</p>
        <form v-if="addKind === section.kind" class="asset-group-details__add" @submit.prevent>
          <label><span>添加到镜头</span><select v-model="targetPromptNodeId" aria-label="添加到镜头"><option v-for="shot in presentation.shots" :key="shot.promptNodeId" :value="shot.promptNodeId">{{ shot.title }}</option></select></label>
          <label><span>{{ section.label }}名称</span><input v-model="addName" maxlength="80" :aria-label="`${section.label}名称`" /></label>
          <div><button type="button" aria-label="确认新增资产" @click="commitAdd"><Check :size="14" aria-hidden="true" />添加</button><button type="button" aria-label="取消新增资产" @click="resetAdd"><X :size="14" aria-hidden="true" />取消</button></div>
        </form>
      </section>
    </div>

    <p v-if="error" class="asset-group-details__error" role="alert">{{ error }}</p>
    <section class="asset-group-details__shots" aria-label="有序镜头资产">
      <h3><Clapperboard :size="14" aria-hidden="true" />镜头卡片 <small>{{ presentation.shots.length }}</small></h3>
      <ol>
        <li v-for="(shot, index) in presentation.shots" :key="shot.id">
          <button type="button" :aria-label="`定位镜头资产 ${shot.title}`" @click="emit('locateNode', shot.id)">
            <span>{{ String(index + 1).padStart(2, '0') }}</span><strong>{{ shot.title }}</strong><small>{{ shot.shotId }}</small>
          </button>
        </li>
      </ol>
    </section>
  </section>
</template>

<style scoped lang="scss">
.asset-group-details { display: grid; gap: 12px; padding: 12px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-md); background: var(--v2-surface-2); }
.asset-group-details > header, .asset-group-details > header span, h3 { display: flex; align-items: center; gap: 6px; }
.asset-group-details > header { justify-content: space-between; color: var(--v2-text-primary); }
.asset-group-details > header strong { color: var(--v2-accent-hover); font-size: 11px; }
.asset-group-details__brief { display: grid; gap: 5px; padding: 8px; border-radius: var(--v2-radius-sm); background: var(--v2-surface-1); }
.asset-group-details__brief p { display: grid; grid-template-columns: 64px minmax(0, 1fr); gap: 6px; margin: 0; color: var(--v2-text-secondary); font-size: 11px; line-height: 1.5; }
.asset-group-details__brief span { color: var(--v2-text-muted); }
.asset-group-details__collections { display: grid; gap: 12px; }
.asset-group-details__collections > section { display: grid; gap: 7px; }
h3 { margin: 0; color: var(--v2-text-secondary); font-size: 11px; font-weight: var(--v2-font-weight-medium); }
h3 small { margin-left: auto; color: var(--v2-text-muted); font-size: 10px; }
.asset-group-details__collections p { margin: 0; color: var(--v2-text-muted); font-size: 10px; line-height: 1.5; }
.asset-group-details__cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }
.asset-card { position: relative; min-width: 0; min-height: 108px; border: 1px dashed var(--v2-border-standard); border-radius: var(--v2-radius-sm); background: var(--v2-surface-1); }
.asset-card__select { display: grid; width: 100%; height: 100%; min-height: 106px; grid-template-rows: 56px auto auto; gap: 4px; padding: 7px; border: 0; color: var(--v2-text-secondary); background: transparent; text-align: left; cursor: pointer; }
.asset-card__preview { display: grid; place-items: center; border-radius: var(--v2-radius-xs); color: var(--v2-text-muted); background: var(--v2-surface-2); }
.asset-card strong, .asset-card small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.asset-card strong { color: var(--v2-text-primary); font-size: 10px; }
.asset-card small { color: var(--v2-text-muted); font-size: 9px; }
.asset-card__remove { position: absolute; top: 7px; right: 7px; display: grid; width: 24px; height: 24px; place-items: center; border: 1px solid var(--v2-border-subtle); border-radius: var(--v2-radius-xs); color: var(--v2-text-muted); background: var(--v2-surface-1); cursor: pointer; }
.asset-card.is-add { display: grid; min-height: 108px; place-items: center; align-content: center; gap: 5px; color: var(--v2-text-muted); font: inherit; font-size: 10px; cursor: pointer; }
.asset-card:hover, .asset-card:focus-visible, .asset-card:focus-within { border-color: var(--v2-accent-border); }
.asset-card button:focus-visible, .asset-group-details__add button:focus-visible, .asset-group-details__add input:focus-visible, .asset-group-details__add select:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
.asset-group-details__add { display: grid; gap: 7px; padding: 8px; border: 1px solid var(--v2-accent-border); border-radius: var(--v2-radius-sm); background: var(--v2-accent-soft); }
.asset-group-details__add label { display: grid; gap: 4px; color: var(--v2-text-muted); font-size: 9px; }
.asset-group-details__add input, .asset-group-details__add select { width: 100%; min-width: 0; height: 30px; padding: 0 8px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-xs); color: var(--v2-text-primary); background: var(--v2-surface-1); font: inherit; font-size: 10px; }
.asset-group-details__add > div { display: flex; gap: 6px; }
.asset-group-details__add button { display: inline-flex; min-height: 28px; align-items: center; gap: 4px; padding: 0 8px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-xs); color: var(--v2-text-secondary); background: var(--v2-surface-1); font: inherit; font-size: 10px; cursor: pointer; }
.asset-group-details__error { margin: 0; color: var(--v2-danger); font-size: 10px; }
.asset-group-details__shots { display: grid; gap: 6px; }
.asset-group-details__shots ol { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; }
.asset-group-details__shots button { display: grid; width: 100%; min-height: 36px; grid-template-columns: 28px minmax(0, 1fr) auto; align-items: center; gap: 6px; padding: 4px 7px; border: 1px solid var(--v2-border-subtle); border-radius: var(--v2-radius-sm); color: var(--v2-text-secondary); background: var(--v2-surface-1); font: inherit; text-align: left; cursor: pointer; }
.asset-group-details__shots button > span { display: grid; width: 24px; height: 24px; place-items: center; border-radius: var(--v2-radius-xs); color: var(--v2-accent-hover); background: var(--v2-accent-soft); font-size: 9px; }
.asset-group-details__shots strong { overflow: hidden; color: var(--v2-text-primary); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.asset-group-details__shots small { color: var(--v2-text-muted); font-size: 9px; }
.asset-group-details__shots button:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
</style>
