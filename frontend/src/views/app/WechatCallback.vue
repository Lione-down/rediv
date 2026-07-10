<script setup lang="ts">
import { onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import { resolveAuthRedirect } from '../../router'
import { useAuthStore } from '../../store/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const message = useMessage()

function readQueryValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : ''
}

onMounted(async () => {
  const code = readQueryValue(route.query.code)
  const state = readQueryValue(route.query.state)
  const invitationCode = readQueryValue(route.query.invitation_code)
  const expectedState = sessionStorage.getItem('revid_wechat_state') || ''
  const intendedRedirect = resolveAuthRedirect(
    authStore.getPendingWechatRedirect() || route.query.redirect,
  )
  const loginLocation = {
    name: 'login',
    query: { redirect: intendedRedirect },
  }

  if (!code) {
    message.error('缺少微信授权 code，请重新发起登录。')
    await router.replace(loginLocation)
    return
  }

  if (!expectedState || expectedState !== state) {
    message.error('登录状态校验失败，请重新发起微信登录。')
    await router.replace(loginLocation)
    return
  }

  try {
    const completion = await authStore.completeWechatLogin(
      code,
      state || undefined,
      invitationCode || undefined,
    )
    if (!completion.isApplied) {
      return
    }

    message.success('微信登录成功，正在进入工作流。')
    await router.replace(resolveAuthRedirect(completion.redirectPath || intendedRedirect))
  } catch (error) {
    if (!authStore.isWechatLoginAttemptCurrent(state)) {
      return
    }

    let detail = '微信登录失败，请稍后重试。'
    if (typeof error === 'object' && error && 'response' in error) {
      const response = (error as { response?: { data?: { detail?: unknown } } }).response
      if (typeof response?.data?.detail === 'string' && response.data.detail.trim()) {
        detail = response.data.detail
      }
    }
    message.error(detail)
    await router.replace(loginLocation)
  }
})
</script>

<template>
  <main class="callback-page">
    <p>正在完成微信登录并同步账户信息...</p>
  </main>
</template>

<style scoped>
.callback-page {
  display: grid;
  min-height: 100dvh;
  place-items: center;
  color: var(--text-secondary);
}
</style>
