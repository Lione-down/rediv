<script setup lang="ts">
import { computed } from 'vue'
import { Database, Image as ImageIcon, Sparkles, Video } from 'lucide-vue-next'
import AdminLayout from './AdminLayout.vue'
import { useAssetStore } from '../../store/assets'

const assetStore = useAssetStore()

const assetRows = computed(() => [
  {
    type: 'image',
    name: assetStore.items[1]?.content_text ?? '角色参考图',
    source: 'upload',
    status: 'active',
  },
  {
    type: 'prompt',
    name: assetStore.items[0]?.content_text ?? '雨夜旧车站',
    source: 'generation',
    status: 'active',
  },
  {
    type: 'video',
    name: '预告片结果占位',
    source: 'generation',
    status: 'queued',
  },
])

const typeCards = [
  { label: '图片资产', value: '12', icon: ImageIcon },
  { label: 'Prompt 资产', value: '9', icon: Sparkles },
  { label: '视频资产', value: '4', icon: Video },
]
</script>

<template>
  <AdminLayout>
    <section class="admin-page">
      <header class="page-head">
        <div>
          <span class="eyebrow">资产管理</span>
          <h2>让上传资产、生成结果和状态治理先共用一套可筛查的列表骨架。</h2>
          <p>当前字段聚焦类型、名称、来源和状态，便于下一步直接接入真实资产接口。</p>
        </div>
      </header>

      <section class="stats-grid">
        <article v-for="item in typeCards" :key="item.label" class="stats-card">
          <span class="stats-icon">
            <component :is="item.icon" :size="18" />
          </span>
          <div>
            <span class="stats-label">{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </article>
      </section>

      <section class="table-card">
        <div class="section-head">
          <div>
            <h3>资产列表</h3>
            <span>列表结构已对齐后端资产模型中的常用管理字段。</span>
          </div>
          <span class="meta-chip">
            <Database :size="14" />
            当前 store {{ assetStore.items.length }} 项
          </span>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>资产类型</th>
                <th>名称</th>
                <th>来源</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in assetRows" :key="`${row.type}-${row.name}`">
                <td>{{ row.type }}</td>
                <td>{{ row.name }}</td>
                <td>{{ row.source }}</td>
                <td>
                  <span class="status-pill">{{ row.status }}</span>
                </td>
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
.stats-card,
.table-card {
  border: 1px solid var(--border-subtle);
  border-radius: 24px;
  background: var(--v2-surface-1);
  box-shadow: none;
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
  background: var(--v2-accent-soft);
}

.page-head h2,
.section-head h3,
.stats-card strong {
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
td {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.65;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.stats-card {
  display: flex;
  gap: 12px;
  padding: 18px;
  transition:
    border-color 120ms ease,
    transform 120ms ease;
}

.stats-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
}

.stats-icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 12px;
  color: var(--accent-select);
  background: var(--v2-accent-soft);
  flex-shrink: 0;
}

.stats-label {
  display: block;
  color: var(--text-muted);
  font-size: 12px;
}

.stats-card strong {
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

.meta-chip {
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

.status-pill {
  color: var(--text-secondary);
  background: var(--bg-panel-subtle);
  border: 1px solid var(--border-subtle);
}

@media (max-width: 960px) {
  .stats-grid {
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

  .stats-card {
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
