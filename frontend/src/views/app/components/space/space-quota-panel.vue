<script setup lang="ts">
import { Ban, Image, RefreshCcw, Sparkles, TriangleAlert, Video } from 'lucide-vue-next'
import { computed } from 'vue'
import type { Component } from 'vue'
import type { QuotaBalance, User } from '../../../../types/auth'

const props = defineProps<{
  quotas: QuotaBalance
  generationStatus: User['generation_status']
  hasLoaded: boolean
  isLoading: boolean
  error: string
}>()

const emit = defineEmits<{
  refresh: []
}>()

interface QuotaItem {
  key: keyof QuotaBalance
  label: string
  description: string
  icon: Component
}

const quotaItems: QuotaItem[] = [
  { key: 'text', label: 'Text', description: '脚本、分镜与 Prompt', icon: Sparkles },
  { key: 'image', label: 'Image', description: '参考图与首帧图', icon: Image },
  { key: 'video', label: 'Video', description: '视频片段与扩写', icon: Video },
]

const availableQuotaTypes = computed(
  () => quotaItems.filter((item) => props.quotas[item.key] > 0).length,
)
const isAllEmpty = computed(() => availableQuotaTypes.value === 0)
</script>

<template>
  <section class="quota-panel" aria-labelledby="quota-heading" :aria-busy="isLoading">
    <div class="section-heading">
      <div>
        <p>Quota</p>
        <h2 id="quota-heading">剩余额度</h2>
        <span>{{ hasLoaded ? `三类额度已同步，${availableQuotaTypes} 类可用` : '等待账户额度同步' }}</span>
      </div>
      <button
        class="icon-action focus-ring"
        type="button"
        :disabled="isLoading"
        aria-label="刷新账户额度"
        @click="emit('refresh')"
      >
        <RefreshCcw :size="17" :class="{ 'is-spinning': isLoading }" />
      </button>
    </div>

    <div v-if="error" class="section-alert" role="alert">
      <TriangleAlert :size="17" />
      <span>
        {{ error }}
        <small v-if="hasLoaded">已保留上次成功同步的额度。</small>
      </span>
      <button class="alert-action focus-ring" type="button" @click="emit('refresh')">重试</button>
    </div>

    <div v-if="isLoading && !hasLoaded" class="quota-skeletons" aria-label="正在加载账户额度">
      <span v-for="index in 3" :key="index" />
    </div>

    <div v-else class="quota-list">
      <article
        v-for="quota in quotaItems"
        :key="quota.key"
        class="quota-row"
        :class="{ 'is-empty': quotas[quota.key] <= 0 }"
      >
        <span class="quota-icon" aria-hidden="true">
          <component :is="quota.icon" :size="19" />
        </span>
        <span class="quota-copy">
          <strong>{{ quota.label }}</strong>
          <small>{{ quota.description }}</small>
        </span>
        <span class="quota-value">
          <strong>{{ quotas[quota.key] }}</strong>
          <small>{{ quotas[quota.key] > 0 ? '可用' : '已用尽' }}</small>
        </span>
      </article>
    </div>

    <p v-if="generationStatus === 'frozen'" class="quota-notice is-danger" role="status">
      <Ban :size="16" />
      当前账户已暂停生成，现有资产和模板仍可查看。
    </p>
    <p v-else-if="hasLoaded && isAllEmpty" class="quota-notice" role="status">
      三类额度均为零，当前无法提交新的生成任务。
    </p>
  </section>
</template>

<style scoped lang="scss">
.quota-panel {
  min-width: 0;
}

.section-heading,
.section-alert,
.icon-action,
.quota-row,
.quota-notice {
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
.quota-copy strong,
.quota-copy small,
.quota-value strong,
.quota-value small,
.quota-notice {
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

.section-heading > div > span {
  display: block;
  margin-top: 5px;
  color: rgba(240, 238, 246, 0.56);
  font-size: var(--font-size-hint);
}

.icon-action,
.alert-action {
  min-height: 40px;
  border: 1px solid rgba(240, 238, 246, 0.1);
  border-radius: var(--radius-lg);
  color: rgba(240, 238, 246, 0.72);
  background: rgba(240, 238, 246, 0.04);
}

.icon-action {
  width: 40px;
  flex: 0 0 auto;
  justify-content: center;
}

.icon-action:disabled {
  cursor: wait;
  opacity: 0.6;
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
  color: #e06a71;
}

.quota-list,
.quota-skeletons {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.quota-row {
  gap: var(--space-4);
  min-height: 84px;
  padding: var(--space-4);
  border-top: 1px solid rgba(240, 238, 246, 0.07);
}

.quota-row:last-child {
  border-bottom: 1px solid rgba(240, 238, 246, 0.07);
}

.quota-icon {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 14px;
  color: #9b87e8;
  background: rgba(99, 71, 194, 0.14);
}

.quota-copy,
.quota-value {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.quota-copy {
  flex: 1;
}

.quota-copy strong {
  color: #f0eef6;
  font-size: 14px;
}

.quota-copy small,
.quota-value small {
  color: rgba(240, 238, 246, 0.56);
  font-size: var(--font-size-hint);
}

.quota-value {
  flex: 0 0 auto;
  text-align: right;
}

.quota-value strong {
  color: #f0eef6;
  font-size: 26px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.quota-row.is-empty .quota-value strong,
.quota-row.is-empty .quota-value small {
  color: #d4a03c;
}

.quota-notice {
  gap: var(--space-2);
  margin-top: var(--space-4);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  color: #d4a03c;
  background: rgba(212, 160, 60, 0.08);
  font-size: var(--font-size-hint);
  line-height: 1.6;
}

.quota-notice.is-danger {
  color: #e06a71;
  background: rgba(217, 83, 92, 0.08);
}

.quota-skeletons span {
  height: 84px;
  border-radius: 16px;
  background:
    linear-gradient(100deg, transparent 20%, rgba(240, 238, 246, 0.04) 50%, transparent 80%),
    rgba(240, 238, 246, 0.025);
  background-size: 200% 100%;
  animation: skeleton 1.4s ease-in-out infinite;
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
  .alert-action:hover {
    border-color: rgba(240, 238, 246, 0.2);
    background: rgba(240, 238, 246, 0.08);
  }
}

@media (max-width: 420px) {
  .quota-row {
    gap: var(--space-3);
    padding-inline: var(--space-2);
  }

  .quota-copy small {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .quota-skeletons span,
  .is-spinning {
    animation: none;
  }
}
</style>
