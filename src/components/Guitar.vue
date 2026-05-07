<template>
  <div class="w-full" style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'PingFang SC', sans-serif;">
    <!-- 空状态 -->
    <div
      v-if="chords.length === 0"
      class="flex items-center justify-center h-40 text-sm border-2 border-dashed rounded-card"
      style="border-color: #DCDCDC; color: #999999;"
    >
      <span>{{ locale === 'zh' ? '暂无数据' : 'No Data' }}</span>
    </div>

    <!-- 和弦表格 -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      <div
        v-for="(chord, index) in chords"
        :key="chord + index"
        class="flex-shrink-0 p-3 rounded-card transition-all duration-200 cursor-pointer border-2"
        :style="index === currentIndex 
          ? { borderColor: '#111111', backgroundColor: '#F5F5F7' }
          : { borderColor: '#EAEAEA', backgroundColor: '#FFFFFF' }"
        @click="$emit('click', chord, index)"
      >
        <!-- 和弦名称 -->
        <div class="text-center font-semibold text-base mb-3" :style="{ color: index === currentIndex ? '#111111' : '#666666' }">
          {{ chord }}
        </div>

        <!-- 吉他指法图 -->
        <div class="relative mx-auto" style="width: 100px; height: 100px;">
          <!-- 起始品号（如果超过1品） -->
          <div
            v-if="getStartFret(chord) > 1"
            class="absolute left-0 top-3 bottom-0 flex items-center"
            style="writing-mode: vertical-rl; text-orientation: mixed;"
          >
            <span class="text-xs font-medium" style="color: #999999;">{{ getStartFret(chord) }}</span>
          </div>

          <!-- 品丝（水平线） -->
          <div class="absolute left-0 right-0 top-0 h-0.5" style="background-color: #DCDCDC;"></div>
          <div class="absolute left-0 right-0 top-[25%] h-0.5" style="background-color: #DCDCDC;"></div>
          <div class="absolute left-0 right-0 top-[50%] h-0.5" style="background-color: #DCDCDC;"></div>
          <div class="absolute left-0 right-0 top-[75%] h-0.5" style="background-color: #DCDCDC;"></div>
          <div class="absolute left-0 right-0 bottom-0 h-0.5" style="background-color: #DCDCDC;"></div>

          <!-- 弦（垂直线，从左到右是6弦到1弦） -->
          <div
            v-for="(fret, stringIdx) in getAdjustedFingering(chord)"
            :key="stringIdx"
            class="absolute top-0 bottom-0 w-0.5"
            style="background-color: #DCDCDC;"
            :style="{ left: `${stringIdx * 15 + (getStartFret(chord) > 1 ? 14 : 8)}px` }"
          >
            <!-- 品位标记（圆形） -->
            <template v-if="fret === 'X'">
              <span
                class="absolute top-[-16px] left-1/2 -translate-x-1/2 font-bold text-xs"
                style="color: #FF3B30;"
              >✕</span>
            </template>
            <template v-else-if="fret !== '0'">
              <div
                class="absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2"
                :style="[
                  index === currentIndex 
                    ? { backgroundColor: '#111111', borderColor: '#111111' }
                    : { backgroundColor: '#666666', borderColor: '#888888' },
                  { top: `${(parseInt(fret) - 0.5) * 25}%` }
                ]"
              ></div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CHORD_FINGERINGS } from '../constants/chordFingerings';
import { inject } from 'vue';

const locale = inject<'en' | 'zh'>('locale', 'en');
withDefaults(defineProps<{
  chords: string[];
  currentIndex: number;
  capo?: number;
}>(), {
  capo: 0
});

defineEmits<{
  (e: 'click', chord: string, index: number): void;
}>();

function getRawFingering(chordName: string): string[] {
  if (CHORD_FINGERINGS[chordName]) {
    return CHORD_FINGERINGS[chordName];
  }

  const match = chordName.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return ['X', 'X', 'X', 'X', 'X', 'X'];

  const root = match[1];
  const suffix = match[2] || '';

  const withSuffix = CHORD_FINGERINGS[root + suffix];
  if (withSuffix) return withSuffix;

  const rootOnly = CHORD_FINGERINGS[root];
  if (rootOnly) return rootOnly;

  return ['?', '?', '?', '?', '?', '?'];
}

// 获取起始品数（超过4品时调整显示）- 基于原始指法
function getStartFret(chordName: string): number {
  const fingering = getRawFingering(chordName);
  const maxFret = fingering
    .filter(f => f !== 'X' && f !== '0')
    .map(f => parseInt(f))
    .filter(n => !isNaN(n))
    .reduce((max, n) => Math.max(max, n), 0);
  
  return maxFret > 4 ? maxFret - 3 : 1;
}

// 获取调整后的指法（用于显示）- 始终显示原始指法，不受变调夹影响
function getAdjustedFingering(chordName: string): string[] {
  const fingering = getRawFingering(chordName);
  const startFret = getStartFret(chordName);
  
  if (startFret === 1) return fingering;
  
  return fingering.map(f => {
    if (f === 'X' || f === '0') return f;
    const adjusted = parseInt(f) - startFret + 1;
    return adjusted > 0 ? String(adjusted) : '0';
  });
}

</script>
