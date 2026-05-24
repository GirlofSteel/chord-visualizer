import { ref, onUnmounted } from 'vue';
import * as Tone from 'tone';
import { getChordNotes } from '../utils/chordUtils';
import { CHORD_FINGERINGS } from '../constants/chordFingerings';

export type InstrumentType = 'piano' | 'guitar';

// 吉他六根弦的空弦音（从6弦到1弦）
const GUITAR_OPEN_STRINGS = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];

// 将降号根音归一化为升号（Db→C#, Eb→D# 等）
function normalizeRoot(root: string): string {
  const flatToSharp: Record<string, string> = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
  };
  return flatToSharp[root] || root;
}

// 获取和弦的吉他指法
function getGuitarFingering(chordName: string): string[] {
  // 先尝试完整匹配（如 Cmaj7）
  if (CHORD_FINGERINGS[chordName]) {
    return CHORD_FINGERINGS[chordName];
  }

  // 分离根音和后缀
  const match = chordName.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return ['X', 'X', 'X', 'X', 'X', 'X'];

  const root = normalizeRoot(match[1]);
  const suffix = match[2] || '';

  // 尝试根音+后缀
  const key = root + suffix;
  if (CHORD_FINGERINGS[key]) {
    return CHORD_FINGERINGS[key];
  }

  // 尝试只有根音
  if (CHORD_FINGERINGS[root]) {
    return CHORD_FINGERINGS[root];
  }

  return ['X', 'X', 'X', 'X', 'X', 'X'];
}

// 根据指法获取要演奏的音符（逐弦）
export function getGuitarNotesFromFingering(chordName: string): string[] {
  const fingering = getGuitarFingering(chordName);
  const notes: string[] = [];

  fingering.forEach((fret, stringIndex) => {
    if (fret === 'X') return; // 跳过静音弦

    const openNote = GUITAR_OPEN_STRINGS[stringIndex];
    if (fret === '0') {
      // 空弦，直接使用空弦音
      notes.push(openNote);
    } else {
      // 按品格，计算实际音高
      const midi = Tone.Frequency(openNote).toMidi();
      const fretNum = parseInt(fret);
      const targetMidi = midi + fretNum; // 每升高一格加一个半音
      notes.push(Tone.Frequency(targetMidi, 'midi').toNote());
    }
  });

  return notes;
}

export function useAudio() {
  const isPlaying = ref(false);
  const currentChordIndex = ref(-1);
  const transpose = ref(0);

  let pianoSynth: Tone.PolySynth | null = null;
  let guitarSynth: Tone.PolySynth | null = null;
  let sequence: Tone.Sequence | null = null;
  let chords: string[] = [];

  const initPianoAudio = async () => {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    if (pianoSynth) return pianoSynth;

    pianoSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.005,
        decay: 0.3,
        sustain: 0.4,
        release: 0.5,
      },
    }).toDestination();
    pianoSynth.volume.value = -8;
    return pianoSynth;
  };

  const initGuitarAudio = async () => {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    if (guitarSynth) return guitarSynth;

    guitarSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.005,
        decay: 0.3,
        sustain: 0.4,
        release: 0.5,
      },
    }).toDestination();
    guitarSynth.volume.value = -8;

    return guitarSynth;
  };

  const playChord = async (chordName: string, instrument: InstrumentType = 'piano') => {
    if (instrument === 'guitar') {
      const guitarNotes = getGuitarNotesFromFingering(chordName);
      if (guitarNotes.length === 0) return;

      const s = await initGuitarAudio();
      if (!s) return;
      s.releaseAll();
      // 逐弦拨响，同时结束
      guitarNotes.forEach((note, i) => {
        setTimeout(() => {
          s.triggerAttack(note);
        }, i * 30);
      });
      setTimeout(() => {
        s.releaseAll();
      }, 400);
    } else {
      const notes = getChordNotes(chordName);
      if (notes.length === 0) return;
      const s = await initPianoAudio();
      if (!s) return;
      s.releaseAll();
      s.triggerAttackRelease(notes, '4n');
    }
  };

  const playSingleNote = async (note: string, instrument: InstrumentType = 'piano') => {
    if (instrument === 'guitar') {
      const s = await initGuitarAudio();
      if (!s) return;
      s.releaseAll();
      s.triggerAttackRelease(note, 0.2);
    } else {
      const s = await initPianoAudio();
      if (!s) return;
      s.triggerAttackRelease(note, '4n');
    }
  };

  // 播放一组音符（用于转调后的和弦）
  const playNotes = async (notes: string[], instrument: InstrumentType = 'piano') => {
    if (notes.length === 0) return;

    if (instrument === 'guitar') {
      const s = await initGuitarAudio();
      if (!s) return;
      s.releaseAll();
      // 逐弦拨响，同时结束
      notes.forEach((note, i) => {
        setTimeout(() => {
          s.triggerAttack(note);
        }, i * 30);
      });
      setTimeout(() => {
        s.releaseAll();
      }, 400);
    } else {
      const s = await initPianoAudio();
      if (!s) return;
      s.releaseAll();
      s.triggerAttackRelease(notes, '4n');
    }
  };

  const playSequence = async (chordList: string[], bpm: number, instrument: InstrumentType = 'piano') => {
    chords = chordList;
    Tone.Transport.bpm.value = bpm;

    if (sequence) {
      sequence.stop();
      sequence.dispose();
    }

    const totalBeats = chords.length;

    sequence = new Tone.Sequence(
      (time, beat) => {
        const chord = chords[beat];
        if (!chord) return;

        const notes = getChordNotes(chord);
        if (notes.length > 0) {
          if (instrument === 'guitar') {
            const s = guitarSynth;
            if (s) {
              s.releaseAll();
              // 逐弦拨响，同时结束
              notes.forEach((note, i) => {
                Tone.Transport.scheduleOnce(() => {
                  s.triggerAttack(note);
                }, time + i * 0.03);
              });
              Tone.Transport.scheduleOnce(() => {
                s.releaseAll();
              }, time + 0.4);
            }
          } else {
            const s = pianoSynth;
            if (s) {
              s.releaseAll();
              s.triggerAttackRelease(notes, '2n', time);
            }
          }
        }

        // 使用 Tone.Draw 确保 UI 在正确的时机更新
        Tone.Draw.schedule(() => {
          currentChordIndex.value = beat;

          // 如果是最后一个和弦，等音符播放完毕后自动停止
          if (beat === totalBeats - 1) {
            // '2n' 时长为2拍，延迟2拍后停止
            Tone.Transport.scheduleOnce(() => {
              stopSequence();
            }, time + Tone.Time('2n').toSeconds());
          }
        }, time);
      },
      chords.map((_, i) => i),
      '1n'
    );

    sequence.loop = false; // 不循环播放
    sequence.start(0);
    Tone.Transport.start();
    isPlaying.value = true;
    // 立即设置第一个和弦
    currentChordIndex.value = 0;
  };

  const stopSequence = () => {
    if (sequence) {
      sequence.stop();
      sequence.dispose();
      sequence = null;
    }
    if (pianoSynth) {
      pianoSynth.releaseAll();
    }
    if (guitarSynth) {
      guitarSynth.releaseAll();
    }
    Tone.Transport.stop();
    isPlaying.value = false;
    currentChordIndex.value = -1;
  };

  const setTransposeValue = (value: number) => {
    transpose.value = value;
  };

  onUnmounted(() => {
    stopSequence();
    if (pianoSynth) {
      pianoSynth.dispose();
    }
    if (guitarSynth) {
      guitarSynth.dispose();
    }
  });

  return {
    isPlaying,
    currentChordIndex,
    transpose,
    playChord,
    playSingleNote,
    playNotes,
    playSequence,
    stopSequence,
    setTranspose: setTransposeValue,
  };
}
