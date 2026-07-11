<script setup lang="ts">
import { FileQuestion, Image, Sparkles, Video } from 'lucide-vue-next'
import { computed } from 'vue'
import type { Asset } from '../../../../types/asset'
import { getAssetShortTitle, getAssetTypeLabel } from './space-presentation'

const props = defineProps<{
  asset: Asset
  compact?: boolean
}>()

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

  return props.asset.url ? '媒体预览暂不可用。' : '这个资产没有可用媒体地址。'
})
</script>

<template>
  <div
    class="asset-preview"
    :class="[`is-${asset.type}`, { 'is-compact': compact }]"
    :role="asset.type === 'prompt' ? undefined : 'img'"
    :aria-label="asset.type === 'prompt' ? undefined : `${getAssetTypeLabel(asset.type)}资产预览：${getAssetShortTitle(asset)}`"
  >
    <span class="preview-icon" aria-hidden="true">
      <component :is="previewIcon" :size="compact ? 20 : 24" />
    </span>
    <p>{{ previewText }}</p>
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
  color: #f0eef6;
  background: #17171f;
  outline: 1px solid rgba(240, 238, 246, 0.08);
  outline-offset: -1px;
}

.asset-preview::before {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 78% 18%, rgba(99, 71, 194, 0.25), transparent 36%),
    linear-gradient(160deg, rgba(240, 238, 246, 0.025), transparent 58%);
  content: '';
}

.asset-preview.is-image::before {
  background:
    radial-gradient(circle at 72% 22%, rgba(76, 175, 125, 0.2), transparent 34%),
    linear-gradient(160deg, rgba(240, 238, 246, 0.03), transparent 58%);
}

.asset-preview.is-video::before {
  background:
    radial-gradient(circle at 72% 22%, rgba(212, 160, 60, 0.18), transparent 34%),
    linear-gradient(160deg, rgba(240, 238, 246, 0.03), transparent 58%);
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
  top: var(--space-3);
  right: var(--space-3);
  padding: 5px 9px;
  border-radius: var(--radius-pill);
  color: rgba(240, 238, 246, 0.72);
  background: rgba(240, 238, 246, 0.06);
  font-size: var(--font-size-hint);
}
</style>
