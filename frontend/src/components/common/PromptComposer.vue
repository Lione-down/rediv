<script setup lang="ts">
import { ref } from 'vue'
import { Image, Send, WandSparkles } from '@lucide/vue'
import { useAnimeMotion } from '../../composables/useAnimeMotion'

const prompt = ref('')
const { press } = useAnimeMotion()
</script>

<template>
  <section class="composer" aria-label="快速创作入口">
    <label for="home-prompt">从一个想法开始</label>
    <div class="composer-box">
      <textarea
        id="home-prompt"
        v-model="prompt"
        placeholder="写一个角色、场景，或直接描述你想生成的视频..."
        rows="4"
      />
      <div class="composer-actions">
        <button class="ghost focus-ring" type="button" aria-label="添加图片参考">
          <Image :size="18" />
          图片参考
        </button>
        <button class="ghost focus-ring" type="button" aria-label="润色提示词">
          <WandSparkles :size="18" />
          润色
        </button>
        <RouterLink
          class="send focus-ring"
          to="/app/workspace"
          aria-label="进入工作流"
          @click="press('.send')"
        >
          <Send :size="18" />
          进入工作流
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.composer {
  width: min(760px, 100%);
}

label {
  display: block;
  margin-bottom: 10px;
  color: var(--text-secondary);
  font-size: 14px;
}

.composer-box {
  padding: 14px;
  border: 1px solid oklch(100% 0.004 92 / 0.2);
  border-radius: 20px;
  background: oklch(18% 0.014 245);
  box-shadow: 0 24px 80px oklch(18% 0.014 245 / 0.18);
}

textarea {
  width: 100%;
  min-height: 108px;
  resize: vertical;
  border: 0;
  outline: 0;
  color: white;
  background: transparent;
  font-size: 16px;
  line-height: 1.65;
}

textarea::placeholder {
  color: oklch(78% 0.015 245);
}

.composer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
  padding-top: 12px;
}

button,
.send {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: var(--radius-md);
  padding: 0 14px;
}

.ghost {
  color: oklch(86% 0.012 245);
  background: oklch(100% 0.004 92 / 0.08);
}

.send {
  color: white;
  background: var(--accent-generate);
  font-weight: 650;
}

@media (max-width: 560px) {
  .send {
    width: 100%;
    justify-content: center;
  }
}
</style>
