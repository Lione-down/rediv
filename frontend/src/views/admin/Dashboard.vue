<script setup lang="ts">
import AdminLayout from './AdminLayout.vue'

const metrics = [
  ['注册用户', '1'],
  ['今日任务', '0'],
  ['排队任务', '0'],
  ['系统状态', 'ok'],
]
</script>

<template>
  <AdminLayout>
    <h2>平台总览</h2>
    <section class="metric-grid">
      <article v-for="[label, value] in metrics" :key="label">
        <span>{{ label }}</span>
        <strong>{{ value }}</strong>
      </article>
    </section>
  </AdminLayout>
</template>

<style scoped lang="scss">
h2 {
  margin: 0 0 18px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

article {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 18px;
  background: var(--bg-panel);
}

span {
  display: block;
  color: var(--text-muted);
  font-size: 13px;
}

strong {
  display: block;
  margin-top: 10px;
  font-size: 28px;
}
</style>
