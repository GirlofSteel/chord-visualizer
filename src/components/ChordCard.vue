<template>
  <div class="bg-white rounded-card p-4 shadow-card">
    <!-- 和弦输入 -->
    <div class="mb-4 capture-hide">
      <label class="block text-sm font-medium mb-2 text-center" style="color: #666666;">
        {{ isZh ? '和弦输入' : 'Chord Input' }}
      </label>
      <textarea
        ref="textareaRef"
        :value="modelValue"
        @input="onInput"
        rows="1"
        :placeholder="isZh ? '例如: C G Am F' : 'e.g. C G Am F'"
        class="
          w-full px-4 py-3 rounded-card text-base resize-none
          bg-gray-50 border
          text-primary placeholder-muted
          focus:outline-none focus:ring-2 focus:ring-gray-300
          transition-all duration-200
        "
        style="border-color: #EAEAEA; color: #111111; min-height: 48px; overflow-y: hidden;"
      ></textarea>
      <p
        v-if="modelValue.length > 100"
        class="mt-2 text-xs text-center"
        style="color: #FF3B30;"
      >
        {{ isZh ? `已超出限度（${modelValue.length}/100）` : `Limit exceeded (${modelValue.length}/100)` }}
      </p>
      <p v-else class="mt-2 text-xs text-center" style="color: #999999;">
        {{ isZh ? '支持格式: C, Am, G7, Fmaj7, Cmaj7, Dsus4 等常见和弦' : 'Supported: C, Am, G7, Fmaj7, Cmaj7, Dsus4 and common chords' }}
      </p>
    </div>

    <!-- 上分隔线 (只在有变调夹或移调时显示) -->
    <div v-if="instrument === 'guitar' || instrument === 'piano'" class="border-t my-4 capture-hide" style="border-color: #EAEAEA;"></div>

    <!-- 变调夹控制 (仅吉他模式显示) -->
    <div v-if="instrument === 'guitar'" class="flex flex-col items-center gap-3 capture-hide">
      <span class="text-sm font-medium" style="color: #666666;">
        {{ isZh ? '变调夹' : 'Capo' }}
      </span>
      <div class="w-full overflow-x-auto pb-1">
        <div class="flex items-center justify-center gap-2 min-w-max px-2 mb-1">
          <button
            v-for="fret in [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7]"
            :key="fret"
            @click="emit('update:capo', fret)"
            :class="[
              'w-10 h-10 rounded-full font-medium text-sm transition-all duration-200',
            ]"
            :style="capo === fret
              ? { backgroundColor: '#111111', color: 'white' }
              : { backgroundColor: '#EAEAEA', color: '#666666' }"
          >
            {{ fret === 0 ? 0 : fret }}
          </button>
        </div>
      </div>
    </div>

    <!-- 移调控制 (仅钢琴模式显示) -->
    <div v-if="instrument === 'piano'" class="flex flex-col items-center gap-3 capture-hide">
      <span class="text-sm font-medium" style="color: #666666;">
        {{ isZh ? '移调' : 'Transpose' }}
      </span>
      <div class="w-full overflow-x-auto pb-1">
        <div class="flex items-center justify-center gap-2 min-w-max px-2 mb-1">
          <button
            v-for="semitone in [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]"
            :key="semitone"
            @click="emit('update:transpose', semitone)"
            :class="[
              'w-10 h-10 rounded-full font-medium text-sm transition-all duration-200',
            ]"
            :style="transpose === semitone 
              ? { backgroundColor: '#111111', color: 'white' } 
              : { backgroundColor: '#EAEAEA', color: '#666666' }"
          >
            {{ semitone === 0 ? (isZh ? '原' : '0') : (semitone > 0 ? '+' + semitone : semitone) }}
          </button>
        </div>
      </div>
    </div>

    <!-- 分隔线 -->
    <div class="border-t my-4 capture-hide" style="border-color: #EAEAEA;"></div>

    <!-- 可视化区域 -->
    <h2 class="text-base font-medium mb-4 text-center" style="color: #666666;">
      {{ instrument === 'piano' ? (isZh ? '钢琴指法' : 'Piano Fingering') : (isZh ? '吉他指法' : 'Guitar Fingering') }}
    </h2>
    <div id="visualization-area" class="overflow-x-auto">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, computed, ref, watch, nextTick } from 'vue';

const props = defineProps<{
  modelValue: string;
  instrument: 'piano' | 'guitar';
  capo: number;
  transpose: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'update:capo', value: number): void;
  (e: 'update:transpose', value: number): void;
}>();

const locale = inject<{ value: 'en' | 'zh' }>('locale');
const isZh = computed(() => locale?.value === 'zh');

const textareaRef = ref<HTMLTextAreaElement | null>(null);

function autoResize() {
  nextTick(() => {
    const el = textareaRef.value;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  });
}

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value);
}

watch(() => props.modelValue, autoResize, { immediate: true });
</script>
