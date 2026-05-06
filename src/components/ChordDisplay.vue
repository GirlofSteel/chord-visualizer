<template>
  <div class="w-full max-w-2xl mx-auto mb-6">
    <div v-if="chords.length === 0" class="text-center text-gray-500 py-8">
      请在上方输入和弦序列
    </div>
    <div v-else class="flex flex-wrap justify-center gap-3">
      <button
        v-for="(chord, index) in chords"
        :key="`${chord}-${index}`"
        @click="$emit('click', chord, index)"
        class="
          px-6 py-3 rounded-xl font-semibold text-lg
          transition-all duration-300 transform
          hover:scale-105 active:scale-95
          {{ index === currentIndex
            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/50 scale-110'
            : 'bg-gray-800/70 text-gray-300 hover:bg-gray-700 hover:text-white'
          }}
        "
      >
        [{{ chord }}]
      </button>
    </div>

    <div v-if="currentIndex >= 0" class="mt-4 text-center">
      <div class="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-full">
        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span class="text-gray-400 text-sm">
          正在播放: 第 {{ currentIndex + 1 }} 个和弦
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  chords: string[];
  currentIndex: number;
}>();

defineEmits<{
  (e: 'click', chord: string, index: number): void;
}>();
</script>
