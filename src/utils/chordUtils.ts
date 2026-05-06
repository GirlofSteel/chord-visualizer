import { Chord, Note } from '@tonaljs/tonal';

// 降号转等效升号
function flatToSharp(note: string): string {
  const map: Record<string, string> = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
    'Cbb': 'B', 'Dbb': 'C#', 'Ebb': 'D#', 'Fbb': 'Eb', 'Gbb': 'F#', 'Abb': 'G#', 'Bbb': 'A#'
  };
  return map[note] || note;
}

// 获取和弦的音符（确保返回有效的音符格式）
export function getChordNotes(chordName: string): string[] {
  // 将和弦名中的降号转换为升号（Tonal.js 更喜欢升号格式）
  const normalizedChord = chordName.replace(/([A-G][#b]?)b?(b?)/g, (match, note, extraB) => {
    if (extraB) {
      // 双重降号
      const doubleFlatMap: Record<string, string> = {
        'C': 'B', 'D': 'C#', 'E': 'D#', 'F': 'E', 'G': 'F#', 'A': 'G#', 'B': 'A#'
      };
      return doubleFlatMap[note] || match;
    }
    return flatToSharp(note);
  });

  // 检查是否是斜线和弦
  const slashResult = parseSlashChord(normalizedChord);
  if (slashResult.bass) {
    // 斜线和弦：低音 + 主和弦
    return [slashResult.bass, ...slashResult.chord];
  }
  
  try {
    const chord = Chord.get(normalizedChord);
    if (chord && chord.notes && chord.notes.length > 0) {
      // Tonal 返回的音符没有八度，需要智能添加八度
      // 根音放在八度 4，其他音符根据音程关系分配到合适八度
      return addOctavesToChord(chord.notes);
    }
    return parseChordManually(normalizedChord);
  } catch {
    return parseChordManually(normalizedChord);
  }
}

// 为和弦音符智能添加八度
function addOctavesToChord(notes: string[]): string[] {
  if (notes.length === 0) return [];
  
  const rootNote = notes[0]; // 根音
  const rootMidi = getNoteMidi(rootNote); // 根音的半音数 (0-11)
  const rootOctave = 3;
  
  const result: string[] = [rootNote + rootOctave]; // 根音放在八度 3
  
  for (let i = 1; i < notes.length; i++) {
    const note = notes[i];
    const noteMidi = getNoteMidi(note);
    
    // 如果当前音符的半音值小于根音，升高一个八度
    let octave = rootOctave;
    if (noteMidi < rootMidi) {
      octave = rootOctave + 1;
    }
    
    result.push(note + octave);
  }
  
  return result;
}

// 解析斜线和弦，返回 [低音音符, 和弦音符数组]
function parseSlashChord(chordName: string): { bass: string | null; chord: string[] } {
  const slashMatch = chordName.match(/^([A-G][#b]?(?:maj7|m7|m9|m7b5|dim7|dim|aug7|aug|sus4|sus2|7sus4|7|6|9|11|13|m)?)\/([A-G][#b]?)$/);
  if (!slashMatch) {
    return { bass: null, chord: [] };
  }
  
  const mainChord = slashMatch[1];
  const bassNote = slashMatch[2];
  const bassNoteNum = getNoteMidi(bassNote.replace('b', '#'));
  
  // 计算低音音符（比主和弦根音低一个八度或更多）
  let bassWithOctave = bassNote + '2';
  const mainChordNotes = getChordNotes(mainChord);
  if (mainChordNotes.length > 0) {
    const mainRootMidi = getNoteMidi(mainChord.replace(/[A-G][#b]?/, '').match(/^([A-G][#b]?)/)?.[1]?.replace('b', '#') || 'C');
    // 如果低音音符高于主和弦根音，降低一个八度
    if (bassNoteNum >= mainRootMidi) {
      bassWithOctave = bassNote + '2';
    } else {
      bassWithOctave = bassNote + '3';
    }
  }
  
  return { bass: bassWithOctave, chord: mainChordNotes };
}

function parseChordManually(chordName: string): string[] {
  const noteMap: Record<string, number[]> = {
    'maj7': [0, 4, 7, 11],  // maj7
    'm7': [0, 3, 7, 10],    // m7
    'm9': [0, 3, 7, 10, 14], // m9
    'm7b5': [0, 3, 6, 10],  // m7b5 (半减七)
    'dim7': [0, 3, 6, 9],   // dim7
    'dim': [0, 3, 6],       // dim
    'aug7': [0, 4, 8, 11],  // aug7
    'aug': [0, 4, 8],       // aug
    'sus4': [0, 5, 7],      // sus4
    'sus2': [0, 2, 7],      // sus2
    '7sus4': [0, 5, 7, 10], // 7sus4
    '7': [0, 4, 7, 10],     // dom7
    '6': [0, 4, 7, 9],      // 6th
    '9': [0, 4, 7, 10, 14], // dom9
    '11': [0, 4, 7, 10, 14, 17], // dom11
    '13': [0, 4, 7, 10, 14, 17, 21], // dom13
    'm': [0, 3, 7],         // minor (最后匹配)
    '': [0, 4, 7],          // major (默认)
  };

  const match = chordName.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return [];

  const root = match[1];
  const suffix = match[2] || '';

  // 处理 add 和弦 (如 add9, add11, add13) - 不含七音
  const addMatch = suffix.match(/^add(\d+)$/);
  if (addMatch) {
    const addInterval = parseInt(addMatch[1]);
    const baseIntervals = noteMap['']; // 大三和弦
    // add9=14, add11=17, add13=21
    if ([9, 11, 13].includes(addInterval)) {
      const addSemitones = addInterval === 9 ? 14 : addInterval === 11 ? 17 : 21;
      return calculateNotes(root, [...baseIntervals, addSemitones]);
    }
  }

  // 处理 madd (如 madd9)
  const maddMatch = suffix.match(/^madd(\d+)$/);
  if (maddMatch) {
    const addInterval = parseInt(maddMatch[1]);
    const baseIntervals = noteMap['m']; // 小三和弦
    if ([9, 11, 13].includes(addInterval)) {
      const addSemitones = addInterval === 9 ? 14 : addInterval === 11 ? 17 : 21;
      return calculateNotes(root, [...baseIntervals, addSemitones]);
    }
  }

  // 默认使用大三和弦
  let intervals = noteMap[''];
  const sortedSuffixes = Object.keys(noteMap).filter(s => s !== '').sort((a, b) => b.length - a.length);
  
  for (const suffixKey of sortedSuffixes) {
    if (suffix.includes(suffixKey)) {
      intervals = noteMap[suffixKey];
      break;
    }
  }

  return calculateNotes(root, intervals);
}

// 计算和弦音符
function calculateNotes(root: string, intervals: number[]): string[] {
  const baseNote = root.replace('b', '#');
  const notes: string[] = [];

  for (const interval of intervals) {
    const midiNum = 60 + getNoteMidi(baseNote) - 60 + interval; // C4 = 60
    const noteName = midiToNoteName(midiNum);
    notes.push(noteName);
  }

  return notes;
}

// 获取音符的 MIDI 值
export function getNoteMidi(noteName: string): number {
  const notes: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'Fb': 4, 'E#': 5,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11, 'Cb': 11, 'B#': 0,
  };
  return notes[noteName] ?? 0;
}

// MIDI 转回音符名称
function midiToNoteName(midi: number): string {
  // 确保 MIDI 值始终为正数
  while (midi < 0) midi += 12;
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return noteNames[noteIndex] + octave;
}

// 转调单个音符（升高 semitones 个半音）
export function transposeNote(noteName: string, semitones: number): string {
  if (semitones === 0) return noteName;
  
  // 解析音符名称和八度
  const match = noteName.match(/^([A-G][#b]?)(-?\d+)?$/);
  if (!match) return noteName;
  
  const notePart = match[1];
  const octave = match[2] ? parseInt(match[2]) : 4;
  
  // 获取音符的 MIDI 值
  const noteMidi = getNoteMidi(notePart) + (octave + 1) * 12;
  // 转调
  const newMidi = noteMidi + semitones;
  
  return midiToNoteName(newMidi);
}

// 调整和弦音符到 C3-B4 区间
export function adjustChordToRange(midiNotes: number[]): number[] {
  if (midiNotes.length === 0) return midiNotes;
  
  const MIN_MIDI = 48; // C3
  const MAX_MIDI = 83; // B4
  
  const minMidi = Math.min(...midiNotes);
  const maxMidi = Math.max(...midiNotes);
  
  let adjusted = [...midiNotes];
  
  // 若最低音低于 C3 则和弦整体高八度
  while (Math.min(...adjusted) < MIN_MIDI) {
    adjusted = adjusted.map(m => m + 12);
  }
  
  // 若最高音高于 B4 则和弦整体低八度
  while (Math.max(...adjusted) > MAX_MIDI) {
    adjusted = adjusted.map(m => m - 12);
  }
  
  return adjusted;
}

export function transposeChord(chordName: string, semitones: number): string {
  if (semitones === 0) return chordName;

  // 处理斜线和弦
  const slashIndex = chordName.indexOf('/');
  if (slashIndex > 0) {
    const mainChord = chordName.substring(0, slashIndex);
    const bassNote = chordName.substring(slashIndex + 1);
    const transposedMain = transposeChord(mainChord, semitones);
    const transposedBass = transposeNoteSimple(bassNote, semitones);
    return transposedMain + '/' + transposedBass;
  }

  const match = chordName.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chordName;

  const root = match[1];
  const suffix = match[2];
  const transposed = transposeNoteSimple(root, semitones);
  return transposed + suffix;
}

// 简单的音符转调（返回等音名称，如 Db 而不是 C#，不包含八度）
function transposeNoteSimple(noteName: string, semitones: number): string {
  const baseMidi = getNoteMidi(noteName);
  // 使用模运算确保结果在 0-11 范围内
  const newMidi = ((baseMidi + semitones) % 12 + 12) % 12;
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  // 转换为更常用的等音名称（使用降号）
  const sharpToFlatMap: Record<string, string> = {
    'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'
  };
  return sharpToFlatMap[noteNames[newMidi]] || noteNames[newMidi];
}

// 将升号转换为更常用的降号表示
function sharpToFlat(note: string): string {
  const sharpToFlatMap: Record<string, string> = {
    'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb',
    'E#': 'F', 'B#': 'C'
  };
  const match = note.match(/^([A-G][#b]?)(\d+)$/);
  if (!match) return note;
  const notePart = match[1];
  const octave = match[2];
  return (sharpToFlatMap[notePart] || notePart) + octave;
}

export function getPianoNotes(startOctave: number = 4, octaves: number = 2): string[] {
  const notes: string[] = [];
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  for (let oct = 0; oct < octaves; oct++) {
    for (const note of noteNames) {
      notes.push(`${note}${startOctave + oct}`);
    }
  }
  return notes;
}

export function isBlackKey(note: string): boolean {
  return note.includes('#');
}

export function parseChordInput(input: string): string[] {
  return input
    .split(/[\s,]+/)
    .map(c => c.trim())
    .map(c => {
      // 处理双重降号 bb -> 转换为等效音名
      // Bb = A#, Bbm -> A#m, Bbm7 -> A#m7
      c = c.replace(/^([A-G])b(b)/i, (match, note) => {
        // 双重降号：bb = 本音降两个半音 = 等于下一个音的降号
        const noteMap: Record<string, string> = {
          'C': 'B', 'D': 'C#', 'E': 'D#', 'F': 'E', 'G': 'F#', 'A': 'G#', 'B': 'A#'
        };
        return noteMap[note.toUpperCase()] || match;
      });
      
      // 只对根音转大写，保留后缀大小写
      const match = c.match(/^([A-G][#b]?)(.*)$/i);
      if (match) {
        return match[1].toUpperCase() + match[2];
      }
      return c.toUpperCase();
    })
    .filter(c => c.length > 0 && /^[A-G][#b]?(maj7|m7|m9|m11|m13|m7b5|dim7|dim|aug7|aug|sus4|sus2|7sus4|7|6|9|11|13|m|add\d+|madd\d+)?(\/[A-G][#b]?)?$/.test(c));
}
