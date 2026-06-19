<script setup lang="ts">
import { Clock3, Sparkles, Video, Workflow } from 'lucide-vue-next'
import AdminLayout from './AdminLayout.vue'

const taskRows = [
  { type: '文本生成', status: 'running', progress: '64%', queue: 'A-01' },
  { type: '图片生成', status: 'queued', progress: '0%', queue: 'A-03' },
  { type: '视频生成', status: 'failed', progress: '83%', queue: 'A-07' },
]

const summary = [
  { label: '运行中', value: '4', icon: Workflow },
  { label: '排队中', value: '3', icon: Clock3 },
  { label: '待复查失败', value: '1', icon: Video },
]
</script>

<template>
  <AdminLayout>
    <section class="admin-page">
      <header class="page-head">
        <div>
          <span class="eyebrow">任务监控</span>
          <h2>先把多模型任务队列的状态、进度和队列位次压成一张监控表。</h2>
          <p>当前保持纯前端骨架，下一步继续承接 Agnes 任务轮询与失败重试。</p>
        </div>
      </header>

      <section class="summary-grid">
        <article v-for="item in summary" :key="item.label" class="summary-card">
          <span class="summary-icon">
            <component :is="item.icon" :size="18" />
          </span>
          <div>
            <span class="summary-label">{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </article>
      </section>

      <section class="table-card">
        <div class="section-head">
          <h3>任务列表</h3>
          <span class="meta-chip">
            <Sparkles :size="14" />
            文本 / 图片 / 视频统一队列视图
          </span>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>任务类型</th>
                <th>状态</th>
                <th>进度</th>
                <th>队列位次</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in taskRows" :key="row.type">
                <td>{{ row.type }}</td>
                <td>
                  <span class="status-pill">{{ row.status }}</span>
                </td>
                <td>{{ row.progress }}</td>
                <td>{{ row.queue }}</td>
              </tr>
            </tbody>
          </table>
        </div>
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
.summary-card,
.table-card {
  border: 1px solid var(--border-subtle);
  border-radius: 24px;
  background: oklch(100% 0.004 92 / 0.9);
  box-shadow: 0 20px 44px oklch(24% 0.016 245 / 0.06);
}

.page-head,
.table-card {
  padding: 20px;
}

.eyebrow,
.status-pill,
.meta-chip {
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
.section-head h3,
.summary-card strong {
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
.summary-label,
th,
td {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.65;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.summary-card {
  display: flex;
  gap: 12px;
  padding: 18px;
}

.summary-icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 12px;
  color: var(--accent-select);
  background: oklch(95% 0.024 252);
  flex-shrink: 0;
}

.summary-label {
  display: block;
  color: var(--text-muted);
  font-size: 12px;
}

.summary-card strong {
  display: block;
  margin-top: 4px;
  font-size: 28px;
}

.section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.meta-chip,
.status-pill {
  color: var(--text-secondary);
  background: var(--bg-panel-subtle);
  border: 1px solid var(--border-subtle);
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

@media (max-width: 960px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .page-head,
  .table-card {
    padding: 16px;
  }

  .page-head h2 {
    max-width: none;
    font-size: clamp(24px, 8vw, 30px);
  }

  .section-head {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-page {
    animation: none;
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
