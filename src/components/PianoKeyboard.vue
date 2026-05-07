<template>
  <div class="keyboard-container select-none" @click.stop style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'PingFang SC', sans-serif;">
    <!-- 白键 -->
    <div class="white-keys">
      <div
        v-for="note in whiteNotes"
        :key="note"
        class="white-key cursor-pointer"
        :class="{ 'active': isNoteActive(note, activeNotes) }"
        @click="emit('playNote', note)"
      >
        <span class="note-label">{{ note }}</span>
        <div v-if="isNoteActive(note, activeNotes)" class="dot"></div>
      </div>
    </div>

    <!-- 黑键 -->
    <div class="black-keys">
      <div
        v-for="item in allBlackNotes"
        :key="item.note"
        class="black-key"
        :style="{ left: item.left + '%' }"
      >
        <div
          class="black-key-inner cursor-pointer"
          :class="{ 'active': isNoteActive(item.note, activeNotes) }"
          @click="emit('playNote', item.note)"
        >
          <div v-if="isNoteActive(item.note, activeNotes)" class="dot-black"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 白键: C D E F G A B (两个八度 C3-B4)
const whiteNotes = [
  'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3',
  'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'
];

// 黑键：每个黑键位于两白键之间的间隙中央
// 7个白键每个占 100/14 ≈ 7.14%，黑键宽度约为 3.2%
const whiteKeyWidth = 100 / 14;
const allBlackNotes = [
  // 第一个八度 (位置 1-5)
  { note: 'C#3', left: 4 },
  { note: 'D#3', left: 12 },
  { note: 'F#3', left: 25 },
  { note: 'G#3', left: 33 },
  { note: 'A#3', left: 41 },
  // 第二个八度 (位置 8-12)
  { note: 'C#4', left: 54},
  { note: 'D#4', left: 62},
  { note: 'F#4', left: 75 },
  { note: 'G#4', left: 83 },
  { note: 'A#4', left: 91 },
];

defineProps<{
  activeNotes: string[];
}>();

const emit = defineEmits<{
  (e: 'playNote', note: string): void;
}>();

// 音符别名映射（用于处理等音）
const noteAliases: Record<string, string[]> = {
  'C': ['C'],
  'C#': ['C#', 'Db'],
  'D': ['D'],
  'D#': ['D#', 'Eb'],
  'E': ['E', 'Fb'],
  'F': ['F', 'E#'],
  'F#': ['F#', 'Gb'],
  'G': ['G'],
  'G#': ['G#', 'Ab'],
  'A': ['A'],
  'A#': ['A#', 'Bb'],
  'B': ['B', 'Cb'],
};

// 获取音符的基础音名（去掉八度）
const getBaseNote = (note: string): string => {
  const match = note.match(/^([A-G][#b]?)/);
  return match ? match[1] : '';
};

// 获取音符的八度
const getOctave = (note: string): number => {
  const match = note.match(/(\d+)$/);
  return match ? parseInt(match[1]) : 4;
};

// 检查某个音符是否激活
const isNoteActive = (note: string, chordNotes: string[]): boolean => {
  const noteBase = getBaseNote(note);
  const noteOctave = getOctave(note);
  
  return chordNotes.some(active => {
    const activeBase = getBaseNote(active);
    const activeOctave = getOctave(active);
    
    // 首先检查完全匹配（音名和八度都相同）
    if (noteBase === activeBase && noteOctave === activeOctave) {
      return true;
    }
    
    // 检查等音匹配（音名相同但八度不同）
    const noteEquivalents = noteAliases[noteBase] || [noteBase];
    if (noteEquivalents.includes(activeBase) && noteOctave === activeOctave) {
      return true;
    }
    
    return false;
  });
};
</script>

<style scoped>
.keyboard-container {
  display: flex;
  justify-content: center;
  position: relative;
  height: 80px;
  width: 250px;
  margin: 0 auto;
}

.white-keys {
  display: flex;
  width: 100%;
  height: 100%;
}

.white-key {
  flex: 1;
  height: 100%;
  border: 1px solid #EAEAEA;
  border-top: none;
  border-radius: 0 0 4px 4px;
  background: #FFFFFF;
  position: relative;
  transition: background 0.2s;
}

.white-key:not(:last-child) {
  border-right: none;
}

.white-key.active {
  background: #F5F5F7;
}

.white-key:hover {
  background: #F5F5F7;
}

.note-label {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 9px;
  color: #999999;
  pointer-events: none;
  white-space: nowrap;
}

.dot {
  position: absolute;
  top: 48px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #111111;
  z-index: 11;
}

.black-keys {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  max-width: 250px;
  height: 55%;
  pointer-events: none;
}

.black-key {
  position: absolute;
  top: 0;
  width: calc(100% / 7 * 0.45);
  height: 100%;
  display: flex;
  justify-content: center;
  pointer-events: auto;
}

.black-key-inner {
  width: 100%;
  height: 100%;
  border-radius: 0 0 4px 4px;
  background: #111111;
  transition: background 0.2s;
  position: relative;
}

.black-key-inner:hover {
  background: #333333;
}

.black-key-inner.active {
  background: #666666;
}

.dot-black {
  position: absolute;
  top: 28px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #FFFFFF;
}
</style>
