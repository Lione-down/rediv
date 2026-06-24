<script setup lang="ts">
import { ref } from 'vue'
import { useDialog, useLoadingBar, useMessage, useNotification } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { NButton, NInput, NSelect } from 'naive-ui'

// Top-level composable calls — APIs obtained once at setup, reused in handlers.
const dialog = useDialog()
const message = useMessage()
const notification = useNotification()
const loadingBar = useLoadingBar()

const loadingRef = ref(false)

const selectOptions: SelectOption[] = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
]

function triggerMessage() {
  message.info('This is an info message')
  message.success('Operation completed successfully')
  message.warning('Please check your input')
  message.error('Something went wrong')
}

function triggerDialog() {
  dialog.info({
    title: 'Test Dialog',
    content: 'This dialog was triggered from the smoke test page.',
    positiveText: 'OK',
    onPositiveClick: () => {
      dialog.warning({
        title: 'Warning',
        content: 'Secondary dialog triggered from first click.',
      })
    },
  })
}

function triggerNotification() {
  notification.info({
    title: 'Info Notification',
    content: 'This notification appeared from the smoke test.',
    duration: 3000,
  })
  notification.success({
    title: 'Success Notification',
    content: 'Another notification to verify stacking.',
    duration: 3000,
  })
}

function toggleLoading() {
  if (!loadingRef.value) {
    loadingRef.value = true
    loadingBar.start()
    setTimeout(() => {
      loadingRef.value = false
      loadingBar.finish()
    }, 2000)
  } else {
    loadingRef.value = false
    loadingBar.finish()
  }
}
</script>

<template>
  <div class="smoke-test-page">
    <header class="smoke-header">
      <h1>T4-006 Provider Smoke Test</h1>
      <p>Click buttons below to trigger each provider. Verify dark theme, focus rings, and no overflow.</p>
    </header>

    <section class="test-controls">
      <h2>Trigger Providers</h2>
      <div class="button-row">
        <n-button type="primary" @click="triggerMessage">
          Trigger Message
        </n-button>
        <n-button type="primary" @click="triggerDialog">
          Trigger Dialog
        </n-button>
        <n-button type="primary" @click="triggerNotification">
          Trigger Notification
        </n-button>
        <n-button type="primary" @click="toggleLoading">
          Toggle Loading Bar
        </n-button>
      </div>
    </section>

    <section class="verification-checklist">
      <h2>Verification Checklist</h2>
      <ul>
        <li>[ ] Dark theme active on all panels</li>
        <li>[ ] Message appears top-right with dark background</li>
        <li>[ ] Dialog modal renders with dark overlay</li>
        <li>[ ] Notification appears top-right, stacked properly</li>
        <li>[ ] Loading bar appears at top of viewport</li>
        <li>[ ] Focus-visible ring visible on all buttons</li>
        <li>[ ] No horizontal overflow (scrollWidth === clientWidth)</li>
        <li>[ ] Console has 0 errors</li>
      </ul>
    </section>

    <section class="focus-test">
      <h2>Focus Ring Test</h2>
      <p>Tab through these inputs to verify focus-visible rings:</p>
      <div class="input-row">
        <n-input placeholder="Focus me — check ring" />
        <n-input placeholder="Another input for focus test" />
        <n-select placeholder="Select an option" :options="selectOptions" />
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.smoke-test-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 24px;
  color: var(--text-primary);
}

.smoke-header {
  margin-bottom: 32px;

  h1 {
    font-size: 24px;
    font-weight: 650;
    margin: 0 0 8px;
  }

  p {
    color: var(--text-secondary);
    font-size: 14px;
    margin: 0;
  }
}

.test-controls {
  margin-bottom: 32px;

  h2 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 16px;
  }

  .button-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
}

.verification-checklist {
  margin-bottom: 32px;
  padding: 20px;
  border: 1px solid rgba(240, 238, 246, 0.10);
  border-radius: 8px;
  background: rgba(240, 238, 246, 0.03);

  h2 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 12px;
  }

  ul {
    margin: 0;
    padding-left: 20px;
    list-style: none;

    li {
      padding: 4px 0;
      font-size: 14px;
      color: var(--text-secondary);
    }
  }
}

.focus-test {
  h2 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0 0 16px;
  }

  .input-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
}
</style>
