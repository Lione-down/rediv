<script setup lang="ts">
import axios from 'axios'
import { NAlert, NButton, NForm, NFormItem, NInput } from 'naive-ui'
import type { FormInst, FormItemRule, FormRules } from 'naive-ui'
import { UserPlus } from 'lucide-vue-next'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { resolveAuthRedirect } from '../../../router'
import { useAuthStore } from '../../../store/auth'
import type { RegisterPayload, RegistrationMode } from '../../../types/auth'

type ActiveRegistrationMode = Exclude<RegistrationMode, 'closed'>

const props = defineProps<{
  mode: ActiveRegistrationMode
}>()

const emit = defineEmits<{
  modeMismatch: [mode: RegistrationMode]
}>()

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const formRef = ref<FormInst | null>(null)
const isSubmitting = ref(false)
const hasAttemptedSubmit = ref(false)
const submitError = ref('')
const form = reactive({
  username: '',
  email: '',
  password: '',
  invitationCode: '',
})

const isInviteOnly = computed(() => props.mode === 'invite_only')

function usernameError(value: unknown) {
  const username = typeof value === 'string' ? value.trim() : ''
  if (!username) return '请输入用户名。'
  if (username.length < 3 || username.length > 64) return '用户名需为 3 至 64 个字符。'
  return ''
}

function emailError(value: unknown) {
  const email = typeof value === 'string' ? value.trim() : ''
  if (!email) return ''
  if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return '请输入有效的邮箱地址。'
  }
  return ''
}

function passwordError(value: unknown) {
  const password = typeof value === 'string' ? value : ''
  if (password.length < 8 || !/\p{L}/u.test(password) || !/\p{N}/u.test(password)) {
    return '密码至少 8 位，并同时包含字母和数字。'
  }
  if (new TextEncoder().encode(password).length > 72) {
    return '密码编码后不能超过 72 bytes。'
  }
  return ''
}

function invitationError(value: unknown) {
  if (isInviteOnly.value && (typeof value !== 'string' || !value.trim())) {
    return '请输入邀请码。'
  }
  return ''
}

function formRule(errorForValue: (value: unknown) => string) {
  return (_rule: FormItemRule, value: unknown) => {
    const message = errorForValue(value)
    return message ? new Error(message) : true
  }
}

const rules = computed<FormRules>(() => ({
  username: [{ validator: formRule(usernameError), trigger: ['input', 'blur'] }],
  email: [{ validator: formRule(emailError), trigger: ['input', 'blur'] }],
  password: [{ validator: formRule(passwordError), trigger: ['input', 'blur'] }],
  invitationCode: isInviteOnly.value
    ? [{ validator: formRule(invitationError), trigger: ['input', 'blur'] }]
    : [],
}))

const usernameErrorMessage = computed(() => usernameError(form.username))
const emailErrorMessage = computed(() => emailError(form.email))
const passwordErrorMessage = computed(() => passwordError(form.password))
const invitationErrorMessage = computed(() => invitationError(form.invitationCode))
const isUsernameInvalid = computed(
  () => hasAttemptedSubmit.value && Boolean(usernameErrorMessage.value),
)
const isEmailInvalid = computed(
  () => hasAttemptedSubmit.value && Boolean(emailErrorMessage.value),
)
const isPasswordInvalid = computed(
  () => hasAttemptedSubmit.value && Boolean(passwordErrorMessage.value),
)
const isInvitationInvalid = computed(
  () => hasAttemptedSubmit.value && Boolean(invitationErrorMessage.value),
)

function requestDetail(error: unknown) {
  if (!axios.isAxiosError<{ detail?: unknown }>(error)) return ''
  const detail = error.response?.data?.detail
  return typeof detail === 'string' ? detail : ''
}

function registrationErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) return '暂时无法创建账号，请稍后重试。'
  const detail = requestDetail(error)
  if (detail === 'Password does not meet policy') {
    return '密码至少 8 位，并同时包含字母和数字。'
  }
  if (detail === 'Registration is closed') return '注册现已关闭，请返回登录页。'
  if (detail === 'Invalid invitation code') return '邀请码无效、已过期或已用尽。'
  if (detail === 'Username already exists') {
    return isInviteOnly.value
      ? '该用户名已被使用。请更换用户名；若邀请码无法再次使用，请联系管理员。'
      : '该用户名已被使用，请更换后重试。'
  }
  if (detail === 'Email already exists') {
    return isInviteOnly.value
      ? '该邮箱已绑定其他账号。请直接登录；若邀请码无法再次使用，请联系管理员。'
      : '该邮箱已绑定其他账号，请直接登录或更换邮箱。'
  }
  if (error.code === 'ECONNABORTED') return '注册请求超时，请检查网络后重试。'
  return '暂时无法创建账号，请稍后重试。'
}

async function focusFirstInvalidField() {
  await nextTick()
  if (isUsernameInvalid.value) document.getElementById('register-username')?.focus()
  else if (isEmailInvalid.value) document.getElementById('register-email')?.focus()
  else if (isPasswordInvalid.value) document.getElementById('register-password')?.focus()
  else if (isInvitationInvalid.value) document.getElementById('register-invitation')?.focus()
}

async function handleRegistration() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  hasAttemptedSubmit.value = true
  submitError.value = ''

  try {
    await formRef.value?.validate()
  } catch {
    isSubmitting.value = false
    await focusFirstInvalidField()
    return
  }

  const payload: RegisterPayload = {
    username: form.username.trim(),
    password: form.password,
  }
  if (form.email.trim()) payload.email = form.email.trim()
  if (isInviteOnly.value && form.invitationCode.trim()) {
    payload.invitation_code = form.invitationCode.trim()
  }

  try {
    await authStore.registerWithPassword(payload)
    await router.replace(resolveAuthRedirect(route.query.redirect))
  } catch (error) {
    const detail = requestDetail(error)
    if (detail === 'Registration is closed') emit('modeMismatch', 'closed')
    else if (detail === 'Invalid invitation code') emit('modeMismatch', 'invite_only')
    submitError.value = registrationErrorMessage(error)
  } finally {
    isSubmitting.value = false
  }
}

watch(
  () => [form.username, form.email, form.password, form.invitationCode],
  () => {
    submitError.value = ''
  },
)
</script>

<template>
  <n-form
    ref="formRef"
    class="auth-form"
    :model="form"
    :rules="rules"
    label-placement="top"
    :show-require-mark="false"
    @submit.prevent="handleRegistration"
  >
    <n-alert v-if="submitError" class="form-alert" type="error" title="账号未创建" role="alert">
      {{ submitError }}
    </n-alert>

    <n-alert v-if="isInviteOnly" class="mode-alert" type="info" title="当前为邀请注册">
      请填写有效邀请码。微信入口仅用于已有账号登录。
    </n-alert>

    <n-form-item label="用户名" path="username" :label-props="{ for: 'register-username' }">
      <n-input
        v-model:value="form.username"
        size="large"
        maxlength="64"
        placeholder="3 至 64 个字符"
        :disabled="isSubmitting"
        :input-props="{
          id: 'register-username',
          autocomplete: 'username',
          'aria-required': 'true',
          'aria-invalid': isUsernameInvalid ? 'true' : 'false',
          'aria-errormessage': isUsernameInvalid ? 'register-username-error' : undefined,
        }"
      />
    </n-form-item>
    <span v-if="isUsernameInvalid" id="register-username-error" class="sr-only" role="alert">
      {{ usernameErrorMessage }}
    </span>

    <n-form-item label="邮箱（选填）" path="email" :label-props="{ for: 'register-email' }">
      <n-input
        v-model:value="form.email"
        size="large"
        maxlength="255"
        placeholder="creator@example.com"
        :disabled="isSubmitting"
        :input-props="{
          id: 'register-email',
          autocomplete: 'email',
          inputmode: 'email',
          'aria-invalid': isEmailInvalid ? 'true' : 'false',
          'aria-errormessage': isEmailInvalid ? 'register-email-error' : undefined,
        }"
      />
    </n-form-item>
    <span v-if="isEmailInvalid" id="register-email-error" class="sr-only" role="alert">
      {{ emailErrorMessage }}
    </span>

    <n-form-item label="密码" path="password" :label-props="{ for: 'register-password' }">
      <n-input
        v-model:value="form.password"
        size="large"
        type="password"
        show-password-on="click"
        placeholder="至少 8 位，包含字母和数字"
        :disabled="isSubmitting"
        :input-props="{
          id: 'register-password',
          autocomplete: 'new-password',
          'aria-required': 'true',
          'aria-describedby': 'register-password-hint',
          'aria-invalid': isPasswordInvalid ? 'true' : 'false',
          'aria-errormessage': isPasswordInvalid ? 'register-password-error' : undefined,
        }"
      />
    </n-form-item>
    <span v-if="isPasswordInvalid" id="register-password-error" class="sr-only" role="alert">
      {{ passwordErrorMessage }}
    </span>
    <p id="register-password-hint" class="field-hint">
      不强制特殊符号；UTF-8 编码后最多 72 bytes。
    </p>

    <n-form-item
      v-if="isInviteOnly"
      label="邀请码"
      path="invitationCode"
      :label-props="{ for: 'register-invitation' }"
    >
      <n-input
        v-model:value="form.invitationCode"
        size="large"
        placeholder="输入管理员提供的邀请码"
        :disabled="isSubmitting"
        :input-props="{
          id: 'register-invitation',
          autocomplete: 'one-time-code',
          'aria-required': 'true',
          'aria-invalid': isInvitationInvalid ? 'true' : 'false',
          'aria-errormessage': isInvitationInvalid ? 'register-invitation-error' : undefined,
        }"
      />
    </n-form-item>
    <span
      v-if="isInvitationInvalid"
      id="register-invitation-error"
      class="sr-only"
      role="alert"
    >
      {{ invitationErrorMessage }}
    </span>

    <n-button
      class="primary-action"
      type="primary"
      text-color="#f0eef6"
      size="large"
      block
      attr-type="submit"
      :loading="isSubmitting"
      :disabled="isSubmitting"
    >
      <template #icon>
        <UserPlus :size="18" aria-hidden="true" />
      </template>
      创建账号并进入工作流
    </n-button>
  </n-form>
</template>

<style scoped lang="scss">
.auth-form {
  display: grid;
  margin-top: var(--space-6);
}

.form-alert,
.mode-alert {
  margin-bottom: var(--space-4);
}

.field-hint {
  margin: calc(var(--space-3) * -1) 0 var(--space-4);
  color: var(--auth-text-muted);
  font-size: var(--font-size-hint);
  line-height: 1.6;
}

.primary-action {
  min-height: 44px;
  touch-action: manipulation;
  transition: transform 120ms ease;
}

.primary-action:active {
  transform: scale(0.98);
}

.primary-action:focus-visible {
  outline: 3px solid #a997ec;
  outline-offset: 3px;
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

@media (prefers-reduced-motion: reduce) {
  .primary-action {
    transition: none;
  }

  .primary-action:active {
    transform: none;
  }
}
</style>
