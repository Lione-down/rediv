<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, Database, Sparkles } from 'lucide-vue-next'
import type { Asset } from '../../../../types/asset'
import type { CanvasNode } from '../../../../types/canvas'

type WorkspaceTab = 'assets' | 'templates' | 'properties'

interface Props {
  activeTab: WorkspaceTab
  visibleAssets: Asset[]
  templates: Array<{ id: string; name: string; description: string }>
  selectedNode: CanvasNode | null
  selectedTitle: string
  selectedNodeType: string
  selectedNodeStatus: string
  activeToolLabel: string
  selectedQuotaType: string | null
  selectedQuotaRemaining: number | null
  isQuotaInsufficient: boolean
  lastErrorMessage: string
  lastSuccessMessage: string
  authQuotas: { text: number; image: number; video: number }
  onTabChange: (tab: WorkspaceTab) => void
  drawerOpen: boolean
  onDrawerClose: () => void
}

defineProps<Props>()

const tabOptions = computed(() => [
  { key: 'assets' as const, label: 'Assets' },
  { key: 'templates' as const, label: 'Templates' },
  { key: 'properties' as const, label: 'Properties' },
])
</script>

<template>
  <!-- Desktop: inline right panel -->
  <aside class="right-panel" aria-label="资产与属性">
    <div class="panel-tabs" role="tablist" aria-label="工作台面板">
      <button
        v-for="opt in tabOptions"
        :key="opt.key"
        class="panel-tab focus-ring"
        :class="{ active: activeTab === opt.key }"
        type="button"
        role="tab"
        :aria-selected="activeTab === opt.key"
        :aria-controls="`panel-${opt.key}`"
        @click="onTabChange(opt.key)"
      >
        {{ opt.label }}
      </button>
    </div>

    <div class="panel-body">
      <!-- Assets tab -->
      <div v-show="activeTab === 'assets'" role="tabpanel" :id="`panel-assets`">
        <section class="panel-section">
          <div class="section-heading">
            <div>
              <p class="panel-label">个人资产</p>
              <h2>最近素材</h2>
            </div>
            <span class="count-pill">{{ visibleAssets.length }}</span>
          </div>

          <div class="asset-grid">
            <article v-for="asset in visibleAssets" :key="asset.id" class="asset-card">
              <div class="asset-thumb">
                <Database :size="16" />
              </div>
              <strong>{{ asset.content_text || asset.type }}</strong>
              <span>{{ asset.source }} · {{ asset.status }}</span>
            </article>
          </div>
        </section>
      </div>

      <!-- Templates tab -->
      <div v-show="activeTab === 'templates'" role="tabpanel" :id="`panel-templates`">
        <section class="panel-section">
          <p class="panel-label">模板库</p>
          <div class="template-list">
            <article v-for="tpl in templates" :key="tpl.id" class="template-card">
              <strong>{{ tpl.name }}</strong>
              <p>{{ tpl.description }}</p>
            </article>
          </div>
        </section>
      </div>

      <!-- Properties tab -->
      <div v-show="activeTab === 'properties'" role="tabpanel" :id="`panel-properties`">
        <section class="panel-section">
          <p class="panel-label">节点属性</p>
          <h2>{{ selectedTitle }}</h2>
          <div class="property-list">
            <div class="property-row">
              <span>类型</span>
              <strong>{{ selectedNodeType }}</strong>
            </div>
            <div class="property-row">
              <span>状态</span>
              <strong>{{ selectedNodeStatus }}</strong>
            </div>
            <div class="property-row">
              <span>模式</span>
              <strong>{{ activeToolLabel }}</strong>
            </div>
            <div v-if="selectedQuotaType" class="property-row">
              <span>剩余额度</span>
              <strong>{{ selectedQuotaRemaining }}</strong>
            </div>
          </div>
          <p class="muted">后续节点参数、模型配置和输出控制会在这里继续承接。</p>

          <div v-if="lastErrorMessage" class="inline-feedback inline-feedback-error">
            <AlertTriangle :size="15" />
            <span>{{ lastErrorMessage }}</span>
          </div>
          <div v-else-if="lastSuccessMessage" class="inline-feedback inline-feedback-success">
            <Sparkles :size="15" />
            <span>{{ lastSuccessMessage }}</span>
          </div>
        </section>
      </div>
    </div>

    <section class="panel-section quota-section">
      <div class="section-heading">
        <div>
          <p class="panel-label">今日额度</p>
          <h2>Quota</h2>
        </div>
      </div>
      <div class="quota-grid">
        <span>文本 {{ authQuotas.text }}</span>
        <span>图片 {{ authQuotas.image }}</span>
        <span>视频 {{ authQuotas.video }}</span>
      </div>
    </section>
  </aside>
</template>

<style scoped lang="scss">
.panel-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 14px var(--space-4) var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
  min-width: 0;
}

.panel-tab {
  min-height: 34px;
  border: 0;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  background: transparent;
  transition:
    color 120ms ease,
    background-color 120ms ease,
    transform 120ms ease;
}

.panel-tab:hover,
.panel-tab.active {
  color: var(--text-primary);
  background: var(--bg-panel-subtle);
}

.panel-tab:active {
  transform: scale(0.96);
}

.panel-body {
  min-height: 0;
  overflow: auto;
  padding: var(--space-4);
}

.panel-section {
  display: grid;
  gap: 14px;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.section-heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 10px;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.asset-card,
.template-card {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-panel-subtle);
}

.asset-thumb {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: var(--radius-sm);
  color: var(--accent-select);
  background: oklch(58% 0.115 252 / 0.1);
}

.asset-card strong,
.template-card strong,
.property-row strong {
  font-size: 13px;
  line-height: 1.45;
}

.asset-card span,
.template-card p,
.muted,
.property-row span {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-hint);
  line-height: 1.55;
}

.template-list,
.property-list {
  display: grid;
  gap: 10px;
}

.property-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
}

.inline-feedback,
.dock-feedback {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.5;
}

.inline-feedback-error {
  color: var(--danger);
  background: color-mix(in oklch, var(--danger) 12%, white 88%);
}

.inline-feedback-success {
  color: var(--success);
  background: color-mix(in oklch, var(--success) 12%, white 88%);
}

.quota-section {
  border-bottom: 0;
}

.quota-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
}

.quota-grid span {
  display: grid;
  place-items: center;
  min-height: 48px;
  border-radius: var(--radius-sm);
  background: var(--bg-panel-subtle);
  color: var(--text-secondary);
  font-size: var(--font-size-hint);
  text-align: center;
}

@media (max-width: 920px) {
  .right-panel {
    display: none;
  }
}

.right-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: 320px;
  min-width: 280px;
  max-width: 360px;
  border-left: 1px solid var(--border-subtle);
  background: var(--bg-panel);
}

@media (prefers-reduced-motion: reduce) {
  .panel-tab {
    transition-duration: 0s;
  }

  .panel-tab:active,
  .asset-card,
  .template-card {
    transform: none;
  }
}
</style>
