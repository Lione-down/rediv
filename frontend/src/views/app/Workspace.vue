<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Database,
  Hand,
  Image as ImageIcon,
  MousePointer2,
  PanelsTopLeft,
  Play,
  Sparkles,
  Type,
  WandSparkles,
} from 'lucide-vue-next'
import AppTopBar from '../../components/layout/AppTopBar.vue'
import CanvasStage from '../../components/canvas/CanvasStage.vue'
import { useAssetStore } from '../../store/assets'
import { useAuthStore } from '../../store/auth'
import { useCanvasStore } from '../../store/canvas'

const authStore = useAuthStore()
const assetStore = useAssetStore()
const canvasStore = useCanvasStore()

const activeTab = ref<'assets' | 'templates' | 'properties'>('assets')
const isMobilePanelOpen = ref(false)

const tools = [
  { key: 'select', label: '选择', icon: MousePointer2 },
  { key: 'hand', label: '移动', icon: Hand },
  { key: 'text', label: '文本', icon: Type },
  { key: 'image', label: '图片', icon: ImageIcon },
  { key: 'generate', label: '生成', icon: Sparkles },
] as const

const templates = [
  { id: 'tpl-shot', name: '镜头脚本', description: '先产出节奏与分镜结构。' },
  { id: 'tpl-style', name: '风格对齐', description: '先锁定角色、场景和质感。' },
  { id: 'tpl-output', name: '生成链路', description: '把素材、模型和结果收成一条链。' },
]

const selectedTitle = computed(() => canvasStore.selectedNode?.title || '未选中节点')
const selectedNodeType = computed(() => canvasStore.selectedNode?.type || '未选择')
const selectedNodeStatus = computed(() => canvasStore.selectedNode?.status || 'idle')
const visibleAssets = computed(() => assetStore.items.slice(0, 4))
const activeToolLabel = computed(() => tools.find((tool) => tool.key === canvasStore.mode)?.label || '选择')

function setActiveTab(tab: 'assets' | 'templates' | 'properties') {
  activeTab.value = tab
  isMobilePanelOpen.value = true
}

function toggleMobilePanel() {
  isMobilePanelOpen.value = !isMobilePanelOpen.value
}
</script>

<template>
  <main class="workspace-page">
    <AppTopBar />

    <div class="workspace-shell">
      <aside class="tool-rail" aria-label="画布工具">
        <button
          v-for="tool in tools"
          :key="tool.key"
          class="tool-button focus-ring"
          :class="{ active: canvasStore.mode === tool.key }"
          type="button"
          :title="tool.label"
          :aria-label="tool.label"
          :aria-pressed="canvasStore.mode === tool.key"
          @click="canvasStore.setMode(tool.key)"
        >
          <component :is="tool.icon" :size="18" />
        </button>
      </aside>

      <section class="canvas-column" aria-label="工作流主舞台">
        <div class="canvas-chrome">
          <div>
            <p class="eyebrow">当前项目</p>
            <h1>午夜车站概念片</h1>
          </div>
          <div class="canvas-status">
            <span class="status-pill">{{ activeToolLabel }}模式</span>
            <button
              class="mobile-panel-toggle focus-ring"
              type="button"
              :aria-expanded="isMobilePanelOpen"
              aria-controls="workspace-side-panel"
              @click="toggleMobilePanel"
            >
              <PanelsTopLeft :size="16" />
              面板
            </button>
          </div>
        </div>

        <div class="stage-frame">
          <CanvasStage />
        </div>
      </section>

      <aside
        id="workspace-side-panel"
        class="right-panel"
        :class="{ 'mobile-open': isMobilePanelOpen }"
        aria-label="资产与属性"
      >
        <div class="panel-tabs" role="tablist" aria-label="工作台面板">
          <button
            class="panel-tab focus-ring"
            :class="{ active: activeTab === 'assets' }"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'assets'"
            @click="setActiveTab('assets')"
          >
            Assets
          </button>
          <button
            class="panel-tab focus-ring"
            :class="{ active: activeTab === 'templates' }"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'templates'"
            @click="setActiveTab('templates')"
          >
            Templates
          </button>
          <button
            class="panel-tab focus-ring"
            :class="{ active: activeTab === 'properties' }"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'properties'"
            @click="setActiveTab('properties')"
          >
            Properties
          </button>
        </div>

        <div class="panel-body">
          <template v-if="activeTab === 'assets'">
            <section class="panel-section">
              <div class="section-heading">
                <div>
                  <p class="panel-label">个人资产</p>
                  <h2>最近素材</h2>
                </div>
                <span class="count-pill">{{ assetStore.items.length }}</span>
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
          </template>

          <template v-else-if="activeTab === 'templates'">
            <section class="panel-section">
              <p class="panel-label">模板库</p>
              <div class="template-list">
                <article v-for="template in templates" :key="template.id" class="template-card">
                  <strong>{{ template.name }}</strong>
                  <p>{{ template.description }}</p>
                </article>
              </div>
            </section>
          </template>

          <template v-else>
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
              </div>
              <p class="muted">后续节点参数、模型配置和输出控制会在这里继续承接。</p>
            </section>
          </template>
        </div>

        <section class="panel-section quota-section">
          <div class="section-heading">
            <div>
              <p class="panel-label">今日额度</p>
              <h2>Quota</h2>
            </div>
          </div>
          <div class="quota-grid">
            <span>文本 {{ authStore.quotas.text }}</span>
            <span>图片 {{ authStore.quotas.image }}</span>
            <span>视频 {{ authStore.quotas.video }}</span>
          </div>
        </section>
      </aside>
    </div>

    <footer class="prompt-dock">
      <div class="dock-copy">
        <WandSparkles :size="18" />
        <span>继续当前流程，下一步生成关键帧。</span>
      </div>
      <div class="dock-actions">
        <button class="panel-action focus-ring" type="button" @click="toggleMobilePanel">
          <PanelsTopLeft :size="16" />
          面板
        </button>
        <button class="generate-action focus-ring" type="button">
          <Play :size="17" />
          立即生成
        </button>
      </div>
    </footer>
  </main>
</template>

<style scoped lang="scss">
.workspace-page {
  min-height: 100dvh;
  background: var(--bg-app);
}

.workspace-shell {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) minmax(280px, 320px);
  min-height: calc(100dvh - 52px);
}

.tool-rail {
  display: grid;
  align-content: start;
  justify-items: center;
  gap: 8px;
  padding: 12px 8px;
  border-right: 1px solid var(--border-subtle);
  background: var(--bg-panel);
}

.tool-button {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 0;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  background: transparent;
  transition:
    color 120ms ease,
    background-color 120ms ease,
    box-shadow 120ms ease,
    transform 120ms ease;
}

.tool-button:hover,
.tool-button.active {
  color: var(--text-primary);
  background: oklch(58% 0.115 252 / 0.12);
}

.tool-button:active {
  transform: scale(0.96);
}

.canvas-column {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
}

.canvas-chrome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px 12px;
  border-bottom: 1px solid var(--border-subtle);
  background: oklch(100% 0.004 92 / 0.64);
}

.eyebrow,
.panel-label {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
}

.canvas-chrome h1,
.right-panel h2 {
  margin: 4px 0 0;
  font-size: 15px;
  line-height: 1.35;
}

.canvas-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-pill,
.count-pill {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  border-radius: 999px;
  padding: 0 10px;
  background: var(--bg-panel-subtle);
  color: var(--text-secondary);
  font-size: 12px;
}

.stage-frame {
  position: relative;
  min-height: 0;
  overflow: hidden;
}

.right-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: minmax(280px, 320px);
  min-width: 280px;
  max-width: 360px;
  border-left: 1px solid var(--border-subtle);
  background: var(--bg-panel);
}

.panel-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--border-subtle);
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

.panel-tab:active,
.mobile-panel-toggle:active,
.panel-action:active,
.generate-action:active {
  transform: scale(0.96);
}

.panel-body {
  min-height: 0;
  overflow: auto;
  padding: 16px;
}

.panel-section {
  display: grid;
  gap: 14px;
  padding: 16px;
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
  gap: 8px;
  padding: 12px;
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
  font-size: 12px;
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
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
}

.quota-section {
  border-bottom: 0;
}

.quota-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.quota-grid span {
  display: grid;
  place-items: center;
  min-height: 48px;
  border-radius: var(--radius-sm);
  background: var(--bg-panel-subtle);
  color: var(--text-secondary);
  font-size: 12px;
  text-align: center;
}

.mobile-panel-toggle,
.panel-action,
.generate-action {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: var(--radius-sm);
  padding: 0 12px;
  transition:
    color 120ms ease,
    background-color 120ms ease,
    box-shadow 120ms ease,
    transform 120ms ease;
}

.mobile-panel-toggle,
.panel-action {
  color: var(--text-secondary);
  background: var(--bg-panel-subtle);
}

.generate-action {
  color: white;
  background: var(--accent-generate);
}

.generate-action:hover {
  background: var(--accent-generate-hover);
}

.prompt-dock {
  position: fixed;
  right: 340px;
  bottom: 18px;
  left: 88px;
  z-index: 12;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-height: 58px;
  padding: 9px 10px 9px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  background: oklch(100% 0.004 92 / 0.88);
  box-shadow: var(--shadow-soft);
}

.dock-copy,
.dock-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dock-copy {
  min-width: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.dock-copy span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-panel-toggle,
.panel-action {
  display: none;
}

@media (max-width: 920px) {
  .workspace-shell {
    grid-template-columns: 1fr;
  }

  .tool-rail {
    position: fixed;
    right: 12px;
    bottom: 12px;
    left: 12px;
    z-index: 18;
    display: flex;
    justify-content: space-between;
    padding: 8px 10px calc(8px + env(safe-area-inset-bottom, 0px));
    border: 1px solid var(--border-subtle);
    border-radius: 18px;
    background: oklch(100% 0.004 92 / 0.92);
    box-shadow: var(--shadow-soft);
  }

  .canvas-chrome {
    padding: 12px 14px 10px;
  }

  .canvas-chrome h1 {
    font-size: 14px;
  }

  .status-pill {
    display: none;
  }

  .mobile-panel-toggle,
  .panel-action {
    display: inline-flex;
  }

  .right-panel {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 20;
    width: auto;
    min-width: 0;
    max-width: none;
    max-height: 60dvh;
    border-top: 1px solid var(--border-subtle);
    border-left: 0;
    border-radius: 18px 18px 0 0;
    transform: translateY(calc(100% - 56px));
    transition: transform 160ms ease;
    box-shadow: 0 -18px 40px oklch(20% 0.02 245 / 0.08);
  }

  .right-panel.mobile-open {
    transform: translateY(0);
  }

  .panel-body {
    padding-bottom: 24px;
  }

  .asset-grid {
    grid-template-columns: 1fr 1fr;
  }

  .prompt-dock {
    right: 12px;
    bottom: 86px;
    left: 12px;
    align-items: stretch;
    flex-direction: column;
    padding: 12px;
  }

  .dock-copy,
  .dock-actions {
    width: 100%;
  }

  .dock-actions > * {
    flex: 1;
  }
}
</style>
