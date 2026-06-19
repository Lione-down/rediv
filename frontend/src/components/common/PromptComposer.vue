<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Image, Send, WandSparkles } from 'lucide-vue-next'

const prompt = ref('')

const entryChips = [
  '从一句故事开始',
  '补一张角色参考图',
  '整理视频草稿结构',
]
</script>

<template>
  <section class="composer" aria-label="快速创作入口">
    <div class="composer-head">
      <div class="composer-copy">
        <p class="composer-kicker">Prompt Composer</p>
        <h2>从一个想法开始，先把创作入口写清楚。</h2>
        <p class="composer-hint">
          你可以先描述角色、场景、镜头目标，再补充图片参考或润色，让后续生成结果直接回流到工作流里。
        </p>
      </div>
      <div class="composer-plus" aria-hidden="true">+</div>
    </div>

    <div class="composer-entry-row" aria-label="推荐起点">
      <button v-for="chip in entryChips" :key="chip" class="entry-chip focus-ring" type="button">
        {{ chip }}
      </button>
    </div>

    <div class="composer-box">
      <label for="home-prompt">输入你的创作目标</label>
      <textarea
        id="home-prompt"
        v-model="prompt"
        placeholder="例如：写一支 20 秒短片，场景是雨夜车站，主角在荧光路牌下停住，镜头从远景推到特写。"
        rows="6"
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
        <RouterLink class="send focus-ring" to="/app/workspace" aria-label="进入工作流">
          <Send :size="18" />
          进入工作流
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.composer {
  height: 100%;
  padding: 12px;
  border-radius: 24px;
  color: white;
  background:
    radial-gradient(circle at top right, oklch(70% 0.08 175 / 0.16), transparent 24%),
    linear-gradient(180deg, oklch(23% 0.018 245), oklch(17% 0.012 245));
  border: 1px solid oklch(100% 0.004 92 / 0.12);
  box-shadow: 0 26px 72px oklch(10% 0.02 245 / 0.24);
  display: grid;
  gap: 14px;
}

.composer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 12px 4px;
}

.composer-copy h2,
.composer-copy p {
  margin: 0;
}

.composer-kicker {
  display: inline-flex;
  width: fit-content;
  margin-bottom: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  color: oklch(92% 0.02 175 / 0.9);
  background: oklch(100% 0.004 92 / 0.08);
  border: 1px solid oklch(100% 0.004 92 / 0.1);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.composer-copy h2 {
  font-size: 24px;
  line-height: 1.3;
  letter-spacing: -0.02em;
}

.composer-hint {
  margin-top: 10px;
  color: oklch(86% 0.012 245 / 0.78);
  font-size: 13px;
  line-height: 1.7;
}

.composer-plus {
  width: 52px;
  height: 64px;
  flex: 0 0 auto;
  border-radius: 16px;
  display: grid;
  place-items: center;
  color: oklch(83% 0.01 245 / 0.78);
  background: linear-gradient(180deg, oklch(100% 0.003 92 / 0.14), oklch(100% 0.003 92 / 0.05));
  border: 1px solid oklch(100% 0.004 92 / 0.12);
  transform: rotate(-8deg);
  font-size: 28px;
}

.composer-entry-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 0 12px;
}

.entry-chip,
.ghost,
.send {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 14px;
  padding: 0 14px;
  transition:
    color 120ms ease,
    background-color 120ms ease,
    box-shadow 120ms ease,
    transform 120ms ease;
}

.entry-chip:active,
.ghost:active,
.send:active {
  transform: scale(0.96);
}

.entry-chip {
  color: oklch(90% 0.012 245);
  background: oklch(100% 0.004 92 / 0.07);
  border: 1px solid oklch(100% 0.004 92 / 0.08);
}

.entry-chip:hover,
.ghost:hover {
  background: oklch(100% 0.004 92 / 0.12);
}

.composer-box {
  margin: 0 4px 4px;
  padding: 16px;
  border-radius: 22px;
  background: oklch(19% 0.012 245 / 0.9);
  border: 1px solid oklch(100% 0.004 92 / 0.08);
  display: grid;
  gap: 12px;
}

label {
  color: oklch(84% 0.012 245 / 0.78);
  font-size: 12px;
}

textarea {
  width: 100%;
  min-height: 180px;
  resize: vertical;
  border: 0;
  outline: 0;
  padding: 0;
  color: white;
  background: transparent;
  font-size: 15px;
  line-height: 1.7;
}

textarea::placeholder {
  color: oklch(74% 0.01 245 / 0.74);
}

.composer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.ghost {
  color: oklch(90% 0.012 245);
  background: oklch(100% 0.004 92 / 0.06);
  border: 1px solid oklch(100% 0.004 92 / 0.08);
}

.send {
  color: white;
  background: var(--accent-generate);
  box-shadow: 0 12px 24px oklch(62% 0.105 175 / 0.18);
  font-weight: 650;
}

.send:hover {
  background: var(--accent-generate-hover);
}

@media (max-width: 860px) {
  .composer {
    padding: 10px;
  }

  .composer-head {
    padding: 10px 10px 2px;
  }

  .composer-copy h2 {
    font-size: 20px;
  }
}

@media (max-width: 560px) {
  .composer-head {
    flex-direction: column;
  }

  .composer-plus {
    display: none;
  }

  .composer-box {
    padding: 14px;
  }

  .composer-actions > * {
    width: 100%;
  }
}
</style>
