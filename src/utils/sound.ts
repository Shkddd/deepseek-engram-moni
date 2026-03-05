// 改进的音效系统 - 带翻转/泡泡/duang效果
let audioContext: any = null;

const createSound = (freq: number, duration: number, type: string = 'sine', volume: number = 0.1) => {
  if (typeof window === 'undefined') return;
  try {
    if (!audioContext) audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    osc.start();
    osc.stop(audioContext.currentTime + duration);
  } catch (e) {}
};

// 泡泡音效 - 正确时
export const playBubbleSound = () => {
  [400, 600, 800].forEach((f, i) => {
    setTimeout(() => createSound(f, 0.15, 'sine', 0.15), i * 50);
  });
};

// Duang音效 - 错误时
export const playDuangSound = () => {
  createSound(150, 0.3, 'square', 0.2);
  setTimeout(() => createSound(100, 0.4, 'square', 0.2), 100);
};

// 成功音效 - 过关
export const playSuccessSound = () => {
  const notes = [523, 659, 784, 1047, 1318];
  notes.forEach((freq, i) => {
    setTimeout(() => createSound(freq, 0.2, 'sine', 0.12), i * 100);
  });
};

// 翻转音效
export const playFlipSound = () => {
  createSound(300, 0.08, 'sine', 0.1);
};

// 背景音乐
let bgMusicInterval: any = null;
let isPlaying = false;

const classicMelody = [
  { freq: 523, dur: 0.25 }, { freq: 659, dur: 0.25 }, { freq: 784, dur: 0.25 },
  { freq: 659, dur: 0.25 }, { freq: 523, dur: 0.25 }, { freq: 0, dur: 0.25 },
];
const endlessMelody = [
  { freq: 440, dur: 0.2 }, { freq: 523, dur: 0.2 }, { freq: 659, dur: 0.2 },
  { freq: 523, dur: 0.2 }, { freq: 440, dur: 0.2 }, { freq: 0, dur: 0.15 },
];
const survivalMelody = [
  { freq: 220, dur: 0.35 }, { freq: 247, dur: 0.35 }, { freq: 277, dur: 0.35 },
  { freq: 220, dur: 0.35 }, { freq: 0, dur: 0.2 },
];

const getMelody = (mode: string) => {
  switch (mode) {
    case 'endless': return endlessMelody;
    case 'survival': return survivalMelody;
    default: return classicMelody;
  }
};

export const playBackgroundMusic = (mode: string) => {
  try {
    stopBackgroundMusic();
    isPlaying = true;
    const melody = getMelody(mode);
    let i = 0;
    bgMusicInterval = setInterval(() => {
      if (!isPlaying) return;
      const n = melody[i];
      if (n.freq > 0) createSound(n.freq, n.dur, mode === 'endless' ? 'square' : 'sine', 0.05);
      i = (i + 1) % melody.length;
    }, 250);
  } catch (e) {}
};

export const stopBackgroundMusic = () => {
  isPlaying = false;
  if (bgMusicInterval) clearInterval(bgMusicInterval);
};

export const playTapSound = () => createSound(600, 0.05);
export const playCorrectSound = () => playBubbleSound();
export const playWrongSound = () => playDuangSound();
export const playLevelUpSound = () => playSuccessSound();

export const playGameOverSound = () => {
  [400, 350, 300, 250, 200].forEach((f, i) => 
    setTimeout(() => createSound(f, 0.3, 'square', 0.15), i * 150)
  );
};
