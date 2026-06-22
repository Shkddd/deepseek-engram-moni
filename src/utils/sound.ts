// 使用 expo-av 的音效系统
import { Audio, Vibration } from 'expo-av';

let bgSound: Audio.Sound | null = null;
let isMusicPlaying = false;

// 初始化音频
Audio.setAudioModeAsync({
  playsInSilentModeIOS: true,
  staysActiveInBackground: true,
  shouldDuckAndroid: true,
});

// 背景音乐 - 循环播放节拍
export const playBackgroundMusic = async (mode: string) => {
  try {
    await stopBackgroundMusic();
    isMusicPlaying = true;
  } catch (e) {}
};

export const stopBackgroundMusic = async () => {
  isMusicPlaying = false;
  if (bgSound) {
    try {
      await bgSound.stopAsync();
      await bgSound.unloadAsync();
    } catch (e) {}
    bgSound = null;
  }
};

// 泡泡音效 - 正确时
export const playBubbleSound = () => {
  Vibration.vibrate(30);
};

// Duang音效 - 错误时
export const playDuangSound = () => {
  Vibration.vibrate([0, 100, 50, 100]);
};

// 成功音效 - 过关
export const playSuccessSound = () => {
  Vibration.vibrate([0, 50, 30, 50, 30, 100]);
};

// 翻转音效
export const playFlipSound = () => {
  Vibration.vibrate(10);
};

export const playTapSound = () => {
  Vibration.vibrate(5);
};

export const playCorrectSound = () => playBubbleSound();
export const playWrongSound = () => playDuangSound();
export const playLevelUpSound = () => playSuccessSound();

export const playGameOverSound = () => {
  Vibration.vibrate([0, 200, 100, 200, 100, 300]);
};
