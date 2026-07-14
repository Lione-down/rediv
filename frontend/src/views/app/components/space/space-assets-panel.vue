<script setup lang="ts">
import { NEmpty } from 'naive-ui'
import { ChevronLeft, ChevronRight, RefreshCcw, TriangleAlert } from 'lucide-vue-next'
import { computed } from 'vue'
import type { Asset } from '../../../../types/asset'
import SpaceAssetPreview from './space-asset-preview.vue'
import {
  SPACE_ASSET_FILTERS,
  formatSpaceDate,
  getAssetSourceLabel,
  getAssetShortTitle,
  getAssetTitle,
  getAssetTypeLabel,
} from './space-presentation'
import type { SpaceAssetFilter } from './space-presentation'

const props = defineProps<{
  assets: Asset[]
  total: number
  page: number
  pageSize: number
  activeType: SpaceAssetFilter
  hasLoaded: boolean
  isLoading: boolean
  error: string
}>()

const emit = defineEmits<{
  filter: [value: SpaceAssetFilter]
  page: [value: number]
  refresh: []
  select: [asset: Asset]
}>()

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const isBoundaryPage = computed(
  () => props.hasLoaded && props.total > 0 && props.assets.length === 0,
)
</script>

<template>
  <section class="assets-panel" aria-labelledby="assets-heading" :aria-busy="isLoading">
    <div class="section-heading">
      <div>
        <p>Assets</p>
        <h2 id="assets-heading">个人资产</h2>
        <span>
          {{ hasLoaded ? `共 ${total} 项，当前第 ${page} 页` : '等待资产列表同步' }}
        </span>
      </div>
      <button
        class="icon-action focus-ring"
        type="button"
        :disabled="isLoading"
        aria-label="刷新当前资产列表"
        @click="emit('refresh')"
      >
        <RefreshCcw :size="17" :class="{ 'is-spinning': isLoading }" />
      </button>
    </div>

    <div class="filter-row" role="group" aria-label="按资产类型筛选">
      <button
        v-for="filter in SPACE_ASSET_FILTERS"
        :key="filter.value"
        class="filter-chip focus-ring"
        :class="{ 'is-active': activeType === filter.value }"
        type="button"
        :aria-pressed="activeType === filter.value"
        @click="emit('filter', filter.value)"
      >
        {{ filter.label }}
      </button>
    </div>

    <div v-if="error" class="section-alert" role="alert">
      <TriangleAlert :size="17" />
      <span>
        {{ error }}
        <small v-if="assets.length">已保留当前可见资产。</small>
      </span>
      <button class="alert-action focus-ring" type="button" @click="emit('refresh')">重试</button>
    </div>

    <div v-if="isLoading && !hasLoaded && !assets.length" class="asset-grid" aria-label="正在加载资产">
      <span v-for="index in 6" :key="index" class="asset-skeleton" />
    </div>

    <div v-else-if="assets.length" class="asset-grid">
      <button
        v-for="asset in assets"
        :key="asset.id"
        class="asset-card focus-ring"
        type="button"
        :aria-label="`查看资产详情：${getAssetShortTitle(asset)}`"
        @click="emit('select', asset)"
      >
        <SpaceAssetPreview :asset="asset" compact />
        <span class="asset-copy">
          <strong>{{ getAssetTitle(asset) }}</strong>
          <span>
            {{ getAssetTypeLabel(asset.type) }} · {{ getAssetSourceLabel(asset.source) }}
          </span>
          <time :datetime="asset.created_at">{{ formatSpaceDate(asset.created_at) }}</time>
        </span>
      </button>
    </div>

    <div v-else-if="hasLoaded" class="empty-state">
      <NEmpty
        :description="isBoundaryPage ? '当前页没有可显示的资产，请刷新或切换筛选。' : '当前筛选下还没有资产。'"
      />
    </div>

    <footer v-if="hasLoaded && (total > pageSize || page > 1)" class="pagination-row">
      <span>每页 {{ pageSize }} 项</span>
      <nav class="pager" aria-label="资产分页">
        <button
          class="pager-action focus-ring"
          type="button"
          :disabled="isLoading || page <= 1"
          aria-label="上一页"
          @click="emit('page', page - 1)"
        >
          <ChevronLeft :size="16" />
        </button>
        <span class="pager-status" aria-live="polite">第 {{ page }} / {{ pageCount }} 页</span>
        <button
          class="pager-action focus-ring"
          type="button"
          :disabled="isLoading || page >= pageCount"
          aria-label="下一页"
          @click="emit('page', page + 1)"
        >
          <ChevronRight :size="16" />
        </button>
      </nav>
    </footer>
  </section>
</template>

<style scoped lang="scss">
.assets-panel {
  min-width: 0;
}

.section-heading,
.filter-row,
.section-alert,
.pagination-row,
.icon-action {
  display: flex;
  align-items: center;
}

.section-heading {
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.section-heading p,
.section-heading h2,
.section-heading span,
.asset-copy strong,
.asset-copy span,
.pagination-row > span {
  margin: 0;
}

.section-heading p {
  color: #8f7ae1;
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-heading h2 {
  margin-top: 4px;
  color: #f0eef6;
  font-size: 22px;
}

.section-heading span {
  display: block;
  margin-top: 5px;
  color: rgba(240, 238, 246, 0.56);
  font-size: var(--font-size-hint);
}

.icon-action,
.alert-action,
.filter-chip {
  min-height: 40px;
  border: 1px solid rgba(240, 238, 246, 0.1);
  color: rgba(240, 238, 246, 0.72);
  background: rgba(240, 238, 246, 0.04);
}

.icon-action {
  width: 40px;
  flex: 0 0 auto;
  justify-content: center;
  border-radius: var(--radius-lg);
}

.icon-action:disabled {
  cursor: wait;
  opacity: 0.6;
}

.filter-row {
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.filter-chip {
  min-height: 38px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-pill);
  transition:
    background-color 120ms ease,
    border-color 120ms ease,
    color 120ms ease,
    transform 120ms ease;
}

.filter-chip.is-active {
  border-color: rgba(123, 97, 214, 0.58);
  color: #f0eef6;
  background: rgba(99, 71, 194, 0.22);
}

.filter-chip:active,
.asset-card:active {
  transform: scale(0.96);
}

.section-alert {
  align-items: flex-start;
  gap: var(--space-3);
  margin-top: var(--space-4);
  padding: var(--space-3);
  border: 1px solid rgba(217, 83, 92, 0.25);
  border-radius: var(--radius-lg);
  color: #e06a71;
  background: rgba(217, 83, 92, 0.08);
  font-size: var(--font-size-hint);
}

.section-alert span {
  min-width: 0;
  flex: 1;
  line-height: 1.6;
}

.section-alert small {
  display: block;
  color: rgba(240, 238, 246, 0.56);
}

.alert-action {
  flex: 0 0 auto;
  padding: 0 11px;
  border-radius: var(--radius-lg);
  color: #e06a71;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
  margin-top: var(--space-6);
}

.asset-card {
  display: grid;
  min-width: 0;
  gap: var(--space-3);
  padding: var(--space-2);
  border: 1px solid rgba(240, 238, 246, 0.06);
  border-radius: 20px;
  color: inherit;
  background: rgba(240, 238, 246, 0.025);
  text-align: left;
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    transform 150ms ease;
}

.asset-copy {
  display: grid;
  min-width: 0;
  gap: 5px;
  padding: 0 var(--space-2) var(--space-2);
}

.asset-copy strong {
  display: -webkit-box;
  overflow: hidden;
  overflow-wrap: anywhere;
  color: #f0eef6;
  font-size: 14px;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.asset-copy span,
.asset-copy time,
.pagination-row > span {
  color: rgba(240, 238, 246, 0.56);
  font-size: var(--font-size-hint);
}

.asset-copy time {
  font-variant-numeric: tabular-nums;
}

.asset-skeleton {
  min-height: 232px;
  border-radius: 20px;
  background: var(--v2-surface-2);
}

.empty-state {
  display: grid;
  min-height: 260px;
  margin-top: var(--space-6);
  place-items: center;
  border: 1px dashed rgba(240, 238, 246, 0.1);
  border-radius: 20px;
  background: rgba(240, 238, 246, 0.018);
}

.pagination-row {
  justify-content: space-between;
  gap: var(--space-4);
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid rgba(240, 238, 246, 0.07);
}

.pager,
.pager-action {
  display: flex;
  align-items: center;
}

.pager {
  gap: var(--space-2);
}

.pager-action {
  width: 40px;
  min-height: 40px;
  justify-content: center;
  border: 1px solid rgba(240, 238, 246, 0.1);
  border-radius: var(--radius-lg);
  color: rgba(240, 238, 246, 0.72);
  background: rgba(240, 238, 246, 0.04);
}

.pager-action:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.pager-status {
  min-width: 76px;
  color: rgba(240, 238, 246, 0.62);
  font-size: var(--font-size-hint);
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.is-spinning {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes skeleton {
  to { background-position: -200% 0; }
}

@media (hover: hover) {
  .icon-action:hover:not(:disabled),
  .alert-action:hover,
  .filter-chip:hover,
  .pager-action:hover:not(:disabled) {
    border-color: rgba(240, 238, 246, 0.2);
    background: rgba(240, 238, 246, 0.08);
  }

  .asset-card:hover {
    border-color: rgba(123, 97, 214, 0.35);
    background: rgba(240, 238, 246, 0.045);
    transform: translateY(-2px);
  }
}

@media (max-width: 920px) {
  .asset-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .asset-grid {
    grid-template-columns: 1fr;
  }

  .pagination-row {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 420px) {
  .filter-row {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: var(--space-1);
    scrollbar-width: none;
  }

  .filter-chip {
    flex: 0 0 auto;
  }

}

@media (prefers-reduced-motion: reduce) {
  .filter-chip,
  .asset-card {
    transition: none;
  }

  .filter-chip:active,
  .asset-card:active {
    transform: none;
  }

  .asset-skeleton,
  .is-spinning {
    animation: none;
  }
}
</style>
