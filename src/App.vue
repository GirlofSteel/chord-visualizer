<template>
  <div id="app-container" class="min-h-screen pb-8" style="background-color: #F5F5F7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'PingFang SC', sans-serif;">
    <!-- 头部 -->
    <header class="py-4 text-center relative">
      <!-- 语言切换 - Segmented Control -->
      <div class="absolute top-4 right-4 flex rounded-lg overflow-hidden border" style="border-color: #EAEAEA;">
        <button
          @click="locale = 'en'"
          class="px-2 py-1 text-xs transition-colors duration-200"
          :class="locale === 'en' ? 'text-white' : 'bg-white text-gray-500 hover:bg-gray-50'"
          :style="locale === 'en' ? 'background-color: #111111;' : ''"
        >
          EN
        </button>
        <button
          @click="locale = 'zh'"
          class="px-2 py-1 text-xs transition-colors duration-200"
          :class="locale === 'zh' ? 'text-white' : 'bg-white text-gray-500 hover:bg-gray-50'"
          :style="locale === 'zh' ? 'background-color: #111111;' : ''"
        >
          中文
        </button>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="container mx-auto px-4 space-y-4">

      <!-- 关键内容区域（用于截图） -->
      <div id="capture-area" class="space-y-4">
        <!-- 标题和副标题 -->
        <div class="text-center py-4">
          <h1 class="text-2xl md:text-4xl font-semibold" style="color: #111111;">
            {{ locale === 'zh' ? '和弦图谱' : 'Chord Visualizer' }}
          </h1>
          <p class="mt-1 md:mt-2 text-xs md:text-sm" style="color: #999999;">
            {{ locale === 'zh' ? '输入和弦序列，实时播放并可视化' : 'Enter chord progressions for real-time playback and visualization' }}
          </p>
        </div>

        <!-- 乐器切换卡片 -->
        <InstrumentSwitch v-model="instrument" class="capture-hide" />

        <!-- 和弦输入卡片 -->
        <ChordCard
          v-model="chordInput"
          :instrument="instrument"
          :capo="capo"
          :transpose="transpose"
          @update:capo="capo = $event"
          @update:transpose="transpose = $event"
        >
          <Piano
            v-if="instrument === 'piano'"
            :chord-list="pianoChordList"
            :current-index="displayIndex"
            @play-note="onPlayNote"
            @play-chord="onPlayChord"
            @select-index="onSelectIndex"
          />
          <Guitar
            v-else
            :chords="chords"
            :capo="capo"
            :current-index="displayIndex"
            @click="onChordClick"
          />
        </ChordCard>
      </div>

      <!-- 播放控制卡片 -->
      <PlaybackCard
        v-if="chordInput.trim() && chords.length > 0"
        v-model="bpm"
        :is-playing="isPlaying"
        @toggle-play="togglePlay"
        @export="exportData"
      />

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, provide } from 'vue';
import html2canvas from 'html2canvas';
import InstrumentSwitch from './components/InstrumentSwitch.vue';
import ChordCard from './components/ChordCard.vue';
import PlaybackCard from './components/PlaybackCard.vue';
import Piano from './components/Piano.vue';
import Guitar from './components/Guitar.vue';
import { useAudio } from './composables/useAudio';
import { getChordNotes, parseChordInput, transposeChord, getNoteMidi, adjustChordToRange } from './utils/chordUtils';

type InstrumentType = 'piano' | 'guitar';

// 语言
const locale = ref<'en' | 'zh'>('en');
// 提供语言设置给子组件
provide('locale', locale);

// 钢琴和吉他分别保存各自上次输入的和弦
const pianoChordInput = ref('');
const guitarChordInput = ref('');

// 当前显示的和弦输入（根据乐器切换）
const chordInput = ref('');
const chords = ref<string[]>([]);
const bpm = ref(100);
const instrument = ref<InstrumentType>('piano');
const capo = ref(0);
const transpose = ref(0);
const currentChord = ref('C');
const selectedIndex = ref(0);

// 监听乐器切换，同步显示对应乐器的上次输入
watch(instrument, (newInstrument) => {
  if (newInstrument === 'piano') {
    chordInput.value = pianoChordInput.value;
  } else {
    chordInput.value = guitarChordInput.value;
  }
  // 切换乐器时重置选中索引
  selectedIndex.value = 0;
});

const audio = useAudio();
const isPlaying = audio.isPlaying;
const currentChordIndex = computed(() => audio.currentChordIndex.value);

// 显示索引：播放时用 currentChordIndex，否则用 selectedIndex
const displayIndex = computed(() => {
  return isPlaying.value ? currentChordIndex.value : selectedIndex.value;
});

// 监听当前播放和弦
watch(currentChordIndex, (index) => {
  if (index >= 0 && index < chords.value.length) {
    currentChord.value = chords.value[index];
  }
});

const onSelectIndex = (index: number) => {
  selectedIndex.value = index;
};

// 同步和弦输入到数组
watch(chordInput, (val) => {
  chords.value = parseChordInput(val);
  if (chords.value.length > 0) {
    currentChord.value = chords.value[0];
  }
  // 保存到对应乐器的输入
  if (instrument.value === 'piano') {
    pianoChordInput.value = val;
  } else {
    guitarChordInput.value = val;
  }
});

// 计算钢琴和弦列表（根据移调值显示）
const pianoChordList = computed(() => {
  return chords.value.map(name => {
    const transposedName = transpose.value !== 0 ? transposeChord(name, transpose.value) : name;
    const originalNotes = getChordNotes(name);
    
    // 将音符转换为 MIDI 值
    let midiNotes = originalNotes.map(note => {
      const match = note.match(/^([A-G][#b]?)(-?\d+)?$/);
      if (!match) return 60;
      const notePart = match[1];
      const octave = parseInt(match[2]) || 4;
      return getNoteMidi(notePart) + (octave + 1) * 12;
    });
    
    // 应用转调
    if (transpose.value !== 0) {
      midiNotes = midiNotes.map(m => m + transpose.value);
    }
    
    // 调整到 C3-B4 区间
    midiNotes = adjustChordToRange(midiNotes);
    
    // 转换回音符名称
    const transposedNotes = midiNotes.map(m => {
      const octave = Math.floor(m / 12) - 1;
      const noteIndex = m % 12;
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      return noteNames[noteIndex] + octave;
    });
    
    return {
      name: transposedName,
      originalName: name,
      notes: transposedNotes
    };
  });
});

const onChordClick = (chord: string, index: number) => {
  const originalChord = chords.value[index] || chord;
  currentChord.value = originalChord;
  selectedIndex.value = index;
  
  // 如果使用变调夹，需要转调播放
  if (capo.value > 0) {
    const notes = getChordNotes(originalChord);
    if (notes.length > 0) {
      // 将音符转换为 MIDI 值
      let midiNotes = notes.map(note => {
        const match = note.match(/^([A-G][#b]?)(-?\d+)?$/);
        if (!match) return 60;
        const notePart = match[1];
        const octave = parseInt(match[2]) || 4;
        return getNoteMidi(notePart) + (octave + 1) * 12;
      });
      
      // 应用变调夹转调
      midiNotes = midiNotes.map(m => m + capo.value);
      
      // 调整到 C3-B4 区间
      midiNotes = adjustChordToRange(midiNotes);
      
      // 转换回音符名称
      const transposedNotes = midiNotes.map(m => {
        const octave = Math.floor(m / 12) - 1;
        const noteIndex = m % 12;
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        return noteNames[noteIndex] + octave;
      });
      
      audio.playNotes(transposedNotes);
    }
  } else {
    audio.playChord(originalChord);
  }
};

const onPlayNote = (note: string) => {
  audio.playSingleNote(note);
};

const onPlayChord = (_chordName: string, originalChordName: string) => {
  const originalNotes = getChordNotes(originalChordName);
  
  // 将音符转换为 MIDI 值
  let midiNotes = originalNotes.map(note => {
    const match = note.match(/^([A-G][#b]?)(-?\d+)?$/);
    if (!match) return 60;
    const notePart = match[1];
    const octave = parseInt(match[2]) || 4;
    return getNoteMidi(notePart) + (octave + 1) * 12;
  });
  
  // 应用转调
  if (transpose.value !== 0) {
    midiNotes = midiNotes.map(m => m + transpose.value);
  }
  
  // 调整到 C3-B4 区间
  midiNotes = adjustChordToRange(midiNotes);
  
  // 转换回音符名称并播放
  const transposedNotes = midiNotes.map(m => {
    const octave = Math.floor(m / 12) - 1;
    const noteIndex = m % 12;
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return noteNames[noteIndex] + octave;
  });
  
  audio.playNotes(transposedNotes);
};

const togglePlay = () => {
  if (isPlaying.value) {
    audio.stopSequence();
  } else {
    audio.playSequence(chords.value, bpm.value);
  }
};

const exportData = async () => {
  const captureArea = document.getElementById('capture-area');
  if (captureArea) {
    try {
      const canvas = await html2canvas(captureArea, {
        backgroundColor: '#F5F5F7',
        scale: 2,
        onclone: (clonedDoc) => {
          // 隐藏不需要的部分
          const hiddenElements = clonedDoc.querySelectorAll('.capture-hide');
          hiddenElements.forEach(el => {
            (el as HTMLElement).style.display = 'none';
          });
        }
      });
      const imgUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = imgUrl;
      a.download = `chord-visualizer-${Date.now()}.png`;
      a.click();
    } catch (error) {
      console.error('截图失败:', error);
    }
  }
};
</script>
