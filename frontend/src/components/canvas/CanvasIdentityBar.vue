<script setup lang="ts">
import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  Copy,
  Pencil,
  Plus,
} from 'lucide-vue-next'
import { NModal, NPopover } from 'naive-ui'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { CanvasMetadataDto } from '../../modules/canvas/types'

type FormMode = 'create' | 'rename' | 'duplicate'
type MoveDirection = -1 | 1

interface Props {
  projectName: string
  activeCanvas: CanvasMetadataDto | null
  canvases: CanvasMetadataDto[]
  canEdit: boolean
  isLoading: boolean
  isMutating: boolean
  mutationError: string
  onSwitch: (canvasId: string) => Promise<void>
  onCreate: (name: string) => Promise<void>
  onRename: (canvasId: string, name: string) => Promise<void>
  onMove: (canvasId: string, direction: MoveDirection) => Promise<void>
  onDuplicate: (canvasId: string, name: string) => Promise<void>
  onArchive: (canvasId: string) => Promise<void>
  onRetry: () => Promise<void>
}

const props = defineProps<Props>()

const isListOpen = ref(false)
const formMode = ref<FormMode | null>(null)
const formName = ref('')
const formError = ref('')
const isArchiveOpen = ref(false)

const activeIndex = computed(() => (
  props.activeCanvas
    ? props.canvases.findIndex((canvas) => canvas.id === props.activeCanvas?.id)
    : -1
))
const canMoveEarlier = computed(() => activeIndex.value > 0)
const canMoveLater = computed(() => activeIndex.value >= 0 && activeIndex.value < props.canvases.length - 1)
const canArchive = computed(() => props.canvases.length > 1)
const formTitle = computed(() => {
  if (formMode.value === 'create') return '新建画布'
  if (formMode.value === 'rename') return '重命名画布'
  return '复制画布'
})
const formAction = computed(() => {
  if (formMode.value === 'create') return '创建并打开'
  if (formMode.value === 'rename') return '保存名称'
  return '复制并打开'
})

function openForm(mode: FormMode) {
  const activeName = props.activeCanvas?.name ?? '画布'
  formMode.value = mode
  formName.value = mode === 'create'
    ? `画布 ${props.canvases.length + 1}`
    : mode === 'duplicate'
      ? `${activeName} 副本`
      : activeName
  formError.value = ''
  isListOpen.value = false
}

function closeForm() {
  if (props.isMutating) return
  formMode.value = null
  formName.value = ''
  formError.value = ''
}

async function submitForm() {
  const name = formName.value.trim()
  const activeCanvas = props.activeCanvas
  if (!name) {
    formError.value = '请输入画布名称。'
    return
  }

  formError.value = ''
  try {
    if (formMode.value === 'create') await props.onCreate(name)
    if (formMode.value === 'rename' && activeCanvas) await props.onRename(activeCanvas.id, name)
    if (formMode.value === 'duplicate' && activeCanvas) await props.onDuplicate(activeCanvas.id, name)
    closeForm()
  } catch {
    formError.value = props.mutationError || '画布操作未完成，请重试。'
  }
}

async function switchCanvas(canvasId: string) {
  isListOpen.value = false
  await props.onSwitch(canvasId)
}

async function moveActive(direction: MoveDirection) {
  if (!props.activeCanvas) return
  try {
    await props.onMove(props.activeCanvas.id, direction)
  } catch {
    // The store-owned message remains visible in the navigation surface.
  }
}

async function confirmArchive() {
  if (!props.activeCanvas || !canArchive.value) return
  try {
    await props.onArchive(props.activeCanvas.id)
    isArchiveOpen.value = false
  } catch {
    // The store-owned message remains visible in the confirmation surface.
  }
}
</script>

<template>
  <section class="identity-cluster" aria-label="项目与画布导航">
    <RouterLink class="icon-button" to="/" aria-label="返回项目首页" title="返回项目首页">
      <ArrowLeft :size="18" aria-hidden="true" />
    </RouterLink>

    <div class="identity-copy">
      <span class="project-name" :title="projectName"><b>Revid</b> / {{ projectName }}</span>
      <NPopover v-model:show="isListOpen" trigger="click" placement="bottom-start" to=".v2-canvas-theme" raw>
        <template #trigger>
          <button
            type="button"
            class="canvas-switcher"
            :aria-expanded="isListOpen"
            aria-haspopup="dialog"
            :disabled="isLoading || !activeCanvas"
          >
            <strong>{{ activeCanvas?.name || '正在加载画布' }}</strong>
            <ChevronDown :size="16" aria-hidden="true" />
          </button>
        </template>

        <div class="canvas-popover" role="dialog" aria-label="画布列表">
          <div class="popover-heading">
            <div>
              <strong>项目画布</strong>
              <span>{{ canvases.length }} 个 active Canvas</span>
            </div>
            <button
              v-if="canEdit"
              type="button"
              class="compact-action is-primary"
              :disabled="isMutating"
              aria-label="新建画布"
              @click="openForm('create')"
            >
              <Plus :size="16" aria-hidden="true" />
              新建
            </button>
          </div>

          <div class="canvas-list" role="listbox" aria-label="选择画布">
            <button
              v-for="canvas in canvases"
              :key="canvas.id"
              type="button"
              class="canvas-row"
              :class="{ 'is-active': canvas.id === activeCanvas?.id }"
              role="option"
              :aria-selected="canvas.id === activeCanvas?.id"
              @click="switchCanvas(canvas.id)"
            >
              <span class="canvas-order">{{ String(canvas.sort_order + 1).padStart(2, '0') }}</span>
              <span class="canvas-row-copy">
                <strong>{{ canvas.name }}</strong>
                <small>修订 {{ canvas.graph_revision }}</small>
              </span>
              <span v-if="canvas.id === activeCanvas?.id" class="active-marker">当前</span>
            </button>
          </div>

          <div v-if="canEdit && activeCanvas" class="active-actions" aria-label="当前画布操作">
            <button type="button" :disabled="!canMoveEarlier || isMutating" aria-label="向前移动当前画布" @click="moveActive(-1)">
              <ArrowUp :size="16" aria-hidden="true" />
              前移
            </button>
            <button type="button" :disabled="!canMoveLater || isMutating" aria-label="向后移动当前画布" @click="moveActive(1)">
              <ArrowDown :size="16" aria-hidden="true" />
              后移
            </button>
            <button type="button" :disabled="isMutating" aria-label="重命名当前画布" @click="openForm('rename')">
              <Pencil :size="16" aria-hidden="true" />
              重命名
            </button>
            <button type="button" :disabled="isMutating" aria-label="复制当前画布" @click="openForm('duplicate')">
              <Copy :size="16" aria-hidden="true" />
              复制
            </button>
            <button
              type="button"
              class="is-danger"
              :disabled="!canArchive || isMutating"
              :title="canArchive ? '归档当前画布' : '项目必须保留至少一个 active Canvas'"
              aria-label="归档当前画布"
              @click="isArchiveOpen = true; isListOpen = false"
            >
              <Archive :size="16" aria-hidden="true" />
              归档
            </button>
          </div>

          <div v-if="mutationError" class="navigation-error" role="alert">
            <span>{{ mutationError }}</span>
            <button type="button" :disabled="isLoading || isMutating" @click="onRetry">重新加载</button>
          </div>
          <p v-else-if="!canEdit" class="review-note">移动端为浏览审阅模式，画布管理操作已关闭。</p>
        </div>
      </NPopover>
    </div>
  </section>

  <NModal :show="formMode !== null" to=".v2-canvas-theme" :mask-closable="!isMutating" @update:show="(show) => { if (!show) closeForm() }">
    <section class="canvas-modal" role="dialog" aria-modal="true" :aria-label="formTitle">
      <p class="modal-eyebrow">Canvas navigation</p>
      <h2>{{ formTitle }}</h2>
      <label for="canvas-name-input">画布名称</label>
      <input
        id="canvas-name-input"
        v-model="formName"
        type="text"
        maxlength="255"
        :disabled="isMutating"
        placeholder="例如：分镜设计"
        @keydown.enter.prevent="submitForm"
      >
      <p v-if="formError" class="modal-error" role="alert">{{ formError }}</p>
      <div class="modal-actions">
        <button type="button" class="secondary-button" :disabled="isMutating" @click="closeForm">取消</button>
        <button type="button" class="primary-button" :disabled="isMutating" @click="submitForm">
          {{ isMutating ? '正在保存' : formAction }}
        </button>
      </div>
    </section>
  </NModal>

  <NModal v-model:show="isArchiveOpen" to=".v2-canvas-theme" :mask-closable="!isMutating">
    <section class="canvas-modal" role="alertdialog" aria-modal="true" aria-label="归档画布">
      <p class="modal-eyebrow is-danger">Archive Canvas</p>
      <h2>归档“{{ activeCanvas?.name }}”</h2>
      <p class="modal-description">归档后该画布会从 active 列表移除。项目内容不会在此操作中硬删除。</p>
      <p v-if="mutationError" class="modal-error" role="alert">{{ mutationError }}</p>
      <div class="modal-actions">
        <button type="button" class="secondary-button" :disabled="isMutating" @click="isArchiveOpen = false">取消</button>
        <button type="button" class="danger-button" :disabled="isMutating || !canArchive" @click="confirmArchive">
          {{ isMutating ? '正在归档' : '确认归档' }}
        </button>
      </div>
    </section>
  </NModal>
</template>

<style scoped lang="scss" src="./canvas-identity-bar.scss"></style>
