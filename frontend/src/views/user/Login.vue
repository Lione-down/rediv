<script setup lang="ts">
import axios from 'axios'
import {
  NAlert,
  NButton,
  NDivider,
  NForm,
  NFormItem,
  NInput,
  NSpin,
} from 'naive-ui'
import type { FormInst, FormItemRule, FormRules } from 'naive-ui'
import { Compass, LogIn, MessageCircle, RotateCw } from 'lucide-vue-next'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { resolveAuthRedirect } from '../../router'
import { useAuthStore } from '../../store/auth'
import AuthShell from './components/AuthShell.vue'

type LoginAction = 'password' | 'wechat' | 'guest'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const formRef = ref<FormInst | null>(null)
const activeAction = ref<LoginAction | null>(null)
const submitError = ref('')
const settingsError = ref('')
const hasAttemptedSubmit = ref(false)
const form = reactive({
  identifier: '',
  password: '',
})

const isBusy = computed(() => activeAction.value !== null)
const authDestination = computed(() => resolveAuthRedirect(route.query.redirect))
const registerLocation = computed(() => ({
  name: 'register',
  query: { redirect: authDestination.value },
}))
const isIdentifierInvalid = computed(
  () => hasAttemptedSubmit.value && !form.identifier.trim(),
)
const isPasswordInvalid = computed(
  () => hasAttemptedSubmit.value && !form.password,
)

function validateIdentifier(_rule: FormItemRule, value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return new Error('请输入用户名或邮箱。')
  }

  return true
}

const rules: FormRules = {
  identifier: [
    {
      validator: validateIdentifier,
      trigger: ['input', 'blur'],
    },
  ],
  password: [
    {
      required: true,
      message: '请输入密码。',
      trigger: ['input', 'blur'],
    },
  ],
}

function requestDetail(error: unknown) {
  if (!axios.isAxiosError<{ detail?: unknown }>(error)) {
    return ''
  }

  const detail = error.response?.data?.detail
  return typeof detail === 'string' ? detail : ''
}

function loginErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return '暂时无法登录，请稍后重试。'
  }

  if (error.response?.status === 401) {
    return '账号或密码不正确，请重新输入。'
  }

  if (error.response?.status === 403 && requestDetail(error) === 'User is banned') {
    return '此账号已被停用，请联系管理员。'
  }

  if (error.code === 'ECONNABORTED') {
    return '登录请求超时，请检查网络后重试。'
  }

  return '暂时无法登录，请稍后重试。'
}

function alternateEntryError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
    return '请求超时，请稍后重试。'
  }

  return fallback
}

async function loadSettings(force = false) {
  settingsError.value = ''

  try {
    await authStore.loadRegistrationSettings(force)
  } catch (error) {
    settingsError.value = alternateEntryError(error, '暂时无法读取注册和微信登录状态。')
  }
}

async function handlePasswordLogin() {
  if (isBusy.value) {
    return
  }

  activeAction.value = 'password'
  submitError.value = ''
  hasAttemptedSubmit.value = true

  try {
    await formRef.value?.validate()
  } catch {
    activeAction.value = null
    await nextTick()
    if (isIdentifierInvalid.value) {
      document.getElementById('login-identifier')?.focus()
    } else if (isPasswordInvalid.value) {
      document.getElementById('login-password')?.focus()
    }
    return
  }

  try {
    await authStore.loginWithPassword({
      identifier: form.identifier.trim(),
      password: form.password,
    })
    await router.replace(authDestination.value)
  } catch (error) {
    submitError.value = loginErrorMessage(error)
  } finally {
    activeAction.value = null
  }
}

async function handleWechatLogin() {
  if (isBusy.value) {
    return
  }

  activeAction.value = 'wechat'
  submitError.value = ''

  try {
    await authStore.loginWithWechat(authDestination.value)
  } catch (error) {
    submitError.value = alternateEntryError(error, '微信登录暂时不可用，请稍后重试。')
    activeAction.value = null
  }
}

async function handleGuestEntry() {
  if (isBusy.value) {
    return
  }

  if (authStore.token || authStore.user || authStore.isRestoringSession) {
    submitError.value = '当前已有账号会话，请先退出账号后再使用游客浏览。'
    return
  }

  activeAction.value = 'guest'
  submitError.value = ''

  try {
    await authStore.startGuestSession()
    await router.replace({ name: 'home' })
  } catch (error) {
    submitError.value = alternateEntryError(error, '游客浏览暂时不可用，请稍后重试。')
  } finally {
    activeAction.value = null
  }
}

watch(
  () => [form.identifier, form.password],
  () => {
    submitError.value = ''
  },
)

onMounted(() => {
  void loadSettings()
})
</script>

<template>
  <AuthShell
    eyebrow="欢迎回来"
    title="登录 Revid"
    description="使用用户名或邮箱继续你的创作工作流。"
  >
    <n-form
      ref="formRef"
      class="auth-form"
      :model="form"
      :rules="rules"
      label-placement="top"
      :show-require-mark="false"
      @submit.prevent="handlePasswordLogin"
    >
      <n-alert
        v-if="submitError"
        class="form-alert"
        type="error"
        title="登录未完成"
        role="alert"
      >
        {{ submitError }}
      </n-alert>

      <n-form-item
        label="用户名或邮箱"
        path="identifier"
        :label-props="{ for: 'login-identifier' }"
      >
        <n-input
          v-model:value="form.identifier"
          size="large"
          maxlength="255"
          placeholder="creator 或 creator@example.com"
          :disabled="isBusy"
          :input-props="{
            id: 'login-identifier',
            autocomplete: 'username',
            'aria-required': 'true',
            'aria-invalid': isIdentifierInvalid ? 'true' : 'false',
            'aria-errormessage': isIdentifierInvalid ? 'login-identifier-error' : undefined,
          }"
        />
      </n-form-item>
      <span
        v-if="isIdentifierInvalid"
        id="login-identifier-error"
        class="sr-only"
        role="alert"
      >
        请输入用户名或邮箱。
      </span>

      <n-form-item label="密码" path="password" :label-props="{ for: 'login-password' }">
        <n-input
          v-model:value="form.password"
          size="large"
          type="password"
          show-password-on="click"
          placeholder="输入你的密码"
          :disabled="isBusy"
          :input-props="{
            id: 'login-password',
            autocomplete: 'current-password',
            'aria-required': 'true',
            'aria-invalid': isPasswordInvalid ? 'true' : 'false',
            'aria-errormessage': isPasswordInvalid ? 'login-password-error' : undefined,
          }"
        />
      </n-form-item>
      <span v-if="isPasswordInvalid" id="login-password-error" class="sr-only" role="alert">
        请输入密码。
      </span>

      <n-button
        class="primary-action"
        type="primary"
        text-color="#f0eef6"
        size="large"
        block
        attr-type="submit"
        :loading="activeAction === 'password'"
        :disabled="isBusy"
      >
        <template #icon>
          <LogIn :size="18" aria-hidden="true" />
        </template>
        登录并进入工作流
      </n-button>
    </n-form>

    <n-divider class="auth-divider">其他方式</n-divider>

    <div class="provider-stack">
      <n-button
        v-if="authStore.registrationSettings && authStore.isWechatLoginEnabled"
        class="provider-action"
        size="large"
        block
        :loading="activeAction === 'wechat'"
        :disabled="isBusy"
        @click="handleWechatLogin"
      >
        <template #icon>
          <MessageCircle :size="18" aria-hidden="true" />
        </template>
        使用已有微信账号登录
      </n-button>

      <n-button
        class="provider-action"
        size="large"
        block
        :loading="activeAction === 'guest'"
        :disabled="isBusy"
        @click="handleGuestEntry"
      >
        <template #icon>
          <Compass :size="18" aria-hidden="true" />
        </template>
        以游客身份浏览
      </n-button>
    </div>

    <n-alert
      v-if="settingsError"
      class="settings-alert"
      type="warning"
      title="部分登录方式未加载"
    >
      {{ settingsError }}
    </n-alert>

    <template #footer>
      <div class="registration-status" aria-live="polite">
        <span v-if="authStore.isLoadingRegistrationSettings" class="settings-loading">
          <n-spin size="small" />
          正在确认可用登录方式
        </span>

        <template v-else-if="authStore.registrationSettings">
          <span v-if="authStore.canRegister">
            还没有账号？
            <RouterLink class="inline-link" :to="registerLocation">创建账号</RouterLink>
          </span>
          <span v-else>注册暂未开放，已有账号仍可登录。</span>
        </template>

        <span v-else class="settings-retry">
          暂时无法确认注册状态。
          <n-button
            class="settings-retry-action"
            text
            :disabled="isBusy"
            @click="loadSettings(true)"
          >
            <RotateCw :size="14" aria-hidden="true" />
            重试
          </n-button>
        </span>
      </div>
    </template>
  </AuthShell>
</template>

<style scoped lang="scss">
.auth-form {
  display: grid;
  margin-top: var(--space-6);
}

.form-alert {
  margin-bottom: var(--space-4);
}

.primary-action,
.provider-action {
  min-height: 44px;
  transition: transform 120ms ease;
  touch-action: manipulation;
}

.primary-action:focus-visible,
.provider-action:focus-visible,
.settings-retry-action:focus-visible {
  outline: 3px solid #a997ec;
  outline-offset: 3px;
}

.primary-action:active,
.provider-action:active {
  transform: scale(0.98);
}

.auth-divider {
  margin: var(--space-6) 0 var(--space-4);
  color: var(--auth-text-muted);
  font-size: var(--font-size-hint);
}

.provider-stack {
  display: grid;
  gap: var(--space-3);
}

.settings-alert {
  margin-top: var(--space-4);
}

.registration-status,
.settings-loading,
.settings-retry {
  display: flex;
  align-items: center;
}

.settings-retry-action {
  min-height: 40px;
}

.registration-status {
  min-height: 40px;
  justify-content: center;
  color: var(--auth-text-secondary);
  font-size: 13px;
  line-height: 1.6;
  text-align: center;
}

.settings-loading,
.settings-retry {
  justify-content: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.inline-link {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  margin: -8px 0;
  color: #b8a8ee;
  font-weight: 600;
}

.inline-link:focus-visible {
  outline: 3px solid #a997ec;
  outline-offset: 3px;
  border-radius: var(--radius-xs);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (hover: hover) {
  .inline-link:hover {
    color: #c7bcf2;
  }
}

@media (prefers-reduced-motion: reduce) {
  .primary-action,
  .provider-action {
    transition: none;
  }

  .primary-action:active,
  .provider-action:active {
    transform: none;
  }
}
</style>
