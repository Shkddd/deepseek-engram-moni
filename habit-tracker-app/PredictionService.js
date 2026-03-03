import AsyncStorage from '@react-native-async-storage/async-storage';

// 简单的预测服务 - 基于规则而非复杂 ML 模型
// 在实际生产环境中可以使用 TensorFlow.js 进行更复杂的预测

// 计算连续打卡天数
const calculateStreak = (habits) => {
  let maxStreak = 0;
  habits.forEach(h => {
    if (h.streak > maxStreak) maxStreak = h.streak;
  });
  return maxStreak;
};

// 计算完成率
const calculateCompletionRate = (habits) => {
  if (habits.length === 0) return 0;
  const completed = habits.filter(h => h.streak > 0).length;
  return (completed / habits.length) * 100;
};

// 获取星期几 (0-6, 0 是周日)
const getDayOfWeek = () => new Date().getDay();

// 是否是周末
const isWeekend = () => {
  const day = getDayOfWeek();
  return day === 0 || day === 6;
};

// 计算预测评分
export const calculateHabitScore = async () => {
  try {
    const habitsData = await AsyncStorage.getItem('habits');
    if (!habitsData) {
      return getDefaultScore();
    }
    
    const habits = JSON.parse(habitsData);
    if (habits.length === 0) {
      return getDefaultScore();
    }

    // 提取特征
    const totalHabits = habits.length;
    const totalCheckins = habits.reduce((sum, h) => sum + h.totalCheckins, 0);
    const maxStreak = calculateStreak(habits);
    const completionRate = calculateCompletionRate(habits);
    const avgCheckins = totalHabits > 0 ? totalCheckins / totalHabits : 0;
    
    // 今日完成情况
    const completedToday = habits.filter(h => h.completedToday).length;
    const todayCompletionRate = (completedToday / totalHabits) * 100;
    
    // 时间因素
    const isWeekendDay = isWeekend();
    const dayOfWeek = getDayOfWeek();
    
    // === 评分算法 ===
    let score = 0;
    const factors = [];

    // 1. 基础完成率 (30分)
    const baseScore = completionRate * 0.3;
    score += baseScore;
    factors.push({ name: '历史完成率', score: baseScore, max: 30, desc: `${completionRate.toFixed(0)}%` });

    // 2. 连续打卡 (25分)
    const streakScore = Math.min(25, maxStreak * 2.5);
    score += streakScore;
    factors.push({ name: '最长连续', score: streakScore, max: 25, desc: `${maxStreak}天` });

    // 3. 今日状态 (20分)
    const todayScore = (todayCompletionRate / 100) * 20;
    score += todayScore;
    factors.push({ name: '今日进度', score: todayScore, max: 20, desc: `${completedToday}/${totalHabits}` });

    // 4. 活跃度 (15分)
    const activityScore = Math.min(15, avgCheckins * 1.5);
    score += activityScore;
    factors.push({ name: '活跃度', score: activityScore, max: 15, desc: `场均${avgCheckins.toFixed(1)}次` });

    // 5. 周末动力 (10分)
    let weekendBonus = 0;
    if (isWeekendDay) {
      // 周末降低预期
      weekendBonus = 10 * (completionRate / 100);
    } else {
      // 工作日正常
      weekendBonus = 10;
    }
    score += weekendBonus;
    factors.push({ name: isWeekendDay ? '周末加成' : '动力充沛', score: weekendBonus, max: 10, desc: isWeekendDay ? '周末' : '工作日' });

    // 确保分数在 0-100 之间
    score = Math.round(Math.min(100, Math.max(0, score)));

    // 生成预测和建议
    const prediction = generatePrediction(score, completionRate, maxStreak, completedToday, totalHabits);

    return {
      score,
      level: getScoreLevel(score),
      factors,
      prediction,
      stats: {
        totalHabits,
        totalCheckins,
        maxStreak,
        completionRate: completionRate.toFixed(1),
        completedToday,
        todayCompletionRate: todayCompletionRate.toFixed(1),
      },
    };
  } catch (error) {
    console.error('计算评分失败:', error);
    return getDefaultScore();
  }
};

// 获取默认评分
const getDefaultScore = () => ({
  score: 0,
  level: '暂无数据',
  factors: [],
  prediction: {
    tomorrowProbability: 0,
    riskLevel: 'unknown',
    suggestions: ['添加习惯并开始打卡后，即可获得评分'],
  },
  stats: {
    totalHabits: 0,
    totalCheckins: 0,
    maxStreak: 0,
    completionRate: '0',
    completedToday: 0,
    todayCompletionRate: '0',
  },
});

// 获取评分等级
const getScoreLevel = (score) => {
  if (score >= 90) return '🏆 超级优秀';
  if (score >= 75) return '🌟 非常优秀';
  if (score >= 60) return '👍 表现良好';
  if (score >= 40) return '💪 尚需努力';
  if (score >= 20) return '⚠️ 风险较大';
  return '😰 紧急提醒';
};

// 生成预测和建议
const generatePrediction = (score, completionRate, maxStreak, completedToday, totalHabits) => {
  let tomorrowProbability = completionRate;
  let riskLevel = 'low';
  let suggestions = [];

  // 根据今日完成情况调整预测
  if (completedToday === 0 && totalHabits > 0) {
    tomorrowProbability = Math.max(0, completionRate - 30);
    riskLevel = 'high';
    suggestions.push('⚠️ 今日还未打卡，抓紧时间！');
  } else if (completedToday < totalHabits) {
    suggestions.push(`📌 还有 ${totalHabits - completedToday} 个习惯未完成`);
  }

  // 根据连续天数给出建议
  if (maxStreak >= 7) {
    suggestions.push('🔥 保持好势头！连续打卡很重要');
  } else if (maxStreak > 0) {
    suggestions.push(`💪 当前连续 ${maxStreak} 天，继续保持！`);
  }

  // 根据评分给出总体建议
  if (score >= 75) {
    suggestions.push('✨ 表现超级棒！坚持下去就是胜利');
  } else if (score >= 50) {
    suggestions.push('📈 不错的开始，每天进步一点点');
  } else {
    suggestions.push('🎯 习惯养成需要坚持，从小事做起');
  }

  // 周末特殊建议
  if (isWeekend()) {
    suggestions.push('☕ 周末也要坚持哦，习惯成自然');
  }

  return {
    tomorrowProbability: Math.round(tomorrowProbability),
    riskLevel,
    suggestions,
  };
};

// 获取历史趋势数据（用于图表）
export const getTrendData = async () => {
  try {
    const habitsData = await AsyncStorage.getItem('habits');
    if (!habitsData) return null;
    
    const habits = JSON.parse(habitsData);
    
    // 模拟最近7天的趋势数据（基于现有数据）
    const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const today = new Date().getDay();
    
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const dayIndex = (today - i + 7) % 7;
      // 模拟数据：今天和过去的数据基于实际值，未来几天基于预测
      const isFuture = i > 0;
      const baseValue = isFuture ? 0 : (Math.random() * totalStreak * 0.3);
      const value = isFuture 
        ? Math.round(totalStreak * (1 - i * 0.1)) 
        : Math.round(totalStreak * 0.2 + baseValue);
      
      trendData.push({
        day: days[dayIndex],
        value: Math.max(0, value),
        isFuture,
      });
    }
    
    return trendData;
  } catch (error) {
    console.error('获取趋势数据失败:', error);
    return null;
  }
};
