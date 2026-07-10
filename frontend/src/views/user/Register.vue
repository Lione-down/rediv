<script setup lang="ts">
import axios from 'axios'
import { NAlert, NButton, NSpin } from 'naive-ui'
import { ArrowLeft, RotateCw } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { resolveAuthRedirect } from '../../router'
import { useAuthStore } from '../../store/auth'
import type { RegistrationMode } from '../../types/auth'
import AuthShell from './components/AuthShell.vue'
import RegisterForm from './components/RegisterForm.vue'

type ActiveRegistrationMode = Exclude<RegistrationMode, 'closed'>

const authStore = useAuthStore()
const route = useRoute()
const settingsError = ref('')
const loginLocation = computed(() => ({
  name: 'login',
  query: { redirect: resolveAuthRedirect(route.query.redirect) },
}))
const registrationMode = computed(() => authStore.registrationSettings?.registration_mode ?? null)
const activeRegistrationMode = computed<ActiveRegistrationMode | null>(() => {
  if (registrationMode.value === 'open' || registrationMode.value === 'invite_only') {
    return registrationMode.value
  }

  return null
})

async function loadSettings(force = false) {
  settingsError.value = ''

  try {
    await authStore.loadRegistrationSettings(force)
  } catch (error) {
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      settingsError.value = '注册状态请求超时，请稍后重试。'
      return
    }

    settingsError.value = '暂时无法确认注册状态，请稍后重试。'
  }
}

function applyServerRegistrationMode(mode: RegistrationMode) {
  authStore.overrideRegistrationMode(mode)
  void loadSettings(true)
}

onMounted(() => {
  void loadSettings(true)
})
</script>

<template>
  <AuthShell
    eyebrow="创建账号"
    title="开始新的创作流"
    description="建立你的 Revid 账号，让项目、素材和生成记录持续保存。"
    :show-footer="registrationMode !== 'closed'"
  >
    <div
      v-if="authStore.isLoadingRegistrationSettings && !authStore.registrationSettings"
      class="registration-state"
      aria-live="polite"
    >
      <n-spin size="medium" />
      <strong>正在确认注册方式</strong>
      <span>加载完成后会显示当前可用的注册入口。</span>
    </div>

    <div v-else-if="settingsError && !authStore.registrationSettings" class="registration-state">
      <n-alert type="warning" title="注册状态未加载" role="alert">
        {{ settingsError }}
      </n-alert>
      <n-button class="state-action" size="large" @click="loadSettings(true)">
        <template #icon>
          <RotateCw :size="17" aria-hidden="true" />
        </template>
        重新加载
      </n-button>
    </div>

    <div v-else-if="registrationMode === 'closed'" class="registration-state is-closed">
      <n-alert type="warning" title="注册暂未开放">
        当前只能使用已有账号登录。注册重新开放后，可在这里创建账号。
      </n-alert>
      <RouterLink class="back-link" :to="loginLocation">
        <ArrowLeft :size="17" aria-hidden="true" />
        返回登录
      </RouterLink>
    </div>

    <div v-else-if="registrationMode && !activeRegistrationMode" class="registration-state">
      <n-alert type="error" title="注册配置暂不可用" role="alert">
        后端返回了无法识别的注册方式。请重新加载，或稍后再试。
      </n-alert>
      <n-button class="state-action" size="large" @click="loadSettings(true)">
        <template #icon>
          <RotateCw :size="17" aria-hidden="true" />
        </template>
        重新加载
      </n-button>
    </div>

    <RegisterForm
      v-else-if="activeRegistrationMode"
      :mode="activeRegistrationMode"
      @mode-mismatch="applyServerRegistrationMode"
    />

    <template #footer>
      <p class="login-entry">
        已有账号？
        <RouterLink class="inline-link" :to="loginLocation">返回登录</RouterLink>
      </p>
    </template>
  </AuthShell>
</template>

<style scoped lang="scss">
.registration-state {
  display: grid;
  justify-items: center;
  gap: var(--space-4);
  min-height: 248px;
  align-content: center;
  margin-top: var(--space-6);
  color: var(--auth-text-secondary);
  text-align: center;
}

.registration-state > strong {
  color: var(--auth-text);
  font-size: 15px;
}

.registration-state > span {
  max-width: 300px;
  font-size: 13px;
  line-height: 1.7;
}

.registration-state :deep(.n-alert) {
  width: 100%;
  text-align: left;
}

.state-action,
.back-link {
  min-width: 148px;
  min-height: 44px;
  touch-action: manipulation;
  transition: transform 120ms ease;
}

.state-action:active,
.back-link:active {
  transform: scale(0.98);
}

.state-action:focus-visible,
.back-link:focus-visible,
.inline-link:focus-visible {
  outline: 3px solid #a997ec;
  outline-offset: 3px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: 0 var(--space-4);
  border: 1px solid var(--auth-border-strong);
  border-radius: var(--radius-md);
  color: var(--auth-text);
  background: rgba(240, 238, 246, 0.05);
}

.login-entry {
  min-height: 40px;
  margin: 0;
  color: var(--auth-text-secondary);
  font-size: 13px;
  line-height: 40px;
  text-align: center;
}

.inline-link {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  margin: -8px 0;
  border-radius: var(--radius-xs);
  color: #c7bcf2;
  font-weight: 600;
}

@media (hover: hover) {
  .back-link:hover {
    background: rgba(240, 238, 246, 0.09);
  }

  .inline-link:hover {
    color: #d5ccf6;
  }
}

@media (prefers-reduced-motion: reduce) {
  .state-action,
  .back-link {
    transition: none;
  }

  .state-action:active,
  .back-link:active {
    transform: none;
  }
}
</style>
