<template>
  <div class="bg-white rounded-card p-4 shadow-card">
    <div class="flex items-center justify-center gap-6">
      <span class="text-sm font-medium" style="color: #666666;">{{ isZh ? '速度' : 'Speed' }}</span>
      <input
        type="range"
        min="100"
        max="200"
        :value="modelValue"
        @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
        class="w-32"
        style="accent-color: #111111;"
      />
      <span class="font-semibold min-w-[3rem] text-base" style="color: #111111;">{{ modelValue }}</span>
    </div>

    <!-- 分隔线 -->
    <div class="border-t my-4" style="border-color: #EAEAEA;"></div>

    <div class="flex justify-center gap-4">
      <button
        @click="emit('toggle-play')"
        class="px-8 py-3 rounded-pill font-medium text-base transition-all duration-200"
        :style="isPlaying 
          ? { backgroundColor: '#FF3B30', color: 'white' } 
          : { backgroundColor: '#34C759', color: 'white' }"
      >
        <span class="flex items-center gap-2">
          <svg v-if="isPlaying" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
          <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <polygon points="5,3 19,12 5,21"></polygon>
          </svg>
          {{ isPlaying ? (isZh ? '停止' : 'Stop') : (isZh ? '播放' : 'Play') }}
        </span>
      </button>

      <button
        @click="emit('export')"
        class="px-6 py-3 rounded-pill font-medium text-base transition-all duration-200"
        style="background-color: #EAEAEA; color: #666666;"
      >
        <span class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          {{ isZh ? '保存' : 'Save' }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, computed } from 'vue';

const props = defineProps<{
  modelValue: number;
  isPlaying: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
  (e: 'toggle-play'): void;
  (e: 'export'): void;
}>();

// 从父组件获取语言设置
const locale = inject<{ value: 'en' | 'zh' }>('locale');
const isZh = computed(() => locale?.value === 'zh');
</script>
