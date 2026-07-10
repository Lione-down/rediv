<script setup lang="ts">
import { Ban, Image, Sparkles, Video } from 'lucide-vue-next'
import { computed } from 'vue'
import type { Component } from 'vue'
import type { QuotaBalance, User } from '../../../../types/auth'

const props = defineProps<{
  quotas: QuotaBalance
  generationStatus: User['generation_status']
}>()

interface QuotaItem {
  key: keyof QuotaBalance
  label: string
  icon: Component
}

const quotaItems: QuotaItem[] = [
  { key: 'text', label: 'Text', icon: Sparkles },
  { key: 'image', label: 'Image', icon: Image },
  { key: 'video', label: 'Video', icon: Video },
]

const isAllEmpty = computed(() => quotaItems.every((item) => props.quotas[item.key] <= 0))
</script>

<template>
  <section class="quota-panel" aria-label="账户额度">
    <div class="section-heading">
      <div>
        <p>Quota</p>
        <h2>当前额度</h2>
      </div>
      <span>{{ generationStatus === 'enabled' ? '可生成' : '已冻结' }}</span>
    </div>

    <div class="quota-list">
      <article
        v-for="quota in quotaItems"
        :key="quota.key"
        class="quota-row"
        :class="{ 'is-empty': quotas[quota.key] <= 0 }"
      >
        <component :is="quota.icon" :size="17" />
        <span>{{ quota.label }}</span>
        <strong>{{ quotas[quota.key] }}</strong>
        <small>{{ quotas[quota.key] <= 0 ? '已用尽' : '可用' }}</small>
      </article>
    </div>

    <p v-if="generationStatus === 'frozen'" class="quota-notice is-danger" role="status">
      <Ban :size="15" />
      当前账户已暂停生成。
    </p>
    <p v-else-if="isAllEmpty" class="quota-notice" role="status">
      三类额度均为零，当前无法提交新的生成任务。
    </p>
  </section>
</template>

<style scoped lang="scss">
.quota-panel {
  min-width: 0;
  padding: 20px;
  border-radius: 22px;
  color: oklch(94% 0.008 92);
  background:
    radial-gradient(circle at top right, oklch(62% 0.105 175 / 0.16), transparent 32%),
    linear-gradient(180deg, oklch(23% 0.018 245), oklch(17% 0.012 245));
  box-shadow: var(--shadow-strong);
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.section-heading p,
.section-heading h2,
.quota-notice {
  margin: 0;
}

.section-heading p {
  color: oklch(82% 0.035 175);
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-heading h2 {
  margin-top: 4px;
  font-size: 19px;
}

.section-heading > span {
  padding: 6px 9px;
  border-radius: var(--radius-pill);
  color: oklch(88% 0.02 175);
  background: oklch(100% 0.004 92 / 0.08);
  font-size: var(--font-size-hint);
}

.quota-list {
  display: grid;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.quota-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: var(--space-3);
  min-height: 48px;
  padding: 0 var(--space-3);
  border-radius: 14px;
  background: oklch(100% 0.004 92 / 0.07);
}

.quota-row > svg {
  color: oklch(82% 0.035 175);
}

.quota-row span,
.quota-row small {
  color: oklch(84% 0.012 245 / 0.78);
}

.quota-row strong {
  font-size: 21px;
  font-variant-numeric: tabular-nums;
}

.quota-row small {
  min-width: 3em;
  text-align: right;
  font-size: var(--font-size-hint);
}

.quota-row.is-empty strong,
.quota-row.is-empty small {
  color: oklch(75% 0.02 78);
}

.quota-notice {
  margin-top: var(--space-3);
  color: oklch(82% 0.02 78);
  font-size: var(--font-size-hint);
  line-height: 1.6;
}

.quota-notice.is-danger {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: oklch(78% 0.08 27);
}

@media (max-width: 420px) {
  .quota-panel {
    padding: var(--space-4);
  }

  .quota-row {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }

  .quota-row small {
    display: none;
  }
}
</style>
