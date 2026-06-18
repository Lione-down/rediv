<script setup lang="ts">
import { computed } from 'vue'
import { Database, Play, WandSparkles } from '@lucide/vue'
import AppTopBar from '../../components/layout/AppTopBar.vue'
import CanvasStage from '../../components/canvas/CanvasStage.vue'
import { useAssetStore } from '../../store/assets'
import { useAuthStore } from '../../store/auth'
import { useCanvasStore } from '../../store/canvas'

const authStore = useAuthStore()
const assetStore = useAssetStore()
const canvasStore = useCanvasStore()

const selectedTitle = computed(() => canvasStore.selectedNode?.title || '未选中节点')
</script>

<template>
  <main class="workspace-page">
    <AppTopBar />

    <div class="workspace-layout">
      <CanvasStage />

      <aside class="right-panel" aria-label="资产与属性">
        <section>
          <p class="panel-label">当前节点</p>
          <h2>{{ selectedTitle }}</h2>
          <p class="muted">这里会承接后续节点属性、模型参数和生成状态。</p>
        </section>

        <section>
          <p class="panel-label">个人资产</p>
          <div class="asset-list">
            <article v-for="asset in assetStore.items" :key="asset.id" class="asset-item">
              <Database :size="16" />
              <span>{{ asset.content_text || asset.type }}</span>
            </article>
          </div>
        </section>

        <section class="quota-box">
          <p class="panel-label">今日额度</p>
          <span>文本 {{ authStore.quotas.text }}</span>
          <span>图片 {{ authStore.quotas.image }}</span>
          <span>视频 {{ authStore.quotas.video }}</span>
        </section>
      </aside>
    </div>

    <footer class="prompt-dock">
      <WandSparkles :size="18" />
      <span>继续当前流程，下一步生成关键帧。</span>
      <button class="focus-ring" type="button">
        <Play :size="17" />
        立即生成
      </button>
    </footer>
  </main>
</template>

<style scoped lang="scss">
.workspace-page {
  min-height: 100dvh;
  background: var(--bg-canvas);
}

.workspace-layout {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  min-height: calc(100dvh - 56px);
}

.right-panel {
  z-index: 8;
  display: grid;
  align-content: start;
  gap: 16px;
  border-left: 1px solid var(--border-subtle);
  padding: 18px;
  background: oklch(100% 0.004 92 / 0.82);
  backdrop-filter: blur(16px);
}

.right-panel section {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 14px;
  background: var(--bg-panel);
}

.panel-label {
  margin: 0 0 8px;
  color: var(--text-muted);
  font-size: 12px;
}

h2 {
  margin: 0 0 8px;
  font-size: 17px;
}

.muted {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.asset-list {
  display: grid;
  gap: 8px;
}

.asset-item {
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 8px;
  border-radius: var(--radius-md);
  padding: 0 10px;
  background: var(--bg-panel-subtle);
  color: var(--text-secondary);
  font-size: 13px;
}

.quota-box {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.quota-box .panel-label {
  grid-column: 1 / -1;
}

.quota-box span {
  border-radius: var(--radius-sm);
  padding: 8px;
  background: var(--bg-panel-subtle);
  color: var(--text-secondary);
  font-size: 12px;
  text-align: center;
}

.prompt-dock {
  position: fixed;
  right: 360px;
  bottom: 18px;
  left: 96px;
  z-index: 10;
  display: flex;
  min-height: 54px;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  padding: 8px 10px 8px 16px;
  background: oklch(100% 0.004 92 / 0.86);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(18px);
}

.prompt-dock span {
  flex: 1;
  color: var(--text-secondary);
  font-size: 14px;
}

.prompt-dock button {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: var(--radius-md);
  padding: 0 14px;
  color: white;
  background: var(--accent-generate);
  font-weight: 650;
}

@media (max-width: 920px) {
  .workspace-layout {
    grid-template-columns: 1fr;
  }

  .right-panel {
    display: none;
  }

  .prompt-dock {
    right: 12px;
    bottom: 78px;
    left: 12px;
  }
}
</style>
