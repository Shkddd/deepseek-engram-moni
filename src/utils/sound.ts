// 背景音乐模块 - 使用 Web Audio API
let audioContext: any = null;
let isPlaying = false;
let currentMode: string = '';
let musicInterval: any = null;

// 经典模式 - 轻快明亮
const classicMelody = [
  { freq: 523, dur: 0.25 }, { freq: 659, dur: 0.25 }, { freq: 784, dur: 0.25 },
  { freq: 659, dur: 0.25 }, { freq: 523, dur: 0.25 }, { freq: 0, dur: 0.25 },
  { freq: 587, dur: 0.25 }, { freq: 698, dur: 0.25 }, { freq: 880, dur: 0.25 },
  { freq: 698, dur: 0.25 }, { freq: 587, dur: 0.25 }, { freq: 0, dur: 0.25 },
];

// 无尽模式 - 紧张快速
const endlessMelody = [
  { freq: 440, dur: 0.2 }, { freq: 523, dur: 0.2 }, { freq: 659, dur: 0.2 },
  { freq: 523, dur: }, { freq: 0.2 440, dur: 0.2 }, { freq: 0, dur: 0.15 },
  { freq: 494, dur: 0.2 }, { freq: 587, dur: 0.2 }, { freq: 698, dur: 0.2 },
  { freq: 587, dur: 0.2 }, { freq: 494, dur: 0.2 }, { freq: 0, dur: 0.15 },
];

// 生存模式 - 悬疑低沉
const survivalMelody = [
  { freq: 220, dur: 0.35 }, { freq: 247, dur: 0.35 }, { freq: 277, dur: 0.35 },
  { freq: 220, dur: 0.35 }, { freq: 0, dur: 0.2 },
  { freq: 247, dur: 0.35 }, { freq: 277, dur: 0.35 }, { freq: 311, dur: 0.35 },
  { freq: 247, dur: 0.35 }, { freq: 0, dur: 0.2 },
];

const getMelody = (mode: string) => {
  switch (mode) {
    case 'classic': return classicMelody;
    case 'endless': return endlessMelody;
    case 'survival': return survivalMelody;
    default: return classicMelody;
  }
};

const createOscillator = (freq: number, duration: number, type: string = 'sine') => {
  if (typeof window === 'undefined' || freq === 0) return;
  
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = type;
    oscillator.frequency.value = freq;
    
    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (e) {
    console.log('Audio error:', e);
  }
};

export const playBackgroundMusic = (mode: string) => {
  try {
    stopBackgroundMusic();
    
    currentMode = mode;
    isPlaying = true;
    
    const melody = getMelody(mode);
    let noteIndex = 0;
    
    const playNote = () => {
      if (!isPlaying) return;
      
      const note = melody[noteIndex];
      if (note.freq > 0) {
        createOscillator(note.freq, note.dur, mode === 'endless' ? 'square' : 'sine');
      }
      noteIndex = (noteIndex + 1) % melody.length;
    };
    
    // 每300ms播放一个音符
    musicInterval = setInterval(playNote, 300);
    
  } catch (e) {
    console.log('Music error:', e);
  }
};

export const stopBackgroundMusic = () => {
  isPlaying = false;
  currentMode = '';
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
};

// 音效
export const playTapSound = () => createOscillator(600, 0.08);

export const playCorrectSound = () => {
  createOscillator(523, 0.1);
  setTimeout(() => createOscillator(659, 0.1), 100);
  setTimeout(() => createOscillator(784, 0.15), 200);
};

export const playWrongSound = () => {
  createOscillator(200, 0.25, 'square');
  setTimeout(() => createOscillator(150, 0.35, 'square'), 200);
};

export const playLevelUpSound = () => {
  const notes = [523, 659, 784, 1047];
  notes.forEach((note, i) => {
    setTimeout(() => createOscillator(note, 0.2), i * 120);
  });
};

export const playGameOverSound = () => {
  const notes = [400, 350, 300, 250, 200];
  notes.forEach((note, i) => {
    setTimeout(() => createOscillator(note, 0.3, 'square'), i * 180);
  });
};
