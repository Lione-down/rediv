<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowRight, Clock3, FolderKanban, Images, Sparkles } from '@lucide/vue'
import AppTopBar from '../../components/layout/AppTopBar.vue'
import PromptComposer from '../../components/common/PromptComposer.vue'
import { useAuthStore } from '../../store/auth'

const authStore = useAuthStore()

const quickStarts = [
  { title: '故事脚本', text: '先把想法整理成镜头脚本。' },
  { title: '角色参考', text: '上传或生成角色视觉锚点。' },
  { title: '视频草稿', text: '把图片和文本汇聚成短视频。' },
]
</script>

<template>
  <main class="app-shell home-page">
    <AppTopBar />

    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">多模态 AI 创作画布</p>
        <h1>把 prompt、图片和视频放进同一个创作空间。</h1>
        <p>
          Revid 先帮你组织创作流程和个人资产，再接入 Agnes 文本、图片、视频模型完成低成本试错。
        </p>
        <div class="hero-actions">
          <button class="secondary focus-ring" type="button" @click="authStore.loginWithMockWechat">
            微信 mock 登录
          </button>
          <RouterLink class="primary focus-ring" to="/app/workspace">
            进入工作流
            <ArrowRight :size="18" />
          </RouterLink>
        </div>
      </div>

      <PromptComposer />
    </section>

    <section class="content-grid" aria-label="创作入口和最近项目">
      <article v-for="item in quickStarts" :key="item.title" class="start-card">
        <Sparkles :size="18" />
        <h2>{{ item.title }}</h2>
        <p>{{ item.text }}</p>
      </article>

      <article class="status-card wide">
        <FolderKanban :size="20" />
        <div>
          <h2>最近项目</h2>
          <p>雨夜车站短片、角色设定、封面探索。</p>
        </div>
      </article>
      <article class="status-card">
        <Images :size="20" />
        <div>
          <h2>资产库</h2>
          <p>Prompt、图片、视频持续沉淀。</p>
        </div>
      </article>
      <article class="status-card">
        <Clock3 :size="20" />
        <div>
          <h2>额度</h2>
          <p>文本 {{ authStore.quotas.text }} / 图片 {{ authStore.quotas.image }} / 视频 {{ authStore.quotas.video }}</p>
        </div>
      </article>
    </section>
  </main>
</template>

<style scoped lang="scss">
.hero {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(320px, 1.1fr);
  gap: 48px;
  align-items: center;
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
  padding: 68px 0 42px;
}

.eyebrow {
  margin: 0 0 12px;
  color: var(--accent-generate-hover);
  font-size: 13px;
  font-weight: 700;
}

h1 {
  max-width: 580px;
  margin: 0;
  font-size: clamp(34px, 5vw, 64px);
  line-height: 1.04;
  letter-spacing: 0;
}

.hero-copy > p:not(.eyebrow) {
  max-width: 560px;
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.primary,
.secondary {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 8px;
  border-radius: var(--radius-md);
  padding: 0 16px;
  border: 0;
}

.primary {
  color: white;
  background: var(--accent-generate);
  font-weight: 700;
}

.secondary {
  color: var(--text-primary);
  background: var(--bg-panel);
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
  padding-bottom: 42px;
}

.start-card,
.status-card {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 18px;
  background: oklch(100% 0.004 92 / 0.75);
  box-shadow: var(--shadow-soft);
}

.start-card h2,
.status-card h2 {
  margin: 10px 0 6px;
  font-size: 16px;
}

.start-card p,
.status-card p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.status-card {
  display: flex;
  gap: 12px;
}

.wide {
  grid-column: span 1;
}

@media (max-width: 860px) {
  .hero,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .hero {
    gap: 30px;
    padding-top: 36px;
  }
}
</style>
