<script setup lang="ts">
import { CopyPlus, ShieldCheck, Ticket } from 'lucide-vue-next'
import AdminLayout from './AdminLayout.vue'

const invitationCards = [
  {
    code: 'RV-ALPHA-001',
    status: '可使用',
    createdAt: '2026-06-19 09:00',
    usage: '0 / 1',
  },
  {
    code: 'RV-BETA-014',
    status: '已使用',
    createdAt: '2026-06-18 18:20',
    usage: '1 / 1',
  },
  {
    code: 'RV-TEAM-021',
    status: '待过期',
    createdAt: '2026-06-17 14:05',
    usage: '2 / 5',
  },
]
</script>

<template>
  <AdminLayout>
    <section class="admin-page">
      <header class="page-head">
        <div>
          <span class="eyebrow">邀请码管理</span>
          <h2>把注册准入的状态、创建时间和使用次数整理成可扫描的卡片列表。</h2>
          <p>当前先保留卡片骨架，后续继续承接创建、禁用、过期和用量控制操作。</p>
        </div>
        <button class="ghost-action focus-ring" type="button">
          <CopyPlus :size="16" />
          创建邀请码
        </button>
      </header>

      <section class="tip-card">
        <span class="tip-icon">
          <ShieldCheck :size="18" />
        </span>
        <div>
          <strong>当前规则</strong>
          <p>邀请码入口继续维持可控注册节奏，避免在真实 OAuth 接入前放开无审核注册。</p>
        </div>
      </section>

      <section class="card-grid">
        <article v-for="item in invitationCards" :key="item.code" class="invite-card">
          <div class="card-top">
            <span class="ticket-icon">
              <Ticket :size="18" />
            </span>
            <span class="status-pill">{{ item.status }}</span>
          </div>
          <strong>{{ item.code }}</strong>
          <dl>
            <div>
              <dt>创建时间</dt>
              <dd>{{ item.createdAt }}</dd>
            </div>
            <div>
              <dt>使用次数</dt>
              <dd>{{ item.usage }}</dd>
            </div>
          </dl>
        </article>
      </section>
    </section>
  </AdminLayout>
</template>

<style scoped lang="scss">
.admin-page {
  display: grid;
  gap: 18px;
  animation: page-enter 420ms ease both;
}

.page-head,
.tip-card,
.invite-card {
  border: 1px solid var(--border-subtle);
  border-radius: 24px;
  background: oklch(100% 0.004 92 / 0.9);
  box-shadow: 0 20px 44px oklch(24% 0.016 245 / 0.06);
}

.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
}

.eyebrow,
.status-pill,
.ghost-action {
  display: inline-flex;
  width: fit-content;
  min-height: 30px;
  align-items: center;
  gap: 8px;
  padding: 0 11px;
  border-radius: 999px;
  font-size: 12px;
}

.eyebrow {
  color: var(--accent-generate-hover);
  background: oklch(96% 0.022 175);
}

.page-head h2,
.tip-card strong,
.invite-card strong {
  margin: 0;
  color: var(--text-primary);
}

.page-head h2 {
  margin-top: 14px;
  max-width: 18ch;
  font-size: clamp(26px, 4vw, 36px);
  line-height: 1.12;
}

.page-head p,
.tip-card p,
dt,
dd {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.65;
}

.ghost-action {
  border: 1px solid var(--border-subtle);
  background: var(--bg-panel-subtle);
  color: var(--text-primary);
  transition:
    background-color 120ms ease,
    border-color 120ms ease,
    transform 120ms ease;
}

.ghost-action:hover,
.invite-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
}

.ghost-action:active {
  transform: scale(0.96);
}

.tip-card {
  display: flex;
  gap: 14px;
  padding: 18px;
}

.tip-icon,
.ticket-icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 12px;
  flex-shrink: 0;
}

.tip-icon {
  color: var(--accent-select);
  background: oklch(95% 0.024 252);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.invite-card {
  display: grid;
  gap: 14px;
  min-height: 220px;
  padding: 18px;
  transition:
    border-color 120ms ease,
    transform 120ms ease;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ticket-icon {
  color: var(--accent-generate-hover);
  background: oklch(95% 0.024 175);
}

.status-pill {
  color: var(--text-secondary);
  background: var(--bg-panel-subtle);
  border: 1px solid var(--border-subtle);
}

dl {
  display: grid;
  gap: 12px;
  margin: 0;
}

dt {
  color: var(--text-muted);
  font-size: 12px;
}

dd {
  margin-top: 4px;
}

@media (max-width: 1040px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .page-head {
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
  }

  .page-head h2 {
    max-width: none;
    font-size: clamp(24px, 8vw, 30px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-page {
    animation: none;
  }

  .ghost-action,
  .invite-card {
    transition: none;
  }
}

@keyframes page-enter {
  from {
    opacity: 0;
    transform: translateY(16px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
