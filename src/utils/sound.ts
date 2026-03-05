// 音效模块 - 使用 Web Audio API 生成游戏音效
import { Audio } from 'expo-av';

let backgroundMusic: Audio.Sound | null = null;

// 经典模式音乐 - 轻快活泼
const classicMusic = {
  // 使用振荡器生成简单旋律
  notes: [262, 294, 330, 349, 392, 349, 330, 294, 262, 0, 294, 330, 349, 392, 440, 392, 349, 330, 294, 0],
  duration: 0.3,
};

// 无尽模式音乐 - 紧张刺激
const endlessMusic = {
  notes: [330, 349, 392, 440, 392, 349, 330, 349, 0, 330, 349, 392, 440, 523, 440, 392, 349, 330, 0, 0],
  duration: 0.25,
};

// 生存模式音乐 - 紧张悬疑
const survivalMusic = {
  notes: [220, 247, 277, 311, 349, 311, 277, 247, 220, 0, 220, 247, 277, 311, 370, 311, 277, 247, 220, 0],
  duration: 0.35,
};

// 播放音符
const playNote = (frequency: number, duration: number, type: 'square' | 'sine' = 'sine') => {
  if (typeof window === 'undefined') return;
  
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

// 播放背景音乐（循环）
export const playBackgroundMusic = async (mode: 'classic' | 'endless' | 'survival' | 'menu') => {
  try {
    await stopBackgroundMusic();
    
    const music = mode === 'classic' ? classicMusic : 
                  mode === 'endless' ? endlessMusic : 
                  mode === 'survival' ? survivalMusic : null;
    
    if (!music) return;
    
    let currentNote = 0;
    const playNextNote = () => {
      if (music.notes[currentNote] > 0) {
        playNote(music.notes[currentNote], music.duration, mode === 'endless' ? 'square' : 'sine');
      }
      currentNote = (currentNote + 1) % music.notes.length;
    };
    
    // 播放循环
    const interval = setInterval(playNextNote, music.duration * 1000);
    
    // 保存 interval ID 以便停止
    (window as any).__bgMusicInterval = interval;
  } catch (e) {
    console.log('Audio error:', e);
  }
};

export const stopBackgroundMusic = async () => {
  try {
    const interval = (window as any).__bgMusicInterval;
    if (interval) {
      clearInterval(interval);
      (window as any).__bgMusicInterval = null;
    }
    if (backgroundMusic) {
      await backgroundMusic.unloadAsync();
      backgroundMusic = null;
    }
  } catch (e) {
    console.log('Stop music error:', e);
  }
};

// 播放点击音效
export const playTapSound = () => {
  playNote(800, 0.1, 'sine');
};

// 播放正确音效
export const playCorrectSound = () => {
  playNote(523, 0.1, 'sine');
  setTimeout(() => playNote(659, 0.1, 'sine'), 100);
  setTimeout(() => playNote(784, 0.15, 'sine'), 200);
};

// 播放错误音效
export const playWrongSound = () => {
  playNote(200, 0.2, 'square');
  setTimeout(() => playNote(150, 0.3, 'square'), 200);
};

// 播放过关音效
export const playLevelUpSound = () => {
  const notes = [523, 659, 784, 1047];
  notes.forEach((note, i) => {
    setTimeout(() => playNote(note, 0.2, 'sine'), i * 150);
  });
};

// 播放游戏结束音效
export const playGameOverSound = () => {
  const notes = [400, 350, 300, 250, 200];
  notes.forEach((note, i) => {
    setTimeout(() => playNote(note, 0.3, 'square'), i * 200);
  });
};
