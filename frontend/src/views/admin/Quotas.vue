<script setup lang="ts">
import { Coins, Image as ImageIcon, Ticket, Video } from 'lucide-vue-next'
import AdminLayout from './AdminLayout.vue'

const quotaRows = [
  { type: '文本额度', defaultValue: '20', dispatchedToday: '6', pending: '2' },
  { type: '图片额度', defaultValue: '8', dispatchedToday: '3', pending: '1' },
  { type: '视频额度', defaultValue: '2', dispatchedToday: '1', pending: '0' },
]

const dispatchActions = [
  { label: '文本派发', value: '+10', icon: Ticket },
  { label: '图片派发', value: '+4', icon: ImageIcon },
  { label: '视频派发', value: '+1', icon: Video },
]
</script>

<template>
  <AdminLayout>
    <section class="admin-page">
      <header class="page-head">
        <div>
          <span class="eyebrow">额度管理</span>
          <h2>先把额度类型、默认值和派发操作区放到同一个管理页面。</h2>
          <p>当前保留表格字段和派发入口骨架，后续联调用户额度详情与流水。</p>
        </div>
      </header>

      <section class="quota-layout">
        <article class="table-card">
          <div class="section-head">
            <h3>额度类型</h3>
            <span>表格字段已经对齐文本、图片、视频三类额度的常用管理视角。</span>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>类型</th>
                  <th>默认值</th>
                  <th>今日派发</th>
                  <th>待处理</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in quotaRows" :key="row.type">
                  <td>{{ row.type }}</td>
                  <td>{{ row.defaultValue }}</td>
                  <td>{{ row.dispatchedToday }}</td>
                  <td>{{ row.pending }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article class="dispatch-card">
          <div class="section-head">
            <h3>派发操作区</h3>
            <span>先承接三个高频动作，后续再接真实用户选择和表单提交。</span>
          </div>

          <div class="action-list">
            <button v-for="item in dispatchActions" :key="item.label" class="action-row focus-ring" type="button">
              <span class="action-icon">
                <component :is="item.icon" :size="18" />
              </span>
              <span class="action-copy">
                <strong>{{ item.label }}</strong>
                <span>默认快速派发 {{ item.value }}</span>
              </span>
            </button>
          </div>

          <div class="stock-note">
            <span class="note-icon">
              <Coins :size="18" />
            </span>
            <p>额度库存与流水接口在后续任务继续接入，这里先锁定信息区块与操作位。</p>
          </div>
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
.table-card,
.dispatch-card {
  border: 1px solid var(--border-subtle);
  border-radius: 24px;
  background: oklch(100% 0.004 92 / 0.9);
  box-shadow: 0 20px 44px oklch(24% 0.016 245 / 0.06);
}

.page-head,
.table-card,
.dispatch-card {
  padding: 20px;
}

.eyebrow {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  padding: 0 11px;
  border-radius: 999px;
  color: var(--accent-generate-hover);
  background: oklch(96% 0.022 175);
  font-size: 12px;
}

.page-head h2,
.section-head h3,
.action-copy strong {
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
.section-head span,
th,
td,
.action-copy span,
.stock-note p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.65;
}

.quota-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
  gap: 14px;
}

.section-head {
  margin-bottom: 16px;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 14px 12px;
  text-align: left;
  border-top: 1px solid var(--border-subtle);
}

th {
  padding-top: 0;
  border-top: 0;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
}

.action-list {
  display: grid;
  gap: 10px;
}

.action-row,
.stock-note {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  background: var(--bg-panel);
}

.action-row {
  text-align: left;
  transition:
    border-color 120ms ease,
    transform 120ms ease;
}

.action-row:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
}

.action-row:active {
  transform: scale(0.96);
}

.action-icon,
.note-icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 12px;
  flex-shrink: 0;
}

.action-icon {
  color: var(--accent-generate-hover);
  background: oklch(95% 0.024 175);
}

.note-icon {
  color: var(--accent-select);
  background: oklch(95% 0.024 252);
}

.action-copy {
  display: grid;
  gap: 2px;
}

.stock-note {
  margin-top: 12px;
  align-items: flex-start;
}

@media (max-width: 1040px) {
  .quota-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .page-head,
  .table-card,
  .dispatch-card {
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

  .action-row {
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
