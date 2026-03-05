import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, Dimensions, Animated, Easing } from 'react-native';
import { COLORS, ItemType } from '../constants';
import { playBackgroundMusic, stopBackgroundMusic, playCorrectSound, playWrongSound, playLevelUpSound, playGameOverSound } from '../utils/sound';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CELL_SIZE = 70;

interface GridCell {
  id: number;
  row: number;
  col: number;
  emoji: string;
  isTarget: boolean;
  isRevealed: boolean;
}

type GameMode = 'classic' | 'endless' | 'survival';
type GameState = 'menu' | 'memorize' | 'playing' | 'levelComplete' | 'result';

const THEMES = {
  animals: {
    name: '动物世界',
    bg: '#1a1a2e',
    card: '#16213e',
    target: '#e94560',
    emoji: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'],
  },
  fruits: {
    name: '水果派对',
    bg: '#2d3436',
    card: '#00b894',
    target: '#fdcb6e',
    emoji: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🥝', '🥥'],
  },
  ocean: {
    name: '海洋世界',
    bg: '#0c2461',
    card: '#1e3799',
    target: '#4a69bd',
    emoji: ['🐳', '🐬', '🐙', '🦈', '🐠', '🐡', '🐟', '🦐', '🦑', '🦀', '🐢', '🐬'],
  },
  space: {
    name: '太空漫游',
    bg: '#0f0f23',
    card: '#1a1a3e',
    target: '#9b59b6',
    emoji: ['🚀', '🛸', '🌍', '🌙', '⭐', '🌟', '💫', '☄️', '🪐', '🔭', '👨‍🚀', '👩‍🚀'],
  },
};

const GRID_CONFIGS: Record<number, { cellSize: number; gap: number }> = {
  3: { cellSize: Math.min((SCREEN_WIDTH - 80) / 3, MAX_CELL_SIZE), gap: 5 },
  4: { cellSize: Math.min((SCREEN_WIDTH - 100) / 4, MAX_CELL_SIZE), gap: 4 },
  5: { cellSize: Math.min((SCREEN_WIDTH - 120) / 5, MAX_CELL_SIZE), gap: 3 },
};

const getLevelConfig = (level: number, mode: GameMode) => {
  if (mode === 'endless') {
    const gridSizes = [3, 3, 3, 4, 4, 4, 5, 5];
    const gridSize = gridSizes[Math.min(level, gridSizes.length - 1)];
    const targetCount = Math.min(3 + Math.floor(level / 5), 8);
    const showTime = Math.max(3000 - level * 20, 1500);
    return { gridSize, targetCount, showTime };
  }
  
  const configs = [
    { gridSize: 3, targetCount: 3, showTime: 3000 },
    { gridSize: 3, targetCount: 3, showTime: 3000 },
    { gridSize: 3, targetCount: 4, showTime: 3000 },
    { gridSize: 4, targetCount: 4, showTime: 3500 },
    { gridSize: 4, targetCount: 4, showTime: 3500 },
    { gridSize: 4, targetCount: 5, showTime: 3500 },
    { gridSize: 5, targetCount: 5, showTime: 4000 },
    { gridSize: 5, targetCount: 5, showTime: 4000 },
    { gridSize: 5, targetCount: 6, showTime: 4000 },
  ];
  return configs[Math.min(level, configs.length - 1)];
};

const AnimatedCell: React.FC<{ children: React.ReactNode; animate: boolean; style?: any }> = ({ children, animate, style }) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animate) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 450,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 450,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [animate]);

  return (
    <Animated.View style={[style, { transform: [{ scale: pulseAnim }] }]}>
      {children}
    </Animated.View>
  );
};

const MemoryGameScreen: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [grid, setGrid] = useState<GridCell[]>([]);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [targetEmoji, setTargetEmoji] = useState('');
  const [targetCount, setTargetCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<ItemType>('animals');
  const [totalProgress, setTotalProgress] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<'time' | 'lives' | 'complete' | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const theme = THEMES[selectedTheme] || THEMES.animals;
  const levelConfig = getLevelConfig(currentLevel, gameMode);
  const gridConfig = GRID_CONFIGS[levelConfig.gridSize] || GRID_CONFIGS[3];
  const gridWidth = gridConfig.cellSize * levelConfig.gridSize + gridConfig.gap * (levelConfig.gridSize - 1);

  // 主题渐变背景
  const getBackgroundStyle = () => {
    const themeGradients: Record<string, string[]> = {
      animals: ['#1a1a2e', '#16213e', '#0f3460'],
      fruits: ['#2d3436', '#00b894', '#00cec9'],
      ocean: ['#0c2461', '#1e3799', '#0a3d62'],
      space: ['#0f0f23', '#1a1a3e', '#2d3436'],
    };
    const colors = themeGradients[selectedTheme] || themeGradients.animals;
    return { backgroundColor: colors[0] };
  };

  useEffect(() => {
    if (gameState === 'playing' && (gameMode === 'survival' || gameMode === 'classic' || gameMode === 'endless') && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      playGameOverSound();
      setGameOverReason('time');
      setGameState('result');
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, gameState, gameMode]);

  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    setScore(0);
    setLives(mode === 'classic' || mode === 'endless' ? 3 : 5);
    setCurrentLevel(0);
    setCorrectCount(0);
    setTotalProgress([]);
    if (mode === 'survival') {
      // 生存模式：4秒开始，每关减少0.2秒，最少2秒
      setTimeLeft(4);
    } else if (mode === 'classic' || mode === 'endless') {
      setTimeLeft(6);
    }
    playBackgroundMusic(mode);
    startLevel(0, mode);
  };

  const rerollLevel = () => {
    startLevel(currentLevel, gameMode);
  };

  const startLevel = (level: number, mode: GameMode = gameMode) => {
    if (level >= 100 && mode === 'classic') {
      setGameState('result');
      return;
    }

    const config = getLevelConfig(level, mode);
    const totalCells = config.gridSize * config.gridSize;
    const emojis = theme.emoji;
    
    const target = emojis[Math.floor(Math.random() * emojis.length)];
    setTargetEmoji(target);
    setTargetCount(config.targetCount);

    let targetIndices = new Set<number>();
    while (targetIndices.size < config.targetCount) {
      targetIndices.add(Math.floor(Math.random() * totalCells));
    }

    let newGrid: GridCell[] = [];
    for (let i = 0; i < totalCells; i++) {
      const row = Math.floor(i / config.gridSize);
      const col = i % config.gridSize;
      const isTarget = targetIndices.has(i);
      newGrid.push({
        id: i,
        row,
        col,
        emoji: isTarget ? target : emojis[Math.floor(Math.random() * emojis.length)],
        isTarget,
        isRevealed: false,
      });
    }

    if (mode === 'endless' && level > 0) {
      const targets = newGrid.filter(c => c.isTarget);
      const nonTargets = newGrid.filter(c => !c.isTarget);
      
      if (targets.length > 0 && nonTargets.length > 0) {
        const moveFrom = targets[Math.floor(Math.random() * targets.length)];
        const moveTo = nonTargets[Math.floor(Math.random() * nonTargets.length)];
        
        moveFrom.isTarget = false;
        moveFrom.emoji = moveTo.emoji;
        moveTo.isTarget = true;
        moveTo.emoji = target;
      }
    }

    setGrid(newGrid);
    setGameState('memorize');

    if (gameMode === 'classic' || gameMode === 'endless') {
      setTimeLeft(6);
    }

    setTimeout(() => {
      setGrid(newGrid.map(cell => ({ ...cell, isRevealed: false })));
      setGameState('playing');
    }, config.showTime);
  };

  const handleCellPress = (index: number) => {
    if (gameState !== 'playing') return;
    const cell = grid[index];
    if (cell.isRevealed) return;

    const newGrid = [...grid];
    newGrid[index] = { ...cell, isRevealed: true };
    setGrid(newGrid);

    const isTargetCell = cell.isTarget;
    const newScore = isTargetCell ? score + 10 : Math.max(0, score - 5);
    const newLives = isTargetCell ? lives : lives - 1;
    const newCorrectCount = isTargetCell ? correctCount + 1 : correctCount;

    if (isTargetCell) {
      setScore(newScore);
      setCorrectCount(newCorrectCount);
      playCorrectSound();
      Vibration.vibrate(50);
    } else {
      setScore(newScore);
      setLives(newLives);
      playWrongSound();
      Vibration.vibrate(200);
    }

    setTimeout(() => {
      if (newCorrectCount >= targetCount) {
        setGameOverReason('complete');
        setTotalProgress(prev => [...prev, newScore]);
        playLevelUpSound();
        setGameState('levelComplete');
        
        const nextLevel = currentLevel + 1;
        setTimeout(() => {
          setCurrentLevel(nextLevel);
          setCorrectCount(0);
          setLives(gameMode === 'survival' ? 5 : 3);
          setGameOverReason(null);
          if (gameMode === 'survival') {
            // 生存模式：4秒开始，每关减少0.2秒，最少2秒
            const timeLimit = Math.max(4 - nextLevel * 0.2, 2);
            setTimeLeft(Math.floor(timeLimit));
          } else if (gameMode === 'classic' || gameMode === 'endless') {
            setTimeLeft(6);
          }
          startLevel(nextLevel);
        }, 1500);
      } else if (newLives <= 0) {
        playGameOverSound();
        setGameOverReason('lives');
        setGameState('result');
      }
    }, 100);
  };

  const exitGame = () => {
    stopBackgroundMusic();
    setGameState('menu');
  };

  const endless = gameMode === 'endless';

  const renderMenu = () => (
    <View style={[styles.menuContainer, { backgroundColor: theme.bg }]}>
      <Text style={styles.title}>🎮 记忆翻翻看</Text>
      <Text style={styles.subtitle}>找出所有相同的图案</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>选择主题</Text>
        <View style={styles.themeGrid}>
          {Object.entries(THEMES).map(([key, t]) => (
            <TouchableOpacity
              key={key}
              style={[styles.themeBtn, selectedTheme === key && styles.themeBtnActive, { backgroundColor: t.card }]}
              onPress={() => setSelectedTheme(key as ItemType)}
            >
              <Text style={styles.themeEmoji}>{t.emoji[0]}</Text>
              <Text style={styles.themeName}>{t.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>选择模式</Text>
        
        <TouchableOpacity style={[styles.modeBtn, { backgroundColor: '#6C5CE7' }]} onPress={() => startGame('classic')}>
          <Text style={styles.modeEmoji}>🏆</Text>
          <Text style={styles.modeTitle}>经典模式</Text>
          <Text style={styles.modeDesc}>100关，6秒时限</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.modeBtn, { backgroundColor: '#00B894' }]} onPress={() => startGame('endless')}>
          <Text style={styles.modeEmoji}>♾️</Text>
          <Text style={styles.modeTitle}>无尽模式</Text>
          <Text style={styles.modeDesc}>无限关卡，目标会移动</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.modeBtn, { backgroundColor: '#E17055' }]} onPress={() => startGame('survival')}>
          <Text style={styles.modeEmoji}>⏱️</Text>
          <Text style={styles.modeTitle}>生存模式</Text>
          <Text style={styles.modeDesc}>时间递减，挑战极限</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMemorize = () => (
    <View style={[styles.gameContainer, { backgroundColor: theme.bg }]}>
      <TouchableOpacity style={styles.exitBtn} onPress={exitGame}>
        <Text style={styles.exitBtnText}>✕ 退出</Text>
      </TouchableOpacity>
      
      <View style={styles.header}>
        <Text style={styles.levelText}>
          {endless ? `第 ${currentLevel + 1} 关` : `第 ${currentLevel + 1} / 100 关`}
        </Text>
        <Text style={[styles.targetText, { color: theme.target }]}>❤️ 记住这些位置</Text>
      </View>

      <View style={[styles.gridContainer, { width: gridWidth, height: gridWidth }]}>
        {Array.from({ length: levelConfig.gridSize }).map((_, row) => (
          <View key={row} style={[styles.gridRow, { height: gridConfig.cellSize }]}>
            {Array.from({ length: levelConfig.gridSize }).map((_, col) => {
              const cell = grid.find(c => c.row === row && c.col === col);
              return (
                <AnimatedCell
                  key={`${row}-${col}`}
                  animate={cell?.isTarget || false}
                  style={[styles.cell, { width: gridConfig.cellSize, backgroundColor: cell?.isTarget ? theme.target : theme.card }]}
                >
                  {cell && <Text style={[styles.cellEmoji, { fontSize: gridConfig.cellSize * 0.45 }]}>{cell.emoji}</Text>}
                  {cell?.isTarget && <Text style={styles.targetMark}>❤️</Text>}
                </AnimatedCell>
              );
            })}
          </View>
        ))}
      </View>

      <View style={[styles.memorizeHint, { backgroundColor: theme.card }]}>
        <Text style={styles.memorizeText}>请快速记忆! {targetCount}个目标</Text>
      </View>
    </View>
  );

  const renderPlaying = () => (
    <View style={[styles.gameContainer, { backgroundColor: theme.bg }]}>
      <TouchableOpacity style={styles.exitBtn} onPress={exitGame}>
        <Text style={styles.exitBtnText}>✕ 退出</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.levelText}>
          {endless ? `第 ${currentLevel + 1} 关` : `第 ${currentLevel + 1} / 100 关`}
        </Text>
        <Text style={[styles.targetText, { color: theme.target }]}>找出: {targetEmoji}</Text>
      </View>

      {(gameMode === 'survival' || gameMode === 'classic' || gameMode === 'endless') && (
        <View style={[styles.timerBox, { backgroundColor: timeLeft <= 3 ? COLORS.error : theme.card }]}>
          <Text style={styles.timerText}>⏱️ {timeLeft}s</Text>
        </View>
      )}

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{score}</Text>
          <Text style={styles.statLabel}>分数</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: lives <= 1 ? COLORS.error : COLORS.success }]}>{lives}</Text>
          <Text style={styles.statLabel}>生命</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{correctCount}/{targetCount}</Text>
          <Text style={styles.statLabel}>进度</Text>
        </View>
      </View>

      <View style={[styles.gridContainer, { width: gridWidth, height: gridWidth }]}>
        {Array.from({ length: levelConfig.gridSize }).map((_, row) => (
          <View key={row} style={[styles.gridRow, { height: gridConfig.cellSize }]}>
            {Array.from({ length: levelConfig.gridSize }).map((_, col) => {
              const cell = grid.find(c => c.row === row && c.col === col);
              const idx = row * levelConfig.gridSize + col;
              return (
                <TouchableOpacity
                  key={`${row}-${col}`}
                  style={[styles.cell, { width: gridConfig.cellSize, backgroundColor: cell?.isRevealed ? (cell?.isTarget ? COLORS.success : COLORS.error) : theme.card }]}
                  onPress={() => handleCellPress(idx)}
                  disabled={cell?.isRevealed}
                >
                  {cell?.isRevealed && <Text style={[styles.cellEmoji, { fontSize: gridConfig.cellSize * 0.45 }]}>{cell.emoji}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <TouchableOpacity style={[styles.diceBtn, { backgroundColor: theme.card }]} onPress={rerollLevel}>
        <Text style={styles.diceText}>🎲 换题</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLevelComplete = () => (
    <View style={[styles.gameContainer, { backgroundColor: theme.bg }]}>
      <Text style={styles.celebrationEmoji}>🎉</Text>
      <Text style={styles.celebrationText}>过关啦!</Text>
      <Text style={styles.celebrationSubtext}>+{10 * (currentLevel + 1)} 分</Text>
      
      <View style={[styles.resultCard, { backgroundColor: theme.card }]}>
        <Text style={styles.progressTitle}>总体进度</Text>
        <View style={styles.progressDots}>
          {endless ? (
            <Text style={styles.endlessText}>已通关 {totalProgress.length} 关</Text>
          ) : (
            Array.from({ length: 10 }).map((_, i) => (
              <View key={i} style={[styles.progressDot, i < Math.floor(currentLevel / 10) && styles.progressDotComplete, i === Math.floor(currentLevel / 10) && styles.progressDotCurrent]} />
            ))
          )}
        </View>
        {!endless && <Text style={styles.progressText}>{currentLevel + 1} / 100 关</Text>}
      </View>
    </View>
  );

  const renderResult = () => {
    const isWin = gameOverReason === 'complete';
    const reasonText = gameOverReason === 'time' ? '时间到!' : gameOverReason === 'lives' ? '生命耗尽' : '游戏结束';
    
    return (
    <View style={[styles.resultContainer, { backgroundColor: theme.bg }]}>
      <Text style={styles.resultEmoji}>{isWin ? '🎉' : '😢'}</Text>
      <Text style={styles.resultTitle}>{isWin ? '恭喜通关!' : reasonText}</Text>
      
      <View style={[styles.resultCard, { backgroundColor: theme.card }]}>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>最终分数</Text>
          <Text style={styles.resultValue}>{score}</Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>{endless ? '通关关卡' : '通过关卡'}</Text>
          <Text style={styles.resultValue}>{currentLevel}{endless ? '' : '/100'}</Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>游戏模式</Text>
          <Text style={styles.resultValue}>
            {gameMode === 'classic' ? '🏆 经典' : endless ? '♾️ 无尽' : '⏱️ 生存'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.target }]} onPress={() => { setGameOverReason(null); setGameState('menu'); }}>
        <Text style={styles.retryBtnText}>返回菜单</Text>
      </TouchableOpacity>
    </View>
  );
  };

  return (
    <View style={styles.container}>
      {gameState === 'menu' && renderMenu()}
      {gameState === 'memorize' && renderMemorize()}
      {gameState === 'playing' && renderPlaying()}
      {gameState === 'levelComplete' && renderLevelComplete()}
      {gameState === 'result' && renderResult()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  menuContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 38, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#aaa', marginBottom: 30 },
  section: { width: '100%', marginBottom: 25 },
  sectionTitle: { fontSize: 16, color: '#fff', marginBottom: 15, textAlign: 'center' },
  themeGrid: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  themeBtn: { alignItems: 'center', padding: 12, margin: 6, borderRadius: 12, width: 75 },
  themeBtnActive: { borderWidth: 2, borderColor: '#fff' },
  themeEmoji: { fontSize: 28 },
  themeName: { fontSize: 11, color: '#fff', marginTop: 4 },
  modeBtn: { padding: 18, marginVertical: 8, borderRadius: 16, width: '100%' },
  modeEmoji: { fontSize: 28 },
  modeTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginTop: 5 },
  modeDesc: { fontSize: 12, color: '#ddd', marginTop: 3 },
  gameContainer: { flex: 1, alignItems: 'center', paddingTop: 30 },
  exitBtn: { position: 'absolute', top: 15, left: 15, paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#333', borderRadius: 20 },
  exitBtnText: { color: '#fff', fontSize: 14 },
  header: { alignItems: 'center', marginBottom: 10 },
  levelText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  targetText: { fontSize: 26, marginTop: 6, fontWeight: 'bold' },
  timerBox: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginBottom: 10 },
  timerText: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  memorizeHint: { padding: 12, borderRadius: 10, marginTop: 20 },
  memorizeText: { fontSize: 16, color: '#fff', fontWeight: 'bold' },
  gridContainer: { flexDirection: 'column' },
  gridRow: { flexDirection: 'row' },
  cell: { justifyContent: 'center', alignItems: 'center', borderRadius: 6, margin: 2 },
  cellEmoji: { color: '#fff' },
  targetMark: { position: 'absolute', top: 2, right: 2, fontSize: 10 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', width: '80%', marginBottom: 12 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 11, color: '#aaa' },
  diceBtn: { marginTop: 15, paddingHorizontal: 25, paddingVertical: 10, borderRadius: 18 },
  diceText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  resultEmoji: { fontSize: 70, marginBottom: 15 },
  resultTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 25 },
  resultCard: { padding: 20, borderRadius: 14, width: '85%', marginBottom: 25 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#333' },
  resultLabel: { fontSize: 14, color: '#aaa' },
  resultValue: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  retryBtn: { paddingHorizontal: 45, paddingVertical: 15, borderRadius: 25 },
  retryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  progressTitle: { fontSize: 16, color: '#fff', marginBottom: 12, textAlign: 'center' },
  progressDots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },
  progressDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#333', marginHorizontal: 4 },
  progressDotComplete: { backgroundColor: COLORS.success },
  progressDotCurrent: { backgroundColor: COLORS.warning, borderWidth: 2, borderColor: '#fff' },
  progressText: { fontSize: 14, color: '#aaa', textAlign: 'center' },
  endlessText: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  celebrationEmoji: { fontSize: 100, marginBottom: 20 },
  celebrationText: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  celebrationSubtext: { fontSize: 24, color: COLORS.success, marginBottom: 30 },
});

export default MemoryGameScreen;
