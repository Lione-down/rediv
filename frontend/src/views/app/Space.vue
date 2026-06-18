<script setup lang="ts">
import { Images, Ticket, Video } from '@lucide/vue'
import AppTopBar from '../../components/layout/AppTopBar.vue'
import { useAssetStore } from '../../store/assets'
import { useAuthStore } from '../../store/auth'

const authStore = useAuthStore()
const assetStore = useAssetStore()
</script>

<template>
  <main class="app-shell space-page">
    <AppTopBar />

    <section class="space-wrap">
      <header class="space-hero">
        <div>
          <p>个人空间</p>
          <h1>管理你的项目、资产和生成额度。</h1>
        </div>
        <div class="quota-summary">
          <span><Ticket :size="16" /> 文本 {{ authStore.quotas.text }}</span>
          <span><Images :size="16" /> 图片 {{ authStore.quotas.image }}</span>
          <span><Video :size="16" /> 视频 {{ authStore.quotas.video }}</span>
        </div>
      </header>

      <section class="asset-grid">
        <article v-for="asset in assetStore.items" :key="asset.id" class="asset-card">
          <span>{{ asset.type }}</span>
          <h2>{{ asset.content_text || '未命名资产' }}</h2>
          <p>{{ asset.source === 'generation' ? '生成资产' : '上传资产' }}</p>
        </article>
      </section>
    </section>
  </main>
</template>

<style scoped lang="scss">
.space-wrap {
  width: min(1120px, calc(100% - 40px));
  margin: 0 auto;
  padding: 42px 0;
}

.space-hero {
  display: flex;
  gap: 24px;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 24px;
}

.space-hero p {
  margin: 0 0 8px;
  color: var(--accent-generate-hover);
  font-weight: 700;
}

h1 {
  max-width: 560px;
  margin: 0;
  font-size: clamp(28px, 4vw, 44px);
  line-height: 1.12;
}

.quota-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.quota-summary span {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  gap: 7px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0 12px;
  background: var(--bg-panel);
  color: var(--text-secondary);
  font-size: 13px;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.asset-card {
  min-height: 176px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 18px;
  background: var(--bg-panel);
  box-shadow: var(--shadow-soft);
}

.asset-card span {
  color: var(--text-muted);
  font-size: 12px;
  text-transform: uppercase;
}

.asset-card h2 {
  margin: 16px 0 8px;
  font-size: 18px;
  line-height: 1.35;
}

.asset-card p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
}

@media (max-width: 760px) {
  .space-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .asset-grid {
    grid-template-columns: 1fr;
  }
}
</style>
