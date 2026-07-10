<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ShieldCheck, Sparkles } from 'lucide-vue-next'
import AuthWorkflowPreview from './AuthWorkflowPreview.vue'

withDefaults(defineProps<{
  eyebrow: string
  title: string
  description: string
  showFooter?: boolean
}>(), {
  showFooter: true,
})

</script>

<template>
  <div class="auth-shell" lang="zh-CN">
    <a class="skip-link" href="#auth-main">跳到主要内容</a>

    <header class="auth-header">
      <RouterLink class="brand-link" to="/" aria-label="返回 Revid 首页">
        <span class="brand-mark" aria-hidden="true">R</span>
        <span class="brand-copy">
          <strong>Revid</strong>
          <small>AI 创作工作台</small>
        </span>
      </RouterLink>

      <span class="security-note">
        <ShieldCheck :size="16" aria-hidden="true" />
        安全登录
      </span>
    </header>

    <main id="auth-main" class="auth-layout" tabindex="-1">
      <section class="auth-panel" aria-labelledby="auth-title">
        <div class="panel-heading">
          <p>{{ eyebrow }}</p>
          <h1 id="auth-title">{{ title }}</h1>
          <span>{{ description }}</span>
        </div>

        <slot />

        <footer v-if="showFooter && $slots.footer" class="panel-footer">
          <slot name="footer" />
        </footer>
      </section>

      <section class="auth-story" aria-labelledby="auth-story-title">
        <div class="story-copy">
          <p class="story-eyebrow">
            <Sparkles :size="15" aria-hidden="true" />
            让灵感持续流动
          </p>
          <h2 id="auth-story-title">从一个想法，进入完整创作流。</h2>
          <p>
            在同一个空间整理脚本、角色参考和生成素材，让每一次尝试都能沉淀为下一步的起点。
          </p>
        </div>

        <AuthWorkflowPreview />
      </section>
    </main>

    <footer class="auth-meta">
      <span>Revid</span>
      <span>Prompt、图片与视频的创作工作台</span>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.auth-shell {
  --auth-canvas: #0e0e12;
  --auth-app: #13131a;
  --auth-panel: #1a1a24;
  --auth-raised: #22222e;
  --auth-text: #f0eef6;
  --auth-text-secondary: rgba(240, 238, 246, 0.72);
  --auth-text-muted: rgba(240, 238, 246, 0.56);
  --auth-border: rgba(240, 238, 246, 0.1);
  --auth-border-strong: rgba(240, 238, 246, 0.2);
  --auth-primary: #6347c2;

  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100dvh;
  overflow-x: clip;
  color: var(--auth-text);
  background: var(--auth-canvas);
  padding:
    max(var(--space-4), env(safe-area-inset-top))
    max(var(--space-4), env(safe-area-inset-right))
    max(var(--space-4), env(safe-area-inset-bottom))
    max(var(--space-4), env(safe-area-inset-left));
}

.skip-link {
  position: fixed;
  top: var(--space-3);
  left: var(--space-3);
  z-index: 100;
  min-height: 40px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  color: var(--auth-text);
  background: var(--auth-primary);
  transform: translateY(calc(-100% - var(--space-6)));
  transition: transform 140ms cubic-bezier(0.16, 1, 0.3, 1);
}

.skip-link:focus-visible {
  outline: 3px solid #a997ec;
  outline-offset: 3px;
  transform: translateY(0);
}

.auth-header,
.auth-meta {
  width: min(1160px, 100%);
  margin: 0 auto;
}

.auth-header {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.brand-link,
.brand-copy,
.security-note {
  display: flex;
  align-items: center;
}

.brand-link {
  gap: 10px;
  min-height: 40px;
  border-radius: var(--radius-md);
}

.brand-link:focus-visible {
  outline: 3px solid #a997ec;
  outline-offset: 4px;
}

.brand-mark {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: var(--radius-md);
  color: var(--auth-text);
  background: var(--auth-primary);
  font-weight: 700;
}

.brand-copy {
  align-items: flex-start;
  flex-direction: column;
  gap: 1px;
}

.brand-copy strong {
  font-size: 15px;
  line-height: 1.2;
}

.brand-copy small {
  color: var(--auth-text-muted);
  font-size: var(--font-size-hint);
  line-height: var(--line-height-hint);
}

.security-note {
  min-height: 40px;
  gap: var(--space-2);
  padding: 0 var(--space-3);
  border: 1px solid var(--auth-border);
  border-radius: var(--radius-pill);
  color: var(--auth-text-secondary);
  background: var(--auth-app);
  font-size: var(--font-size-hint);
}

.auth-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(400px, 0.85fr);
  grid-template-areas: 'story panel';
  align-items: center;
  gap: clamp(40px, 7vw, 88px);
  width: min(1160px, 100%);
  margin: 0 auto;
  padding: clamp(48px, 7vh, 80px) 0;
}

.auth-layout:focus {
  outline: none;
}

.auth-layout:focus-visible .auth-panel {
  box-shadow: 0 0 0 3px #a997ec;
}

.auth-shell :deep(.n-input) {
  --n-border: 1px solid rgba(240, 238, 246, 0.36) !important;
  --n-border-hover: 1px solid #7b61d6 !important;
  --n-border-focus: 1px solid #a997ec !important;
  --n-box-shadow-focus: 0 0 0 3px #a997ec !important;
}

.auth-story {
  grid-area: story;
  display: grid;
  gap: var(--space-8);
  min-width: 0;
  animation: auth-enter 460ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.story-copy {
  max-width: 560px;
}

.story-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0 0 var(--space-4);
  color: #a997ec;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}

.story-copy h2 {
  max-width: 540px;
  margin: 0;
  font-size: clamp(36px, 4.4vw, 56px);
  font-weight: 650;
  line-height: 1.06;
  text-wrap: balance;
}

.story-copy > p:last-child {
  max-width: 520px;
  margin: var(--space-4) 0 0;
  color: var(--auth-text-secondary);
  font-size: 15px;
  line-height: 1.8;
  text-wrap: pretty;
}

.auth-panel {
  grid-area: panel;
  width: min(100%, 460px);
  justify-self: end;
  padding: clamp(var(--space-6), 4vw, var(--space-8));
  border: 1px solid var(--auth-border);
  border-radius: var(--radius-lg);
  background: var(--auth-panel);
  animation: auth-enter 460ms 80ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.panel-heading > p {
  margin: 0 0 var(--space-2);
  color: #a997ec;
  font-size: 13px;
  font-weight: 600;
}

.panel-heading h1 {
  margin: 0;
  font-size: clamp(32px, 4vw, 40px);
  font-weight: 650;
  line-height: 1.08;
  text-wrap: balance;
}

.panel-heading > span {
  display: block;
  margin-top: var(--space-3);
  color: var(--auth-text-secondary);
  font-size: var(--font-size-body);
  line-height: 1.7;
  text-wrap: pretty;
}

.panel-footer {
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid var(--auth-border);
}

.auth-meta {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  color: var(--auth-text-muted);
  font-size: var(--font-size-hint);
}

@keyframes auth-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (hover: hover) {
  .brand-link {
    transition: opacity 120ms ease;
  }

  .brand-link:hover {
    opacity: 0.82;
  }
}

@media (max-width: 900px) {
  .auth-layout {
    grid-template-columns: minmax(0, 1fr) minmax(360px, 0.85fr);
    gap: var(--space-8);
  }

  .story-copy h2 {
    font-size: clamp(32px, 5vw, 44px);
  }
}

@media (max-width: 760px) {
  .auth-layout {
    grid-template-columns: 1fr;
    grid-template-areas:
      'panel'
      'story';
    width: min(560px, 100%);
    padding: var(--space-8) 0;
  }

  .auth-panel {
    grid-area: panel;
    width: 100%;
    justify-self: stretch;
  }

  .auth-story {
    grid-area: story;
  }

  .story-copy {
    max-width: 520px;
  }

}

@media (max-width: 560px) {
  .auth-shell {
    padding-right: max(var(--space-3), env(safe-area-inset-right));
    padding-left: max(var(--space-3), env(safe-area-inset-left));
  }

  .brand-copy small,
  .auth-meta span:last-child,
  .story-copy {
    display: none;
  }

  .security-note {
    padding: 0 10px;
  }

  .auth-layout {
    gap: var(--space-6);
    padding: var(--space-6) 0;
  }

  .auth-story {
    gap: 0;
  }

  .auth-panel {
    padding: var(--space-6) var(--space-4);
  }

  .auth-meta {
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-story,
  .auth-panel {
    animation: none;
  }

  .skip-link,
  .brand-link {
    transition: none;
  }
}
</style>
