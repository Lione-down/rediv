<script setup lang="ts">
import { Boxes, LayoutTemplate, RefreshCcw, Sparkles } from 'lucide-vue-next'
import { computed } from 'vue'
import type { QuotaBalance } from '../../../../types/auth'

const props = defineProps<{
  nickname: string
  assetTotal: number | null
  templateTotal: number | null
  quotas: QuotaBalance
  isRefreshing: boolean
}>()

const emit = defineEmits<{
  refresh: []
}>()

const availableQuotaTypes = computed(
  () => Object.values(props.quotas).filter((remaining) => remaining > 0).length,
)
</script>

<template>
  <header class="space-overview" aria-labelledby="space-title">
    <div class="overview-copy">
      <p>Personal asset workspace</p>
      <h1 id="space-title">{{ nickname }} 的个人空间</h1>
      <span>筛选真实资产，复用模板，并在一个安静的工作区里核对剩余额度。</span>
    </div>

    <button
      class="refresh-action focus-ring"
      type="button"
      :disabled="isRefreshing"
      aria-label="刷新个人空间全部数据"
      @click="emit('refresh')"
    >
      <RefreshCcw :size="17" :class="{ 'is-spinning': isRefreshing }" />
      <span>{{ isRefreshing ? '同步中' : '刷新数据' }}</span>
    </button>

    <dl class="status-rail" aria-label="个人空间数据概览">
      <div>
        <dt><Boxes :size="15" />当前资产</dt>
        <dd>{{ assetTotal === null ? '等待同步' : assetTotal }}</dd>
      </div>
      <div>
        <dt><LayoutTemplate :size="15" />模板</dt>
        <dd>{{ templateTotal === null ? '等待同步' : templateTotal }}</dd>
      </div>
      <div>
        <dt><Sparkles :size="15" />额度状态</dt>
        <dd>{{ availableQuotaTypes }} / 3 类可用</dd>
      </div>
    </dl>
  </header>
</template>

<style scoped lang="scss">
.space-overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: var(--space-6);
  padding: 34px 4px var(--space-6);
}

.overview-copy {
  min-width: 0;
}

.overview-copy p,
.overview-copy h1,
.overview-copy span,
.status-rail,
.status-rail dd {
  margin: 0;
}

.overview-copy p {
  color: #8f7ae1;
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.overview-copy h1 {
  margin-top: var(--space-2);
  overflow-wrap: anywhere;
  color: #f0eef6;
  font-size: clamp(30px, 4vw, 46px);
  line-height: 1.08;
  text-wrap: balance;
}

.overview-copy span {
  display: block;
  max-width: 62ch;
  margin-top: var(--space-3);
  color: rgba(240, 238, 246, 0.62);
  line-height: 1.75;
  text-wrap: pretty;
}

.refresh-action {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
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

.refresh-action:active {
  transform: scale(0.96);
}

.refresh-action:disabled {
  cursor: wait;
  opacity: 0.62;
}

.status-rail {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid rgba(240, 238, 246, 0.08);
  border-bottom: 1px solid rgba(240, 238, 246, 0.08);
}

.status-rail > div {
  min-width: 0;
  padding: var(--space-4) var(--space-6);
}

.status-rail > div:first-child {
  padding-left: 0;
}

.status-rail > div + div {
  border-left: 1px solid rgba(240, 238, 246, 0.08);
}

.status-rail dt {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: rgba(240, 238, 246, 0.56);
  font-size: var(--font-size-hint);
}

.status-rail dd {
  margin-top: 7px;
  color: #f0eef6;
  font-size: 22px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}

.is-spinning {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (hover: hover) {
  .refresh-action:hover:not(:disabled) {
    border-color: rgba(240, 238, 246, 0.2);
    background: rgba(240, 238, 246, 0.09);
  }
}

@media (max-width: 680px) {
  .space-overview {
    grid-template-columns: 1fr;
    align-items: start;
    padding-top: var(--space-6);
  }

  .refresh-action {
    justify-self: start;
  }

  .status-rail {
    grid-column: 1;
  }

  .status-rail > div {
    padding-inline: var(--space-3);
  }

  .status-rail > div:first-child {
    padding-left: 0;
  }
}

@media (max-width: 420px) {
  .space-overview {
    gap: var(--space-4);
  }

  .overview-copy h1 {
    font-size: 30px;
  }

  .status-rail dd {
    font-size: 18px;
  }

  .refresh-action span {
    display: none;
  }

  .refresh-action {
    width: 42px;
    padding: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .refresh-action {
    transition: none;
  }

  .refresh-action:active {
    transform: none;
  }

  .is-spinning {
    animation: none;
  }
}
</style>
