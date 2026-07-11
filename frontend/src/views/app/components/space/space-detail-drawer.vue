<script setup lang="ts">
import { NDrawer, NDrawerContent, NEmpty } from 'naive-ui'
import { ArrowRight, Boxes, FolderOpen, LayoutTemplate, RefreshCcw, TriangleAlert } from 'lucide-vue-next'
import { computed } from 'vue'
import type { Template } from '../../../../modules/template/types'
import type { Asset } from '../../../../types/asset'
import SpaceAssetPreview from './space-asset-preview.vue'
import SpaceDeleteZone from './space-delete-zone.vue'
import {
  formatSpaceDate,
  getAssetSourceLabel,
  getAssetShortTitle,
  getAssetTypeLabel,
  shortenSpaceText,
} from './space-presentation'
import type { SpaceDetailKind } from './space-presentation'
import type { SpaceDeleteState } from './use-space-deletion'

const props = defineProps<{
  show: boolean
  kind: SpaceDetailKind
  asset: Asset | null
  template: Template | null
  isLoading: boolean
  error: string
  usingTemplateId: string
  hasPendingProject: boolean
  useError: string
  deleteState: SpaceDeleteState
  deleteError: string
}>()

const emit = defineEmits<{
  close: []
  retry: []
  openProject: [projectId: string]
  useTemplate: [templateId: string]
  delete: [kind: Exclude<SpaceDetailKind, null>, id: string]
}>()

const drawerTitle = computed(() => {
  if (props.kind === 'asset') {
    return props.asset ? getAssetShortTitle(props.asset) : '资产详情'
  }

  return props.template?.name
    ? shortenSpaceText(props.template.name)
    : '模板详情'
})

const assetProjectId = computed(() => props.asset?.project_id?.trim() || '')
const templateId = computed(() => props.template?.id || '')
const deleteTargetId = computed(() =>
  props.kind === 'asset' ? props.asset?.id || '' : props.template?.id || '',
)
const deleteItemName = computed(() =>
  props.kind === 'asset' && props.asset
    ? getAssetShortTitle(props.asset, 48)
    : shortenSpaceText(props.template?.name || '当前模板', 48),
)

function handleShowChange(show: boolean) {
  if (!show) {
    emit('close')
  }
}
</script>

<template>
  <NDrawer
    :show="show"
    :aria-label="drawerTitle"
    placement="right"
    width="min(480px, 100vw)"
    @update:show="handleShowChange"
  >
    <NDrawerContent :title="drawerTitle" closable :native-scrollbar="false">
      <div class="detail-body" :aria-busy="isLoading">
        <div v-if="error" class="detail-alert" role="alert">
          <TriangleAlert :size="17" />
          <span>{{ error }}</span>
          <button class="secondary-action focus-ring" type="button" @click="emit('retry')">
            <RefreshCcw :size="15" />
            重试
          </button>
        </div>

        <div v-if="isLoading && !asset && !template" class="detail-skeletons" aria-label="正在加载详情">
          <span class="skeleton-preview" />
          <span v-for="index in 4" :key="index" class="skeleton-line" />
        </div>

        <template v-else-if="kind === 'asset' && asset">
          <SpaceAssetPreview :asset="asset" />

          <dl class="detail-list">
            <div>
              <dt>类型</dt>
              <dd>{{ getAssetTypeLabel(asset.type) }}</dd>
            </div>
            <div>
              <dt>来源</dt>
              <dd>{{ getAssetSourceLabel(asset.source) }}</dd>
            </div>
            <div>
              <dt>状态</dt>
              <dd>{{ asset.status }}</dd>
            </div>
            <div>
              <dt>创建时间</dt>
              <dd>{{ formatSpaceDate(asset.created_at, true) }}</dd>
            </div>
            <div v-if="asset.source_model">
              <dt>来源模型</dt>
              <dd>{{ asset.source_model }}</dd>
            </div>
            <div>
              <dt>所属项目</dt>
              <dd>{{ assetProjectId || '未关联项目' }}</dd>
            </div>
          </dl>

          <button
            v-if="assetProjectId"
            class="primary-action focus-ring"
            type="button"
            @click="emit('openProject', assetProjectId)"
          >
            <FolderOpen :size="16" />
            进入所属项目
            <ArrowRight :size="15" />
          </button>
          <p v-else class="detail-note">这个资产没有可用的项目引用，详情仍可查看。</p>
        </template>

        <template v-else-if="kind === 'template' && template">
          <div class="template-summary">
            <span class="template-mark" aria-hidden="true">
              <LayoutTemplate :size="25" />
            </span>
            <div>
              <strong>{{ template.name }}</strong>
              <span>{{ formatSpaceDate(template.created_at, true) }}</span>
            </div>
          </div>

          <dl class="detail-list">
            <div>
              <dt>节点数</dt>
              <dd>{{ template.node_count }}</dd>
            </div>
            <div>
              <dt>快照数据</dt>
              <dd>{{ template.node_data ? `${template.node_data.length} 条节点记录` : '暂无节点快照' }}</dd>
            </div>
            <div>
              <dt>模板 ID</dt>
              <dd>{{ template.id }}</dd>
            </div>
          </dl>

          <div v-if="useError" class="detail-alert is-warning" role="alert">
            <TriangleAlert :size="17" />
            <span>{{ useError }}</span>
          </div>

          <button
            class="primary-action focus-ring"
            type="button"
            :disabled="Boolean(usingTemplateId) || hasPendingProject"
            @click="emit('useTemplate', templateId)"
          >
            <Boxes :size="16" />
            {{ hasPendingProject ? '已有项目待打开' : usingTemplateId === templateId ? '正在创建项目' : '使用模板创建项目' }}
            <ArrowRight :size="15" />
          </button>
        </template>

        <NEmpty v-else description="没有可显示的详情。" />

        <SpaceDeleteZone
          v-if="kind && deleteTargetId"
          :kind="kind"
          :target-id="deleteTargetId"
          :item-name="deleteItemName"
          :is-deleting="deleteState === 'deleting'"
          :error="deleteError"
          @confirm="emit('delete', $event, deleteTargetId)"
        />
      </div>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped lang="scss">
.detail-body {
  display: grid;
  min-width: 0;
  gap: var(--space-4);
  padding-bottom: max(var(--space-4), env(safe-area-inset-bottom));
}

:deep(.n-drawer-header__close) {
  --n-close-color-hover: rgba(240, 238, 246, 0.1) !important;
  --n-close-color-pressed: rgba(240, 238, 246, 0.16) !important;
  --n-close-icon-color-hover: #f0eef6 !important;
}

:deep(.n-drawer-header__main) {
  min-width: 0;
  overflow-wrap: anywhere;
}

.detail-alert,
.secondary-action,
.primary-action,
.template-summary {
  display: flex;
  align-items: center;
}

.detail-alert {
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid rgba(217, 83, 92, 0.25);
  border-radius: var(--radius-lg);
  color: #e06a71;
  background: rgba(217, 83, 92, 0.08);
  font-size: var(--font-size-hint);
}

.detail-alert.is-warning {
  border-color: rgba(212, 160, 60, 0.25);
  color: #d4a03c;
  background: rgba(212, 160, 60, 0.08);
}

.detail-alert span {
  min-width: 0;
  flex: 1;
  line-height: 1.6;
}

.secondary-action,
.primary-action {
  min-height: 42px;
  justify-content: center;
  gap: var(--space-2);
  padding: 0 var(--space-4);
  border: 1px solid rgba(240, 238, 246, 0.1);
  border-radius: var(--radius-lg);
  color: #f0eef6;
  background: rgba(240, 238, 246, 0.05);
  transition:
    background-color 120ms ease,
    border-color 120ms ease,
    transform 120ms ease;
}

.detail-alert .secondary-action {
  min-height: 36px;
  flex: 0 0 auto;
  padding-inline: 10px;
  color: inherit;
}

.primary-action {
  justify-self: start;
  border-color: transparent;
  background: #6347c2;
}

.primary-action:active,
.secondary-action:active {
  transform: scale(0.96);
}

.primary-action:disabled {
  cursor: wait;
  opacity: 0.58;
}

.detail-list {
  display: grid;
  margin: 0;
  border-top: 1px solid rgba(240, 238, 246, 0.08);
}

.detail-list > div {
  display: grid;
  grid-template-columns: minmax(90px, 0.38fr) minmax(0, 1fr);
  gap: var(--space-4);
  padding: var(--space-3) 0;
  border-bottom: 1px solid rgba(240, 238, 246, 0.08);
}

.detail-list dt,
.detail-list dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.detail-list dt {
  color: rgba(240, 238, 246, 0.56);
  font-size: var(--font-size-hint);
}

.detail-list dd {
  color: rgba(240, 238, 246, 0.78);
  font-size: 13px;
  line-height: 1.55;
}

.detail-note {
  margin: 0;
  color: rgba(240, 238, 246, 0.56);
  font-size: var(--font-size-hint);
  line-height: 1.65;
}

.template-summary {
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: 18px;
  background: rgba(240, 238, 246, 0.035);
}

.template-mark {
  display: grid;
  width: 52px;
  height: 52px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 16px;
  color: #9b87e8;
  background: rgba(99, 71, 194, 0.16);
}

.template-summary > div {
  display: grid;
  min-width: 0;
  gap: 5px;
}

.template-summary strong {
  overflow-wrap: anywhere;
  color: #f0eef6;
  font-size: 16px;
}

.template-summary span {
  color: rgba(240, 238, 246, 0.56);
  font-size: var(--font-size-hint);
}

.detail-skeletons {
  display: grid;
  gap: var(--space-3);
}

.detail-skeletons span {
  border-radius: 12px;
  background: rgba(240, 238, 246, 0.05);
}

.skeleton-preview {
  height: 178px;
}

.skeleton-line {
  height: 42px;
}

@media (hover: hover) {
  .secondary-action:hover {
    border-color: rgba(240, 238, 246, 0.2);
    background: rgba(240, 238, 246, 0.09);
  }

  .primary-action:hover:not(:disabled) {
    background: #7b61d6;
  }
}

@media (max-width: 420px) {
  .detail-list > div {
    grid-template-columns: 1fr;
    gap: 5px;
  }

  .primary-action {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .secondary-action,
  .primary-action {
    transition: none;
  }

  .secondary-action:active,
  .primary-action:active {
    transform: none;
  }
}
</style>
