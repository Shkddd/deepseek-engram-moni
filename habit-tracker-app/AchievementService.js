import AsyncStorage from '@react-native-async-storage/async-storage';

// 成就定义
const ACHIEVEMENTS = [
  // 打卡相关
  {
    id: 'first_checkin',
    name: '初次打卡',
    description: '完成第一次打卡',
    icon: '🎉',
    condition: (stats) => stats.totalCheckins >= 1,
  },
  {
    id: 'checkin_10',
    name: '小试牛刀',
    description: '累计打卡10次',
    icon: '💪',
    condition: (stats) => stats.totalCheckins >= 10,
  },
  {
    id: 'checkin_50',
    name: '持之以恒',
    description: '累计打卡50次',
    icon: '🏅',
    condition: (stats) => stats.totalCheckins >= 50,
  },
  {
    id: 'checkin_100',
    name: '百次达人',
    description: '累计打卡100次',
    icon: '🏆',
    condition: (stats) => stats.totalCheckins >= 100,
  },
  {
    id: 'checkin_500',
    name: '五百辉煌',
    description: '累计打卡500次',
    icon: '👑',
    condition: (stats) => stats.totalCheckins >= 500,
  },
  
  // 连续打卡相关
  {
    id: 'streak_3',
    name: '三天打鱼',
    description: '连续打卡3天',
    icon: '🔥',
    condition: (stats) => stats.maxStreak >= 3,
  },
  {
    id: 'streak_7',
    name: '一周坚持',
    description: '连续打卡7天',
    icon: '✨',
    condition: (stats) => stats.maxStreak >= 7,
  },
  {
    id: 'streak_21',
    name: '三周进阶',
    description: '连续打卡21天',
    icon: '🌟',
    condition: (stats) => stats.maxStreak >= 21,
  },
  {
    id: 'streak_50',
    name: '习惯养成',
    description: '连续打卡50天',
    icon: '💎',
    condition: (stats) => stats.maxStreak >= 50,
  },
  {
    id: 'streak_100',
    name: '百日英雄',
    description: '连续打卡100天',
    icon: '🎖️',
    condition: (stats) => stats.maxStreak >= 100,
  },
  
  // 习惯数量相关
  {
    id: 'habit_1',
    name: '新开始',
    description: '添加第1个习惯',
    icon: '🌱',
    condition: (stats) => stats.totalHabits >= 1,
  },
  {
    id: 'habit_3',
    name: '三角战士',
    description: '添加3个习惯',
    icon: '🌿',
    condition: (stats) => stats.totalHabits >= 3,
  },
  {
    id: 'habit_5',
    name: '五福临门',
    description: '添加5个习惯',
    icon: '🍀',
    condition: (stats) => stats.totalHabits >= 5,
  },
  {
    id: 'habit_10',
    name: '十项全能',
    description: '添加10个习惯',
    icon: '🎯',
    condition: (stats) => stats.totalHabits >= 10,
  },
  
  // 今日完成相关
  {
    id: 'today_done',
    name: '今日事今日毕',
    description: '今日所有习惯都已打卡',
    icon: '✅',
    condition: (stats) => stats.completedToday >= stats.totalHabits && stats.totalHabits > 0,
  },
  
  // 笔记相关
  {
    id: 'first_note',
    name: '第一笔',
    description: '写下第一条笔记',
    icon: '📝',
    condition: (stats) => stats.totalNotes >= 1,
  },
  {
    id: 'note_10',
    name: '记录者',
    description: '累计写10条笔记',
    icon: '📒',
    condition: (stats) => stats.totalNotes >= 10,
  },
  {
    id: 'note_50',
    name: '日记达人',
    description: '累计写50条笔记',
    icon: '📚',
    condition: (stats) => stats.totalNotes >= 50,
  },
  
  // 综合成就
  {
    id: 'perfect_week',
    name: '完美一周',
    description: '连续7天完成所有打卡',
    icon: '🌈',
    condition: (stats) => stats.maxStreak >= 7 && stats.completionRate >= 80,
  },
  {
    id: 'all_rounder',
    name: '全能选手',
    description: '同时拥有5个习惯且都坚持打卡',
    icon: '🏅',
    condition: (stats) => stats.totalHabits >= 5 && stats.completionRate >= 60,
  },
];

// 获取用户统计
const getUserStats = async () => {
  try {
    const [habitsData, notesData] = await Promise.all([
      AsyncStorage.getItem('habits'),
      AsyncStorage.getItem('notes'),
    ]);
    
    const habits = habitsData ? JSON.parse(habitsData) : [];
    const notes = notesData ? JSON.parse(notesData) : [];
    
    const totalHabits = habits.length;
    const totalCheckins = habits.reduce((sum, h) => sum + h.totalCheckins, 0);
    const maxStreak = Math.max(0, ...habits.map(h => h.streak || 0));
    const completedToday = habits.filter(h => h.completedToday).length;
    const completionRate = totalHabits > 0 ? (habits.filter(h => h.streak > 0).length / totalHabits) * 100 : 0;
    
    return {
      totalHabits,
      totalCheckins,
      maxStreak,
      completedToday,
      completionRate,
      totalNotes: notes.length,
    };
  } catch (error) {
    console.error('获取用户统计失败:', error);
    return {
      totalHabits: 0,
      totalCheckins: 0,
      maxStreak: 0,
      completedToday: 0,
      completionRate: 0,
      totalNotes: 0,
    };
  }
};

// 获取已解锁的成就
export const getUnlockedAchievements = async () => {
  try {
    const unlocked = await AsyncStorage.getItem('achievements');
    return unlocked ? JSON.parse(unlocked) : [];
  } catch (error) {
    console.error('获取成就失败:', error);
    return [];
  }
};

// 检查并解锁新成就
export const checkAndUnlockAchievements = async () => {
  try {
    const stats = await getUserStats();
    const unlockedIds = await getUnlockedAchievements();
    const newUnlocked = [];
    
    for (const achievement of ACHIEVEMENTS) {
      if (!unlockedIds.includes(achievement.id) && achievement.condition(stats)) {
        unlockedIds.push(achievement.id);
        newUnlocked.push(achievement);
      }
    }
    
    if (newUnlocked.length > 0) {
      await AsyncStorage.setItem('achievements', JSON.stringify(unlockedIds));
    }
    
    return newUnlocked;
  } catch (error) {
    console.error('检查成就失败:', error);
    return [];
  }
};

// 获取所有成就状态
export const getAllAchievements = async () => {
  try {
    const stats = await getUserStats();
    const unlockedIds = await getUnlockedAchievements();
    
    return ACHIEVEMENTS.map(achievement => ({
      ...achievement,
      unlocked: unlockedIds.includes(achievement.id),
      progress: calculateProgress(achievement, stats),
    }));
  } catch (error) {
    console.error('获取所有成就失败:', error);
    return [];
  }
};

// 计算成就进度
const calculateProgress = (achievement, stats) => {
  // 简单进度计算
  if (achievement.id === 'streak_100') return Math.min(100, (stats.maxStreak / 100) * 100);
  if (achievement.id === 'streak_50') return Math.min(100, (stats.maxStreak / 50) * 100);
  if (achievement.id === 'streak_21') return Math.min(100, (stats.maxStreak / 21) * 100);
  if (achievement.id === 'streak_7') return Math.min(100, (stats.maxStreak / 7) * 100);
  if (achievement.id === 'streak_3') return Math.min(100, (stats.maxStreak / 3) * 100);
  if (achievement.id === 'checkin_500') return Math.min(100, (stats.totalCheckins / 500) * 100);
  if (achievement.id === 'checkin_100') return Math.min(100, (stats.totalCheckins / 100) * 100);
  if (achievement.id === 'checkin_50') return Math.min(100, (stats.totalCheckins / 50) * 100);
  if (achievement.id === 'checkin_10') return Math.min(100, (stats.totalCheckins / 10) * 100);
  if (achievement.id === 'habit_10') return Math.min(100, (stats.totalHabits / 10) * 100);
  if (achievement.id === 'habit_5') return Math.min(100, (stats.totalHabits / 5) * 100);
  if (achievement.id === 'habit_3') return Math.min(100, (stats.totalHabits / 3) * 100);
  if (achievement.id === 'habit_1') return Math.min(100, (stats.totalHabits / 1) * 100);
  if (achievement.id === 'note_50') return Math.min(100, (stats.totalNotes / 50) * 100);
  if (achievement.id === 'note_10') return Math.min(100, (stats.totalNotes / 10) * 100);
  return 0;
};

// 获取成就统计
export const getAchievementStats = async () => {
  try {
    const unlockedIds = await getUnlockedAchievements();
    return {
      total: ACHIEVEMENTS.length,
      unlocked: unlockedIds.length,
      locked: ACHIEVEMENTS.length - unlockedIds.length,
    };
  } catch (error) {
    return { total: ACHIEVEMENTS.length, unlocked: 0, locked: ACHIEVEMENTS.length };
  }
};
