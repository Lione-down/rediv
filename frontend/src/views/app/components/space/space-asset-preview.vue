<script setup lang="ts">
import { FileQuestion, Image, Sparkles, Video } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import type { Asset } from '../../../../types/asset'
import {
  getAssetShortTitle,
  getAssetTypeLabel,
  getRenderableAssetMediaUrl,
} from './space-presentation'

const props = defineProps<{
  asset: Asset
  compact?: boolean
}>()

const hasMediaLoadFailed = ref(false)
const mediaUrl = computed(() => getRenderableAssetMediaUrl(props.asset))
const canRenderMedia = computed(
  () => Boolean(mediaUrl.value) && !hasMediaLoadFailed.value,
)
const mediaLabel = computed(
  () => `${getAssetTypeLabel(props.asset.type)}资产预览：${getAssetShortTitle(props.asset)}`,
)

const previewIcon = computed(() => {
  if (props.asset.type === 'prompt') return Sparkles
  if (props.asset.type === 'image') return Image
  if (props.asset.type === 'video') return Video
  return FileQuestion
})

const previewText = computed(() => {
  if (props.asset.type === 'prompt') {
    return props.asset.content_text?.trim() || '这个 Prompt 暂无文本内容。'
  }

  if (props.asset.type === 'image') {
    return hasMediaLoadFailed.value
      ? '图片加载失败，资产记录仍可查看。'
      : '这个资产没有可安全加载的图片地址。'
  }

  if (props.asset.type === 'video') {
    return hasMediaLoadFailed.value
      ? '视频加载失败，资产记录仍可查看。'
      : '这个资产没有可安全加载的视频地址。'
  }

  return '暂不支持这个资产类型的预览。'
})
const fallbackLabel = computed(() => `${mediaLabel.value}。${previewText.value}`)

watch(
  () => [props.asset.id, props.asset.type, props.asset.url] as const,
  () => {
    hasMediaLoadFailed.value = false
  },
  { flush: 'sync' },
)
</script>

<template>
  <div
    class="asset-preview"
    :class="[`is-${asset.type}`, { 'is-compact': compact, 'has-media': canRenderMedia }]"
    :role="asset.type !== 'prompt' && !canRenderMedia ? 'img' : undefined"
    :aria-label="asset.type !== 'prompt' && !canRenderMedia ? fallbackLabel : undefined"
  >
    <img
      v-if="asset.type === 'image' && canRenderMedia"
      class="preview-media"
      :src="mediaUrl"
      :alt="compact ? '' : mediaLabel"
      :aria-hidden="compact ? 'true' : undefined"
      width="640"
      height="360"
      loading="lazy"
      decoding="async"
      referrerpolicy="no-referrer"
      @error="hasMediaLoadFailed = true"
    />
    <video
      v-else-if="asset.type === 'video' && canRenderMedia"
      class="preview-media"
      :src="mediaUrl"
      :controls="!compact"
      :muted="compact"
      :tabindex="compact ? -1 : undefined"
      :aria-hidden="compact ? 'true' : undefined"
      :aria-label="compact ? undefined : mediaLabel"
      preload="metadata"
      playsinline
      @error="hasMediaLoadFailed = true"
    />
    <template v-else>
      <span class="preview-icon" aria-hidden="true">
        <component :is="previewIcon" :size="compact ? 20 : 24" />
      </span>
      <p>{{ previewText }}</p>
    </template>
    <span class="preview-type">{{ getAssetTypeLabel(asset.type) }}</span>
  </div>
</template>

<style scoped lang="scss">
.asset-preview {
  position: relative;
  display: grid;
  min-height: 178px;
  align-content: end;
  gap: var(--space-3);
  overflow: hidden;
  padding: var(--space-4);
  border-radius: 16px;
  color: var(--v2-text-primary);
  background: var(--v2-surface-2);
  outline: 1px solid var(--v2-border-subtle);
  outline-offset: -1px;
}

.asset-preview::before {
  position: absolute;
  inset: 0;
  background: var(--v2-surface-2);
  content: '';
}

.preview-media {
  position: absolute;
  z-index: 1;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  outline: 1px solid var(--v2-border-standard);
  outline-offset: -1px;
}

video.preview-media {
  background: var(--v2-canvas);
}

.asset-preview.is-compact .preview-media {
  pointer-events: none;
}

.asset-preview.is-image::before {
  background: color-mix(in oklab, var(--v2-success) 10%, var(--v2-surface-2));
}

.asset-preview.is-video::before {
  background: color-mix(in oklab, var(--v2-warning) 10%, var(--v2-surface-2));
}

.asset-preview.is-compact {
  min-height: 148px;
}

.preview-icon,
.asset-preview p,
.preview-type {
  position: relative;
  z-index: 1;
}

.preview-icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 14px;
  color: rgba(240, 238, 246, 0.82);
  background: rgba(240, 238, 246, 0.07);
}

.asset-preview p {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: rgba(240, 238, 246, 0.68);
  font-size: 13px;
  line-height: 1.65;
  text-wrap: pretty;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.preview-type {
  position: absolute;
  z-index: 2;
  top: var(--space-3);
  right: var(--space-3);
  padding: 5px 9px;
  border-radius: var(--radius-pill);
  color: rgba(240, 238, 246, 0.72);
  background: rgba(240, 238, 246, 0.06);
  font-size: var(--font-size-hint);
}
</style>
