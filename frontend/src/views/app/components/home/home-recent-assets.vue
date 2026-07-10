<script setup lang="ts">
import { FileQuestion, Image, RefreshCcw, Sparkles, TriangleAlert, Video } from 'lucide-vue-next'
import { computed } from 'vue'
import type { Component } from 'vue'
import type { Asset } from '../../../../types/asset'

const props = defineProps<{
  assets: Asset[]
  hasLoaded: boolean
  isLoading: boolean
  error: string
}>()

const emit = defineEmits<{
  refresh: []
}>()

const recentAssets = computed(() => props.assets.slice(0, 3))
const dateFormatter = new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' })

const typeLabels: Record<string, string> = {
  prompt: 'Prompt',
  image: 'Image',
  video: 'Video',
}

const sourceLabels: Record<string, string> = {
  generation: 'Generation',
  upload: 'Upload',
}

const statusLabels: Record<string, string> = {
  active: 'Active',
  hidden: 'Hidden',
  deleted: 'Deleted',
}

function getAssetTitle(asset: Asset) {
  if (asset.content_text?.trim()) {
    return asset.content_text.trim()
  }

  if (asset.url) {
    try {
      const pathname = new URL(asset.url, window.location.origin).pathname
      const filename = pathname.split('/').filter(Boolean).pop()
      if (filename) {
        return decodeURIComponent(filename)
      }
    } catch {
      // The neutral fallback below avoids exposing malformed URLs or their query values.
    }
  }

  return '未命名资产'
}

function getAssetIcon(type: string): Component {
  if (type === 'prompt') return Sparkles
  if (type === 'image') return Image
  if (type === 'video') return Video
  return FileQuestion
}

function getLabel(labels: Record<string, string>, value: string) {
  return Object.prototype.hasOwnProperty.call(labels, value) ? labels[value] : '未知'
}

function formatAssetDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '时间未知' : dateFormatter.format(date)
}
</script>

<template>
  <section class="assets-panel" aria-label="最近资产" :aria-busy="isLoading">
    <div class="section-heading">
      <div>
        <p>Recent assets</p>
        <h2>最近资产</h2>
      </div>
      <button
        class="icon-action focus-ring"
        type="button"
        aria-label="刷新最近资产"
        :disabled="isLoading"
        @click="emit('refresh')"
      >
        <RefreshCcw :size="16" :class="{ 'is-spinning': isLoading }" />
      </button>
    </div>

    <div v-if="error" class="section-alert" role="alert">
      <TriangleAlert :size="16" />
      <span>
        {{ error }}
        <small v-if="recentAssets.length">已保留上次成功载入的最近资产。</small>
      </span>
      <button class="alert-action focus-ring" type="button" @click="emit('refresh')">重试</button>
    </div>

    <div v-if="isLoading && !hasLoaded && !recentAssets.length" class="asset-skeletons" aria-label="正在加载最近资产">
      <span v-for="index in 3" :key="index" class="asset-skeleton" />
    </div>

    <div v-else-if="recentAssets.length" class="asset-list">
      <article v-for="asset in recentAssets" :key="asset.id" class="asset-row">
        <span class="asset-icon" aria-hidden="true">
          <component :is="getAssetIcon(asset.type)" :size="18" />
        </span>
        <div class="asset-copy">
          <strong>{{ getAssetTitle(asset) }}</strong>
          <span>
            {{ getLabel(typeLabels, asset.type) }} · {{ getLabel(sourceLabels, asset.source) }} ·
            {{ getLabel(statusLabels, asset.status) }}
          </span>
        </div>
        <time :datetime="asset.created_at">{{ formatAssetDate(asset.created_at) }}</time>
      </article>
      <p class="recent-note">仅显示本次加载结果中最新的 {{ recentAssets.length }} 条资产。</p>
    </div>

    <div v-else-if="hasLoaded" class="empty-state">
      <FileQuestion :size="22" />
      <p>还没有最近资产，项目中的生成结果会显示在这里。</p>
    </div>
  </section>
</template>

<style scoped lang="scss">
.assets-panel {
  min-width: 0;
  padding: 20px;
  border-radius: 22px;
  background: var(--bg-panel);
  box-shadow: var(--shadow-soft);
}

.section-heading,
.icon-action,
.section-alert,
.asset-row {
  display: flex;
  align-items: center;
}

.section-heading {
  justify-content: space-between;
  gap: var(--space-3);
}

.section-heading p,
.section-heading h2,
.recent-note,
.empty-state p {
  margin: 0;
}

.section-heading p {
  color: var(--accent-generate-hover);
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-heading h2 {
  margin-top: 4px;
  font-size: 19px;
}

.icon-action,
.alert-action {
  min-height: 40px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  background: var(--bg-panel);
}

.icon-action {
  width: 40px;
  justify-content: center;
}

.icon-action:disabled {
  cursor: wait;
  opacity: 0.6;
}

.section-alert {
  align-items: flex-start;
  gap: var(--space-2);
  margin-top: var(--space-4);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  color: var(--danger);
  background: oklch(97% 0.018 27);
  font-size: var(--font-size-hint);
}

.section-alert span {
  min-width: 0;
  flex: 1;
}

.section-alert small {
  display: block;
  margin-top: var(--space-1);
  color: var(--text-secondary);
}

.alert-action {
  flex: 0 0 auto;
  padding: 0 10px;
  color: var(--danger);
}

.asset-skeletons,
.asset-list {
  display: grid;
  gap: 10px;
  margin-top: var(--space-4);
}

.asset-skeleton {
  height: 72px;
  border-radius: 16px;
  background: var(--bg-panel-subtle);
}

.asset-row {
  min-width: 0;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: 16px;
  background: oklch(98% 0.005 92);
}

.asset-icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 13px;
  color: var(--accent-select);
  background: oklch(94% 0.022 252);
}

.asset-copy {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 4px;
}

.asset-copy strong {
  display: -webkit-box;
  overflow: hidden;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 13px;
  line-height: 1.45;
}

.asset-copy span,
.asset-row time,
.recent-note,
.empty-state p {
  color: var(--text-muted);
  font-size: var(--font-size-hint);
}

.asset-copy span {
  overflow-wrap: anywhere;
}

.asset-row time {
  flex: 0 0 auto;
  font-variant-numeric: tabular-nums;
}

.recent-note {
  margin-top: var(--space-1);
}

.empty-state {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-4);
  padding: var(--space-4);
  border: 1px dashed var(--border-subtle);
  border-radius: 16px;
  color: var(--text-muted);
}

.is-spinning {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (hover: hover) {
  .icon-action:hover,
  .alert-action:hover {
    border-color: var(--border-strong);
    background: var(--bg-panel-subtle);
  }
}

@media (max-width: 420px) {
  .assets-panel {
    padding: var(--space-4);
  }

  .asset-row {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .asset-row time {
    width: 100%;
    padding-left: 50px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .is-spinning {
    animation: none;
  }
}
</style>
