<template>
  <div class="bg-white rounded-card p-4 shadow-card">
    <div class="flex justify-center gap-3">
      <button
        @click="emit('update:modelValue', 'piano')"
        :class="[
          'px-5 py-2.5 rounded-pill font-medium transition-all duration-200',
          modelValue === 'piano'
            ? 'text-white shadow-card'
            : 'text-secondary hover:bg-gray-100'
        ]"
        :style="modelValue === 'piano' ? { backgroundColor: '#111111' } : {}"
      >
        {{ isZh ? '🎹 钢琴' : '🎹 Piano' }}
      </button>
      <button
        @click="emit('update:modelValue', 'guitar')"
        :class="[
          'px-5 py-2.5 rounded-pill font-medium transition-all duration-200',
          modelValue === 'guitar'
            ? 'text-white shadow-card'
            : 'text-secondary hover:bg-gray-100'
        ]"
        :style="modelValue === 'guitar' ? { backgroundColor: '#111111' } : {}"
      >
        {{ isZh ? '🎸 吉他' : '🎸 Guitar' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';

const props = defineProps<{
  modelValue: 'piano' | 'guitar';
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: 'piano' | 'guitar'): void;
}>();

// 从父组件获取语言设置
const locale = inject<{ value: 'en' | 'zh' }>('locale');
const isZh = locale?.value === 'zh';
</script>
