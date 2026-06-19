<script setup lang="ts">
import { computed } from 'vue'
import { ShieldCheck, Sparkles, Users as UsersIcon } from 'lucide-vue-next'
import AdminLayout from './AdminLayout.vue'
import { useAuthStore } from '../../store/auth'

const authStore = useAuthStore()

const summaryCards = computed(() => [
  { label: '总用户', value: '18', meta: '含游客与正式账号', icon: UsersIcon },
  { label: '可生成账号', value: '15', meta: '当前可继续发起生成', icon: Sparkles },
  { label: '管理员', value: authStore.isAdmin ? '1' : '0', meta: '当前环境中的管理身份', icon: ShieldCheck },
])

const userRows = computed(() => [
  {
    id: 'U-001',
    nickname: authStore.user?.nickname ?? 'Admin Mock',
    role: authStore.user?.role === 'admin' ? 'Admin' : 'User',
    status: authStore.user?.status === 'banned' ? '已封禁' : '正常',
    createdAt: '2026-06-12 09:40',
  },
  {
    id: 'U-014',
    nickname: '微信新用户',
    role: 'User',
    status: '待校验',
    createdAt: '2026-06-19 10:24',
  },
  {
    id: 'U-017',
    nickname: '游客转正账号',
    role: 'User',
    status: '正常',
    createdAt: '2026-06-19 14:10',
  },
])
</script>

<template>
  <AdminLayout>
    <section class="admin-page">
      <header class="page-head">
        <div>
          <span class="eyebrow">用户管理</span>
          <h2>先搭出账户状态、角色和注册时间的主表结构。</h2>
          <p>后续联调时直接承接 `/admin/users`、微信身份信息与额度详情。</p>
        </div>
      </header>

      <section class="summary-grid">
        <article v-for="card in summaryCards" :key="card.label" class="summary-card">
          <span class="summary-icon">
            <component :is="card.icon" :size="18" />
          </span>
          <div>
            <span class="summary-label">{{ card.label }}</span>
            <strong>{{ card.value }}</strong>
            <p>{{ card.meta }}</p>
          </div>
        </article>
      </section>

      <section class="table-card">
        <div class="section-head">
          <div>
            <h3>用户列表</h3>
            <span>当前以 3 条 mock 数据承接表头、状态样式和后续接口字段。</span>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>显示名称</th>
                <th>角色</th>
                <th>状态</th>
                <th>注册时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in userRows" :key="row.id">
                <td>
                  <strong>{{ row.nickname }}</strong>
                  <span class="subtle">{{ row.id }}</span>
                </td>
                <td>{{ row.role }}</td>
                <td>
                  <span class="status-pill">{{ row.status }}</span>
                </td>
                <td>{{ row.createdAt }}</td>
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
.status-pill {
  display: inline-flex;
  width: fit-content;
  min-height: 30px;
  align-items: center;
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
.summary-card strong,
tbody strong {
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
.summary-card p,
.section-head span,
tbody td,
.subtle {
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
  gap: 14px;
  padding: 18px;
  transition:
    border-color 120ms ease,
    transform 120ms ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
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

.summary-label,
.subtle {
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

.status-pill {
  color: var(--accent-generate-hover);
  background: oklch(96% 0.022 175);
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
}

@media (prefers-reduced-motion: reduce) {
  .admin-page {
    animation: none;
  }

  .summary-card {
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
