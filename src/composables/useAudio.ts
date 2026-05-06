import { ref, onUnmounted } from 'vue';
import * as Tone from 'tone';
import { getChordNotes } from '../utils/chordUtils';

export type InstrumentType = 'piano' | 'guitar' | 'synth';

export function useAudio() {
  const isPlaying = ref(false);
  const currentChordIndex = ref(-1);
  const transpose = ref(0);

  let synth: Tone.PolySynth | null = null;
  let sequence: Tone.Sequence | null = null;
  let chords: string[] = [];

  const initAudio = async () => {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    if (synth) return synth;

    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.005,
        decay: 0.3,
        sustain: 0.4,
        release: 0.5,
      },
    }).toDestination();
    synth.volume.value = -8;
    return synth;
  };

  const playChord = async (chordName: string) => {
    const s = await initAudio();
    if (!s) return;

    const notes = getChordNotes(chordName);
    if (notes.length === 0) return;

    s.releaseAll();
    s.triggerAttackRelease(notes, '4n');
  };

  const playSingleNote = async (note: string) => {
    const s = await initAudio();
    if (!s) return;

    s.triggerAttackRelease(note, '4n');
  };

  // 播放一组音符（用于转调后的和弦）
  const playNotes = async (notes: string[]) => {
    const s = await initAudio();
    if (!s) return;
    if (notes.length === 0) return;

    s.releaseAll();
    s.triggerAttackRelease(notes, '4n');
  };

  const playSequence = async (chordList: string[], bpm: number) => {
    chords = chordList;
    Tone.Transport.bpm.value = bpm;

    const s = await initAudio();
    if (!s) return;

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
          s.releaseAll();
          s.triggerAttackRelease(notes, '2n', time);
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
    if (synth) {
      synth.releaseAll();
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
    if (synth) {
      synth.dispose();
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
