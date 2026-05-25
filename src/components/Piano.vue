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
          <!-- 桌面：纵向排列；手机：横向单行 -->
          <div class="chord-name-row">
            <template v-if="chord.name !== chord.originalName">
              <span class="chord-original">{{ chord.originalName }}</span>
              <span class="chord-arrow">→</span>
              <span class="chord-transposed">{{ chord.name }}</span>
            </template>
            <span v-else class="chord-transposed">{{ chord.name }}</span>
            <span class="chord-notes">{{ chord.notes.join(' - ') }}</span>
          </div>
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

.chord-name-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.chord-original {
  color: #999999;
  font-size: 1.125rem;
  line-height: 1.75rem;
}

.chord-arrow {
  color: #BBBBBB;
  margin: 0 4px;
  font-size: 1.125rem;
}

.chord-transposed {
  font-weight: 600;
  color: #111111;
  font-size: 1.125rem;
  line-height: 1.75rem;
}

.chord-notes {
  font-size: 0.75rem;
  color: #999999;
}

/* 手机端：上下堆叠 */
@media (max-width: 640px) {
  .chord-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 8px 12px;
  }

  .chord-name {
    width: 100%;
  }

  .chord-name-row {
    flex-direction: row;
    align-items: baseline;
    gap: 4px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .chord-original {
    font-size: 0.8125rem;
    line-height: 1.25rem;
  }

  .chord-arrow {
    font-size: 0.8125rem;
    margin: 0 2px;
  }

  .chord-transposed {
    font-size: 0.9375rem;
    line-height: 1.5rem;
  }

  .chord-notes {
    margin-left: 2px;
  }
}

/* 桌面端：横向布局 */
@media (min-width: 641px) {
  .chord-notes {
    display: block;
    margin-top: 4px;
  }
}
</style>
