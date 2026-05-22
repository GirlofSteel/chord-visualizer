<template>
  <div class="w-full overflow-hidden" style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'PingFang SC', sans-serif;">
    <!-- 空状态 -->
    <div
      v-if="chordList.length === 0"
      class="flex items-center justify-center h-40 text-sm border-2 border-dashed rounded-card"
      style="border-color: #DCDCDC; color: #999999;"
    >
      <span>{{ locale === 'zh' ? '暂无数据' : 'No Data' }}</span>
    </div>

    <div v-else class="chord-list">
      <div
        v-for="(chord, index) in chordList"
        :key="index"
        class="chord-row cursor-pointer"
        :class="{ 'active': currentIndex === index }"
        @click="onRowClick(chord.name, index, chord.originalName)"
      >
        <!-- 左侧和弦名称 -->
        <div class="chord-name">
          <div class="text-lg">
            <template v-if="chord.name !== chord.originalName">
              <span style="color: #999999;">{{ chord.originalName }}</span>
              <span style="color: #BBBBBB; margin: 0 4px;">→</span>
              <span class="font-semibold" style="color: #111111;">{{ chord.name }}</span>
            </template>
            <span v-else class="font-semibold" style="color: #111111;">{{ chord.name }}</span>
          </div>
          <span class="text-xs mt-1" style="color: #999999;">{{ chord.notes.join(' - ') }}</span>
        </div>

        <!-- 右侧钢琴键盘 -->
        <PianoKeyboard
          :activeNotes="chord.notes"
          @playNote="emit('playNote', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import PianoKeyboard from './PianoKeyboard.vue';

const locale = inject<'en' | 'zh'>('locale', 'en');

interface ChordItem {
  name: string;        // 显示的和弦名称（转调后）
  originalName: string; // 原始和弦名称
  notes: string[];     // 转调后的音符
}

defineProps<{
  chordList: ChordItem[];
  currentIndex: number;
}>();

const emit = defineEmits<{
  (e: 'playNote', note: string): void;
  (e: 'playChord', chordName: string, originalChordName: string): void;
  (e: 'selectIndex', index: number): void;
}>();

const onRowClick = (chordName: string, index: number, originalChordName: string) => {
  emit('playChord', chordName, originalChordName);
  emit('selectIndex', index);
};
</script>

<style scoped>
.chord-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chord-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #F5F5F7;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.chord-row.active {
  background: #FFFFFF;
  border-color: #111111;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.chord-name {
  width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
