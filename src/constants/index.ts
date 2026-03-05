// 🎮 记忆翻翻看游戏 - 常量
export const COLORS = {
  primary: '#e94560',
  success: '#00b894',
  error: '#ff7675',
  warning: '#fdcb6e',
};

export const GRID_SIZES = { easy: 3, medium: 4, hard: 5 };

export const LEVELS = [
  { gridSize: 3, showTime: 3000, name: '简单 - 3x3' },
  { gridSize: 3, showTime: 3500, name: '简单 - 3x3' },
  { gridSize: 4, showTime: 4000, name: '中等 - 4x4' },
  { gridSize: 4, showTime: 4500, name: '中等 - 4x4' },
  { gridSize: 5, showTime: 5000, name: '困难 - 5x5' },
  { gridSize: 5, showTime: 5500, name: '困难 - 5x5' },
];

export type ItemType = 'animals' | 'fruits' | 'ocean' | 'space';
