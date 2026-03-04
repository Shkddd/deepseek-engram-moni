import 'react-native-gesture-handler';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Dimensions,
  Image,
  Modal,
  Pressable,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import * as ImagePicker from 'expo-image-picker';
import ChatScreen from './ChatScreen';
import ScheduleScreen from './ScheduleScreen';
import {
  requestNotificationPermission,
  enableDailyReminder,
  cancelDailyReminder,
} from './NotificationService';
import { calculateHabitScore } from './PredictionService';
import { getAllAchievements, getAchievementStats, checkAndUnlockAchievements } from './AchievementService';
import AchievementSection from './AchievementSection';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// 主题 Context
export const ThemeContext = createContext();

// 主题配置
const lightTheme = {
  dark: false,
  colors: {
    background: '#F5F6F7',
    card: '#FFFFFF',
    text: '#1D2129',
    textLight: '#86909C',
    border: '#E5E6EB',
    primary: '#3370FF',
    primaryDark: '#1F4EDB',
    success: '#00B365',
    danger: '#F53F3F',
    warning: '#FF7D00',
    gray: '#F5F6F7',
    inputBg: '#f9f9f9',
  },
};

const darkTheme = {
  dark: true,
  colors: {
    background: '#1A1A1A',
    card: '#2D2D2D',
    text: '#E8E8E8',
    textLight: '#A0A0A0',
    border: '#404040',
    primary: '#4A8AFF',
    primaryDark: '#3370FF',
    success: '#00D97E',
    danger: '#FF6B6B',
    warning: '#FF9F43',
    gray: '#2D2D2D',
    inputBg: '#3D3D3D',
  },
};

// 主屏幕 - 习惯列表
function HomeScreen({ navigation }) {
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [habitHistory, setHabitHistory] = useState([]); // 历史习惯频率
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    loadHabits();
    loadHabitHistory();
  }, []);

  // 加载历史习惯频率
  const loadHabitHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('habitHistory');
      if (history) {
        setHabitHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('加载历史习惯失败:', error);
    }
  };

  // 保存习惯并更新历史频率
  const updateHabitHistory = async (habitName) => {
    try {
      let history = habitHistory;
      const existing = history.find(h => h.name === habitName);
      if (existing) {
        existing.count += 1;
        existing.lastUsed = new Date().toISOString();
      } else {
        history.push({ name: habitName, count: 1, lastUsed: new Date().toISOString() });
      }
      // 按频率排序
      history.sort((a, b) => b.count - a.count);
      // 保留前20个
      history = history.slice(0, 20);
      await AsyncStorage.setItem('habitHistory', JSON.stringify(history));
      setHabitHistory(history);
    } catch (error) {
      console.error('保存历史习惯失败:', error);
    }
  };

  const loadHabits = async () => {
    try {
      const stored = await AsyncStorage.getItem('habits');
      if (stored) {
        setHabits(JSON.parse(stored));
      }
    } catch (error) {
      console.error('加载习惯失败:', error);
    }
  };

  const saveHabits = async (newHabits) => {
    try {
      await AsyncStorage.setItem('habits', JSON.stringify(newHabits));
      setHabits(newHabits);
    } catch (error) {
      console.error('保存习惯失败:', error);
      Alert.alert('错误', '保存失败');
    }
  };

  const addHabit = () => {
    if (!newHabit.trim()) {
      Alert.alert('提示', '请输入习惯名称');
      return;
    }
    const habit = {
      id: Date.now().toString(),
      name: newHabit.trim(),
      streak: 0,
      completedToday: false,
      totalCheckins: 0,
      createdAt: new Date().toISOString(),
    };
    saveHabits([habit, ...habits]);
    updateHabitHistory(newHabit.trim()); // 更新历史频率
    setNewHabit('');
  };

  // 快速添加历史习惯并打卡
  const quickAddHabit = (habitName) => {
    // 检查是否已存在
    const existing = habits.find(h => h.name === habitName);
    if (existing) {
      // 已存在，直接打卡
      checkIn(existing.id);
      updateHabitHistory(habitName); // 更新历史频率
      return;
    }
    // 新建习惯并打卡
    const habit = {
      id: Date.now().toString(),
      name: habitName,
      streak: 1,
      completedToday: true,
      totalCheckins: 1,
      createdAt: new Date().toISOString(),
    };
    saveHabits([habit, ...habits]);
    updateHabitHistory(habitName);
    Alert.alert('🎉', `添加"${habitName}"并打卡成功！`);
  };

  const checkIn = (id) => {
    const updated = habits.map((h) => {
      if (h.id === id) {
        return {
          ...h,
          completedToday: true,
          streak: h.streak + 1,
          totalCheckins: h.totalCheckins + 1,
        };
      }
      return h;
    });
    saveHabits(updated);
    Alert.alert('🎉', '打卡成功！继续加油！');
  };

  const deleteHabit = (id) => {
    Alert.alert('确认', '确定要删除这个习惯吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => saveHabits(habits.filter((h) => h.id !== id)),
      },
    ]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHabits().then(() => setRefreshing(false));
  };

  const totalHabits = habits.length;
  const completedToday = habits.filter((h) => h.completedToday).length;
  const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);

  const renderHabit = ({ item }) => (
    <View style={[styles.habitCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.habitHeader}>
        <Text style={[styles.habitName, { color: theme.colors.text }]}>{item.name}</Text>
        <View style={[styles.streakBadge, { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }]}>
          <Text style={[styles.streakText, { color: theme.colors.primary }]}>🔥 {item.streak}天</Text>
        </View>
      </View>
      <Text style={[styles.habitStats, { color: theme.colors.textLight }]}>
        总打卡：{item.totalCheckins}次 | 创建：{new Date(item.createdAt).toLocaleDateString('zh-CN')}
      </Text>
      <View style={styles.habitActions}>
        <TouchableOpacity
          style={[styles.checkInButton, { backgroundColor: theme.colors.success }, item.completedToday && { backgroundColor: theme.colors.textLight }]}
          onPress={() => checkIn(item.id)}
          disabled={item.completedToday}
        >
          <Text style={styles.checkInText}>
            {item.completedToday ? '✓ 已完成' : '✓ 打卡'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.colors.gray, borderColor: theme.colors.border }]}
          onPress={() => deleteHabit(item.id)}
        >
          <Text style={[styles.deleteText, { color: theme.colors.danger }]}>删除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.primary} />
      
      <View style={[styles.statsContainer, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{totalHabits}</Text>
          <Text style={styles.statLabel}>总习惯</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{completedToday}/{totalHabits}</Text>
          <Text style={styles.statLabel}>今日完成</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{totalStreak}</Text>
          <Text style={styles.statLabel}>累计天数</Text>
        </View>
      </View>

      {/* 常用习惯快速打卡区域 */}
      {habitHistory.length > 0 && (
        <View style={[styles.historyContainer, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.historyTitle, { color: theme.colors.text }]}>⚡ 常用习惯 (点击即打卡)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyScroll}>
            {habitHistory.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.historyChip, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary }]}
                onPress={() => quickAddHabit(item.name)}
              >
                <Text style={[styles.historyChipText, { color: theme.colors.primary }]}>{item.name}</Text>
                <Text style={[styles.historyChipCount, { color: theme.colors.textLight }]}>{item.count}次</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={[styles.addContainer, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, color: theme.colors.text }]}
          placeholder="输入新习惯..."
          placeholderTextColor={theme.colors.textLight}
          value={newHabit}
          onChangeText={setNewHabit}
          onSubmitEditing={addHabit}
        />
        <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]} onPress={addHabit}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={habits}
        renderItem={renderHabit}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textLight }]}>还没有习惯</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textLight }]}>点击上方输入框添加第一个习惯</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.navButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('Stats')}
      >
        <Text style={styles.navButtonText}>📊 查看统计</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// 统计屏幕
function StatsScreen() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [habitScore, setHabitScore] = useState(null);
  const { theme } = useContext(ThemeContext);

  // 使用 useFocusEffect 确保每次切换到统计页面时刷新数据
  useFocusEffect(
    React.useCallback(() => {
      loadHabits();
      loadHabitScore();
    }, [])
  );

  const loadHabits = async () => {
    try {
      const stored = await AsyncStorage.getItem('habits');
      if (stored) {
        setHabits(JSON.parse(stored));
      }
      setLoading(false);
    } catch (error) {
      console.error('加载失败:', error);
      setLoading(false);
    }
  };

  const loadHabitScore = async () => {
    try {
      const scoreData = await calculateHabitScore();
      setHabitScore(scoreData);
    } catch (error) {
      console.error('加载评分失败:', error);
    }
  };

  const totalCheckins = habits.reduce((sum, h) => sum + h.totalCheckins, 0);
  const avgStreak = habits.length > 0 
    ? (habits.reduce((sum, h) => sum + h.streak, 0) / habits.length).toFixed(1)
    : 0;
  const completedHabits = habits.filter(h => h.streak > 0).length;
  const completionRate = habits.length > 0 
    ? ((completedHabits / habits.length) * 100).toFixed(0)
    : 0;

  const habitCheckinMap = habits.reduce((acc, h) => {
    acc[h.name] = (acc[h.name] || 0) + h.totalCheckins;
    return acc;
  }, {});
  const sortedHabits = Object.entries(habitCheckinMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  
  // 计算纵坐标最大值和间隔
  const maxCheckins = sortedHabits.length > 0 ? sortedHabits[0][1] : 10;
  const yAxisInterval = Math.ceil(maxCheckins / 5); // 5 个刻度
  
  const chartData = {
    labels: sortedHabits.map(([name]) => name.length > 8 ? name.substring(0, 8) + '...' : name),
    datasets: [{
      data: sortedHabits.map(([, count]) => count)
    }]
  };

  const pieData = [
    {
      name: '已完成习惯',
      population: completedHabits,
      color: '#28a745',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
    {
      name: '未开始习惯',
      population: habits.length - completedHabits,
      color: '#dc3545',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
  ];

  const getPastDates = (days) => {
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(`${d.getMonth() + 1}/${d.getDate()}`);
    }
    return dates;
  };
  const totalStreakSum = habits.reduce((sum, h) => sum + h.streak, 0);
  const totalCheckinsSum = habits.reduce((sum, h) => sum + h.totalCheckins, 0);
  const daysToShow = Math.min(7, Math.max(1, Math.ceil(totalStreakSum / 5)));
  
  // 计算折线图纵坐标间隔
  const lineMaxValue = totalCheckinsSum > 0 ? totalCheckinsSum : 10;
  const lineYAxisInterval = Math.ceil(lineMaxValue / 5);
  
  const lineData = {
    labels: getPastDates(daysToShow),
    datasets: [{
      data: Array.from({ length: daysToShow }, (_, i) => {
        const progress = (i + 1) / daysToShow;
        return Math.floor(totalCheckinsSum * progress);
      })
    }]
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>加载统计数据...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.card} />
      <ScrollView style={styles.statsScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.statsFull}>
          <Text style={styles.statsTitle}>📊 数据统计</Text>
          
          {/* 习惯评分卡片 */}
          {habitScore && habitScore.score > 0 && (
            <View style={[styles.scoreCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={styles.scoreHeader}>
                <Text style={[styles.scoreTitle, { color: theme.colors.text }]}>🎯 习惯健康评分</Text>
                <Text style={[styles.scoreLevel, { color: theme.colors.primary }]}>{habitScore.level}</Text>
              </View>
              <View style={styles.scoreBody}>
                <View style={styles.scoreCircle}>
                  <Text style={[styles.scoreNumber, { color: theme.colors.primary }]}>{habitScore.score}</Text>
                  <Text style={[styles.scoreMax, { color: theme.colors.textLight }]}>/100</Text>
                </View>
                <View style={styles.scoreFactors}>
                  {habitScore.factors.slice(0, 3).map((factor, index) => (
                    <View key={index} style={styles.factorRow}>
                      <Text style={[styles.factorName, { color: theme.colors.textLight }]}>{factor.name}</Text>
                      <View style={styles.factorBarBg}>
                        <View style={[styles.factorBarFill, { width: `${(factor.score / factor.max) * 100}%`, backgroundColor: theme.colors.primary }]} />
                      </View>
                      <Text style={[styles.factorScore, { color: theme.colors.text }]}>{factor.score.toFixed(0)}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.predictionSection}>
                <Text style={[styles.predictionTitle, { color: theme.colors.text }]}>📈 明日预测</Text>
                <Text style={[styles.predictionProb, { color: theme.colors.primary }]}>完成概率: {habitScore.prediction.tomorrowProbability}%</Text>
                {habitScore.prediction.suggestions.slice(0, 2).map((suggestion, index) => (
                  <Text key={index} style={[styles.suggestionText, { color: theme.colors.textLight }]}>• {suggestion}</Text>
                ))}
              </View>
            </View>
          )}
          
          <View style={styles.bigStats}>
            <View style={styles.bigStatBox}>
              <Text style={styles.bigStatNumber}>{habits.length}</Text>
              <Text style={styles.bigStatLabel}>习惯总数</Text>
            </View>
            <View style={styles.bigStatBox}>
              <Text style={styles.bigStatNumber}>{totalCheckins}</Text>
              <Text style={styles.bigStatLabel}>总打卡</Text>
            </View>
            <View style={styles.bigStatBox}>
              <Text style={styles.bigStatNumber}>{avgStreak}</Text>
              <Text style={styles.bigStatLabel}>平均连胜</Text>
            </View>
          </View>

          <View style={styles.completionCard}>
            <Text style={styles.completionTitle}>📈 习惯完成率</Text>
            <View style={styles.completionRow}>
              <Text style={styles.completionPercent}>{completionRate}%</Text>
              <View style={styles.completionBar}>
                <View style={[styles.completionFill, { width: `${completionRate}%` }]} />
              </View>
            </View>
            <Text style={styles.completionSubtext}>{completedHabits}/{habits.length} 习惯已坚持</Text>
          </View>

          {habits.length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={[styles.chartTitle, { color: theme.colors.text }]}>🏆 打卡次数排行</Text>
              <BarChart
                data={chartData}
                width={Dimensions.get('window').width - 60}
                height={220}
                yAxisLabel=""
                yAxisSuffix="次"
                yAxisInterval={yAxisInterval}
                chartConfig={{
                  backgroundColor: theme.colors.card,
                  backgroundGradientFrom: theme.colors.card,
                  backgroundGradientTo: theme.colors.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => theme.dark ? `rgba(74, 138, 255, ${opacity})` : `rgba(51, 112, 255, ${opacity})`,
                  labelColor: (opacity = 1) => theme.dark ? `rgba(232, 232, 232, ${opacity})` : `rgba(29, 33, 41, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: theme.colors.primary,
                  },
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                showBarTops={true}
                showValuesOnTopOfBars={true}
              />
            </View>
          )}

          {habits.length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={[styles.chartTitle, { color: theme.colors.text }]}>📊 习惯完成分布</Text>
              <PieChart
                data={pieData}
                width={Dimensions.get('window').width - 60}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => theme.dark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          )}

          {habits.length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={[styles.chartTitle, { color: theme.colors.text }]}>📉 连胜增长趋势</Text>
              <LineChart
                data={lineData}
                width={Dimensions.get('window').width - 60}
                height={220}
                yAxisLabel=""
                yAxisSuffix="次"
                yAxisInterval={lineYAxisInterval}
                chartConfig={{
                  backgroundColor: theme.colors.card,
                  backgroundGradientFrom: theme.colors.card,
                  backgroundGradientTo: theme.colors.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => theme.dark ? `rgba(74, 138, 255, ${opacity})` : `rgba(51, 112, 255, ${opacity})`,
                  labelColor: (opacity = 1) => theme.dark ? `rgba(232, 232, 232, ${opacity})` : `rgba(29, 33, 41, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: theme.colors.primary,
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            </View>
          )}

          <Text style={styles.sectionTitle}>📋 习惯详情</Text>
          {habits.map((habit) => (
            <View key={habit.id} style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailName}>{habit.name}</Text>
                <View style={styles.streakBadgeSmall}>
                  <Text style={styles.streakTextSmall}>🔥 {habit.streak}天</Text>
                </View>
              </View>
              <Text style={styles.detailStats}>
                总打卡：{habit.totalCheckins}次 | 创建：{new Date(habit.createdAt).toLocaleDateString('zh-CN')}
              </Text>
            </View>
          ))}
          {habits.length === 0 && (
            <View style={styles.emptyChartContainer}>
              <Text style={styles.emptyChartIcon}>📊</Text>
              <Text style={styles.emptyChartText}>还没有统计数据</Text>
              <Text style={styles.emptyChartSubtext}>添加习惯并打卡后，这里会显示图表</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// 记事本屏幕 - 支持图片
function NotesScreen() {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [noteImages, setNoteImages] = useState([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const stored = await AsyncStorage.getItem('notes');
      if (stored) {
        setNotes(JSON.parse(stored));
      }
    } catch (error) {
      console.error('加载笔记失败:', error);
    }
  };

  const saveNotes = async (newNotes) => {
    try {
      await AsyncStorage.setItem('notes', JSON.stringify(newNotes));
      setNotes(newNotes);
    } catch (error) {
      console.error('保存笔记失败:', error);
      Alert.alert('错误', '保存失败');
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('提示', '需要访问相册权限才能选择图片');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      setNoteImages([...noteImages, imageUri]);
    }
  };

  const addNote = () => {
    if (!newNote.trim() && noteImages.length === 0) {
      Alert.alert('提示', '请输入笔记内容或选择图片');
      return;
    }
    const note = {
      id: Date.now().toString(),
      content: newNote.trim(),
      images: noteImages,
      createdAt: new Date().toISOString(),
    };
    saveNotes([note, ...notes]);
    setNewNote('');
    setNoteImages([]);
    Alert.alert('✓', '笔记已保存');
  };

  const deleteNote = (id) => {
    Alert.alert(
      '确认删除',
      '确定要删除这条笔记吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            const updated = notes.filter((n) => n.id !== id);
            saveNotes(updated);
          },
        },
      ]
    );
  };

  const removeImage = (index) => {
    const updated = noteImages.filter((_, i) => i !== index);
    setNoteImages(updated);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const mins = Math.floor(diff / (1000 * 60));
        return mins < 1 ? '刚刚' : `${mins}分钟前`;
      }
      return `${hours}小时前`;
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const totalNotes = notes.length;
  const todayNotes = notes.filter(n => {
    const noteDate = new Date(n.createdAt);
    const today = new Date();
    return noteDate.toDateString() === today.toDateString();
  }).length;

  const renderNoteItem = ({ item }) => {
    return (
      <View style={[styles.noteCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        {item.content ? (
          <Text style={[styles.noteContent, { color: theme.colors.text }]}>{item.content}</Text>
        ) : null}
        {item.images && item.images.length > 0 && (
          <View style={styles.noteImagesContainer}>
            {item.images.map((img, index) => (
              <Image
                key={index}
                source={{ uri: img }}
                style={styles.noteImage}
                resizeMode="cover"
              />
            ))}
          </View>
        )}
        <View style={styles.noteFooter}>
          <Text style={[styles.noteDate, { color: theme.colors.textLight }]}>{formatDate(item.createdAt)}</Text>
          <TouchableOpacity
            style={[styles.noteDeleteButton, { borderColor: theme.colors.danger }]}
            onPress={() => deleteNote(item.id)}
          >
            <Text style={[styles.noteDeleteText, { color: theme.colors.danger }]}>删除</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.card} />
      
      <View style={[styles.statsContainer, { backgroundColor: theme.colors.card }]}>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: theme.colors.primary }]}>{totalNotes}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textLight }]}>总笔记</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: theme.colors.primary }]}>{todayNotes}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textLight }]}>今日记录</Text>
        </View>
      </View>

      <View style={[styles.addContainer, { backgroundColor: theme.colors.card }]}>
        <View style={styles.noteInputWrapper}>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top', backgroundColor: theme.colors.inputBg, color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="记录今天的想法、日记或待办..."
            placeholderTextColor={theme.colors.textLight}
            value={newNote}
            onChangeText={setNewNote}
            multiline
          />
          {noteImages.length > 0 && (
            <View style={styles.imagePreviewContainer}>
              {noteImages.map((img, index) => (
                <View key={index} style={styles.imagePreviewWrapper}>
                  <Image source={{ uri: img }} style={styles.imagePreview} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Text style={styles.removeImageText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <View style={styles.imagePickerButton}>
            <TouchableOpacity onPress={pickImage} style={[styles.pickImageButton, { borderColor: theme.colors.border }]}>
              <Text style={[styles.pickImageText, { color: theme.colors.primary }]}>📷 添加图片</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]} onPress={addNote}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={renderNoteItem}
        contentContainerStyle={[styles.listContent, { backgroundColor: theme.colors.background }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadNotes}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textLight }]}>📝 还没有笔记</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textLight }]}>点击上方输入框记录你的想法</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// 首页仪表盘 - 方块模块布局
function DashboardScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);

  const modules = [
    { name: '打卡', icon: '📋', screen: 'Habits', color: '#3370FF' },
    { name: '统计', icon: '📊', screen: 'Stats', color: '#00B365' },
    { name: '记事', icon: '📝', screen: 'Notes', color: '#FF7D00' },
    { name: '日程', icon: '📅', screen: 'Schedule', color: '#F53F3F' },
  ];

  const renderModule = ({ item }) => (
    <TouchableOpacity
      style={[styles.moduleCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      onPress={() => navigation.navigate(item.screen)}
    >
      <Text style={styles.moduleIcon}>{item.icon}</Text>
      <Text style={[styles.moduleName, { color: theme.colors.text }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.primary} />
      <View style={[styles.dashboardHeader, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.dashboardTitle, { color: theme.colors.text }]}>⚡ 习惯追踪器</Text>
      </View>
      <FlatList
        data={modules}
        renderItem={renderModule}
        keyExtractor={(item) => item.name}
        numColumns={2}
        contentContainerStyle={styles.moduleGrid}
        columnWrapperStyle={styles.moduleRow}
      />
    </SafeAreaView>
  );
}

// 设置屏幕
function SettingsScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { darkMode, toggleDarkMode, theme } = useContext(ThemeContext);
  
  // 提醒功能状态
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(20);
  const [reminderMinute, setReminderMinute] = useState(0);

  useEffect(() => {
    loadSettings();
    loadReminderSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [user, pass] = await Promise.all([
        AsyncStorage.getItem('settings_username'),
        AsyncStorage.getItem('settings_password'),
      ]);
      if (user) setUsername(user);
      if (pass) setPassword(pass);
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  };

  const loadReminderSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem('reminder_enabled');
      const hour = await AsyncStorage.getItem('reminder_hour');
      const minute = await AsyncStorage.getItem('reminder_minute');
      
      setReminderEnabled(enabled === 'true');
      setReminderHour(hour ? parseInt(hour) : 20);
      setReminderMinute(minute ? parseInt(minute) : 0);
    } catch (error) {
      console.error('加载提醒设置失败:', error);
    }
  };

  const toggleReminder = async (value) => {
    try {
      setReminderEnabled(value);
      if (value) {
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
          Alert.alert('权限不足', '需要通知权限才能使用提醒功能');
          setReminderEnabled(false);
          return;
        }
        await enableDailyReminder(reminderHour, reminderMinute);
        Alert.alert('✓', `已开启每日 ${reminderHour}:${String(reminderMinute).padStart(2, '0')} 提醒`);
      } else {
        await cancelDailyReminder();
        Alert.alert('✓', '已关闭每日提醒');
      }
    } catch (error) {
      console.error('切换提醒失败:', error);
      Alert.alert('错误', '设置提醒失败');
    }
  };

  const updateReminderTime = async () => {
    try {
      if (reminderEnabled) {
        await cancelDailyReminder();
        await enableDailyReminder(reminderHour, reminderMinute);
      }
      await AsyncStorage.setItem('reminder_hour', String(reminderHour));
      await AsyncStorage.setItem('reminder_minute', String(reminderMinute));
      Alert.alert('✓', `提醒时间已设置为 ${reminderHour}:${String(reminderMinute).padStart(2, '0')}`);
    } catch (error) {
      console.error('更新提醒时间失败:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('settings_username', username);
      await AsyncStorage.setItem('settings_password', password);
      Alert.alert('✓', '设置已保存');
    } catch (error) {
      console.error('保存设置失败:', error);
      Alert.alert('错误', '保存失败');
    }
  };

  const exportData = async () => {
    setLoading(true);
    try {
      const [habitsStr, notesStr] = await Promise.all([
        AsyncStorage.getItem('habits'),
        AsyncStorage.getItem('notes'),
      ]);

      const habits = habitsStr ? JSON.parse(habitsStr) : [];
      const notes = notesStr ? JSON.parse(notesStr) : [];

      let mdContent = `# 习惯追踪器数据导出\n\n`;
      mdContent += `**导出时间:** ${new Date().toLocaleString('zh-CN')}\n`;
      mdContent += `**用户名:** ${username || '未设置'}\n\n`;
      mdContent += `---\n\n`;

      mdContent += `## 📊 数据统计\n\n`;
      mdContent += `- 习惯总数：${habits.length}\n`;
      mdContent += `- 总打卡次数：${habits.reduce((sum, h) => sum + h.totalCheckins, 0)}\n`;
      mdContent += `- 平均连胜：${habits.length > 0 ? (habits.reduce((sum, h) => sum + h.streak, 0) / habits.length).toFixed(1) : 0}天\n`;
      mdContent += `- 笔记总数：${notes.length}\n\n`;
      mdContent += `---\n\n`;

      mdContent += `## 🎯 习惯列表\n\n`;
      if (habits.length > 0) {
        mdContent += `| 习惯名称 | 连胜天数 | 总打卡 | 创建日期 |\n`;
        mdContent += `|---------|---------|-------|----------|\n`;
        habits.forEach(h => {
          mdContent += `| ${h.name} | 🔥 ${h.streak}天 | ${h.totalCheckins}次 | ${new Date(h.createdAt).toLocaleDateString('zh-CN')} |\n`;
        });
      } else {
        mdContent += `*暂无习惯记录*\n`;
      }
      mdContent += `\n---\n\n`;

      mdContent += `## 📝 笔记列表\n\n`;
      if (notes.length > 0) {
        notes.forEach((note, index) => {
          mdContent += `### 笔记 ${index + 1}\n\n`;
          if (note.content) {
            mdContent += `${note.content}\n\n`;
          }
          if (note.images && note.images.length > 0) {
            mdContent += `**图片:** ${note.images.length}张\n\n`;
          }
          mdContent += `_创建时间：${new Date(note.createdAt).toLocaleString('zh-CN')}_\n\n`;
          mdContent += `---\n\n`;
        });
      } else {
        mdContent += `*暂无笔记记录*\n`;
      }

      // 保存到文件
      const fileName = `habit_tracker_export_${Date.now()}.md`;
      await AsyncStorage.setItem(`export_${fileName}`, mdContent);
      
      Alert.alert(
        '✓ 导出成功',
        `数据已导出为 Markdown 文件\n\n文件名：${fileName}\n\n共 ${habits.length} 条习惯，${notes.length} 条笔记`,
        [{ text: '确定' }]
      );
    } catch (error) {
      console.error('导出数据失败:', error);
      Alert.alert('错误', '导出失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.card} />
      <ScrollView style={styles.settingsScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.settingsContent}>
          <Text style={[styles.settingsTitle, { color: theme.colors.text }]}>⚙️ 设置</Text>

          <View style={styles.settingsSection}>
            <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>🌙 显示设置</Text>
            
            <View style={[styles.switchCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={styles.switchRow}>
                <View style={styles.switchContent}>
                  <Text style={[styles.switchTitle, { color: theme.colors.text }]}>夜间模式</Text>
                  <Text style={[styles.switchDesc, { color: theme.colors.textLight }]}>
                    {darkMode ? '已开启，保护眼睛' : '已关闭，明亮主题'}
                  </Text>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={toggleDarkMode}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor={darkMode ? theme.colors.primary : '#f4f3f4'}
                />
              </View>
            </View>
          </View>

          <View style={styles.settingsSection}>
            <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>⏰ 习惯提醒</Text>
            
            <View style={[styles.switchCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={styles.switchRow}>
                <View style={styles.switchContent}>
                  <Text style={[styles.switchTitle, { color: theme.colors.text }]}>每日打卡提醒</Text>
                  <Text style={[styles.switchDesc, { color: theme.colors.textLight }]}>
                    {reminderEnabled ? `每天 ${reminderHour}:${String(reminderMinute).padStart(2, '0')} 提醒` : '已关闭'}
                  </Text>
                </View>
                <Switch
                  value={reminderEnabled}
                  onValueChange={toggleReminder}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor={reminderEnabled ? theme.colors.primary : '#f4f3f4'}
                />
              </View>
            </View>

            {reminderEnabled && (
              <View style={styles.reminderTimeContainer}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>提醒时间</Text>
                <View style={styles.timePickerRow}>
                  <View style={styles.timePickerWrapper}>
                    <Text style={[styles.timeLabel, { color: theme.colors.textLight }]}>时</Text>
                    <TextInput
                      style={[styles.timeInput, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                      value={String(reminderHour)}
                      onChangeText={(text) => {
                        const val = parseInt(text) || 0;
                        setReminderHour(Math.min(23, Math.max(0, val)));
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                  <Text style={[styles.timeSeparator, { color: theme.colors.text }]}>:</Text>
                  <View style={styles.timePickerWrapper}>
                    <Text style={[styles.timeLabel, { color: theme.colors.textLight }]}>分</Text>
                    <TextInput
                      style={[styles.timeInput, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                      value={String(reminderMinute)}
                      onChangeText={(text) => {
                        const val = parseInt(text) || 0;
                        setReminderMinute(Math.min(59, Math.max(0, val)));
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                  <TouchableOpacity 
                    style={[styles.updateTimeButton, { backgroundColor: theme.colors.primary }]} 
                    onPress={updateReminderTime}
                  >
                    <Text style={styles.updateTimeButtonText}>更新</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={styles.settingsSection}>
            <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>👤 账户信息</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>用户名</Text>
              <TextInput
                style={[styles.settingsInput, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="输入用户名"
                placeholderTextColor={theme.colors.textLight}
                value={username}
                onChangeText={setUsername}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>密码</Text>
              <TextInput
                style={[styles.settingsInput, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="输入密码"
                placeholderTextColor={theme.colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={saveSettings}>
              <Text style={styles.saveButtonText}>💾 保存设置</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingsSection}>
            <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>📤 数据管理</Text>
            
            <View style={[styles.exportCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <Text style={[styles.exportTitle, { color: theme.colors.text }]}>导出所有数据</Text>
              <Text style={[styles.exportDesc, { color: theme.colors.textLight }]}>
                将习惯记录和记事本内容导出为 Markdown 文件，方便备份和分享
              </Text>
              <TouchableOpacity 
                style={[styles.exportButton, { backgroundColor: theme.colors.primary }, loading && styles.exportButtonDisabled]} 
                onPress={exportData}
                disabled={loading}
              >
                <Text style={styles.exportButtonText}>
                  {loading ? '导出中...' : '📥 导出 MD 文件'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingsSection}>
            <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>🏅 成就徽章</Text>
            <AchievementSection theme={theme} />
          </View>

          <View style={styles.settingsSection}>
            <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>ℹ️ 关于</Text>
            <View style={[styles.aboutCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <Text style={[styles.aboutText, { color: theme.colors.text }]}>习惯追踪器 v1.0.0</Text>
              <Text style={[styles.aboutSubtext, { color: theme.colors.textLight }]}>帮助你养成好习惯的工具</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// 主应用
export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('settings_darkmode');
      if (saved !== null) {
        setDarkMode(saved === 'true');
      }
      setThemeLoaded(true);
    } catch (error) {
      console.error('加载主题失败:', error);
      setThemeLoaded(true);
    }
  };

  const toggleDarkMode = async (value) => {
    try {
      setDarkMode(value);
      await AsyncStorage.setItem('settings_darkmode', String(value));
    } catch (error) {
      console.error('保存主题失败:', error);
    }
  };

  if (!themeLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3370FF" />
      </SafeAreaView>
    );
  }

  const theme = darkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, theme }}>
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.card,
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            },
            headerTintColor: theme.colors.text,
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
              color: theme.colors.text,
            },
            headerTitleAlign: 'center',
            tabBarStyle: {
              backgroundColor: theme.colors.card,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              paddingBottom: 8,
              paddingTop: 8,
              height: 60,
            },
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.textLight,
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
            },
          }}
        >
        <Tab.Screen
          name="Home"
          component={DashboardScreen}
          options={{ 
            title: '首页',
            tabBarLabel: '首页',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: 24 }}>🏠</Text>
            ),
            headerShown: false,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ 
            title: '设置',
            tabBarLabel: '设置',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: 24 }}>⚙️</Text>
            ),
            headerTitle: '⚙️ 设置',
          }}
        />
        <Tab.Screen
          name="Chat"
          component={ChatScreen}
          options={{ 
            title: '聊天',
            tabBarLabel: '聊天',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: 24 }}>💬</Text>
            ),
            headerTitle: '💬 P2P 聊天',
          }}
        />
        {/* 子页面（不显示在 Tab 中） */}
        <Tab.Screen
          name="Habits"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsScreen}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="Notes"
          component={NotesScreen}
        />
        <Tab.Screen
          name="Schedule"
          component={ScheduleScreen}
          options={{ headerShown: false }}
          options={{ headerShown: false }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  // 首页仪表盘样式
  dashboardHeader: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E6EB',
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  moduleGrid: {
    padding: 15,
  },
  moduleRow: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  moduleCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E6EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moduleIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  moduleName: {
    fontSize: 18,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F6F7',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E6EB',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3370FF',
  },
  statLabel: {
    fontSize: 12,
    color: '#86909C',
  },
  // 常用习惯区域
  historyContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E6EB',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  historyScroll: {
    flexDirection: 'row',
    paddingRight: 15,
  },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  historyChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyChipCount: {
    fontSize: 11,
    marginLeft: 4,
  },
  addContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  addButton: {
    width: 50,
    height: 50,
    backgroundColor: '#3370FF',
    borderRadius: 10,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#3370FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 15,
  },
  habitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E6EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  habitName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D2129',
  },
  streakBadge: {
    backgroundColor: '#E8F3FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3370FF',
  },
  streakText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3370FF',
  },
  habitStats: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  habitActions: {
    flexDirection: 'row',
    gap: 10,
  },
  checkInButton: {
    flex: 1,
    backgroundColor: '#00B365',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkedButton: {
    backgroundColor: '#86909C',
  },
  checkInText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#F5F6F7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E6EB',
  },
  deleteText: {
    color: '#F53F3F',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  navButton: {
    backgroundColor: '#3370FF',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#3370FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  statsScroll: {
    flex: 1,
  },
  statsFull: {
    padding: 15,
  },
  statsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1D2129',
    marginBottom: 20,
  },
  bigStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  bigStatBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E6EB',
  },
  bigStatNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3370FF',
  },
  bigStatLabel: {
    fontSize: 12,
    color: '#86909C',
    marginTop: 5,
  },
  completionCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E6EB',
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D2129',
    marginBottom: 15,
  },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  completionPercent: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3370FF',
    marginRight: 15,
    width: 60,
  },
  completionBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#E8F3FF',
    borderRadius: 6,
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    backgroundColor: '#3370FF',
    borderRadius: 6,
  },
  completionSubtext: {
    fontSize: 13,
    color: '#86909C',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E6EB',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D2129',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D2129',
    marginBottom: 15,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E6EB',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D2129',
  },
  streakBadgeSmall: {
    backgroundColor: '#E8F3FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3370FF',
  },
  streakTextSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3370FF',
  },
  detailStats: {
    fontSize: 12,
    color: '#666',
  },
  emptyChartContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyChartIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyChartText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  emptyChartSubtext: {
    fontSize: 13,
    color: '#999',
  },
  // 记事本样式
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E6EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noteContent: {
    fontSize: 16,
    color: '#1D2129',
    marginBottom: 10,
    lineHeight: 24,
  },
  noteImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  noteImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  noteDate: {
    fontSize: 12,
    color: '#86909C',
  },
  noteDeleteButton: {
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  noteDeleteText: {
    color: '#F53F3F',
    fontSize: 12,
    fontWeight: '600',
  },
  noteInputWrapper: {
    flex: 1,
    marginRight: 10,
  },
  imagePickerButton: {
    marginTop: 10,
  },
  pickImageButton: {
    backgroundColor: '#F5F6F7',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E6EB',
    alignItems: 'center',
  },
  pickImageText: {
    fontSize: 14,
    color: '#3370FF',
    fontWeight: '600',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  imagePreviewWrapper: {
    position: 'relative',
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#F53F3F',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // 设置页面样式
  settingsScroll: {
    flex: 1,
  },
  settingsContent: {
    padding: 15,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D2129',
    marginBottom: 20,
  },
  settingsSection: {
    marginBottom: 25,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D2129',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#1D2129',
    marginBottom: 8,
    fontWeight: '500',
  },
  settingsInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E6EB',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1D2129',
  },
  saveButton: {
    backgroundColor: '#3370FF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exportCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E6EB',
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D2129',
    marginBottom: 8,
  },
  exportDesc: {
    fontSize: 13,
    color: '#86909C',
    marginBottom: 15,
    lineHeight: 20,
  },
  exportButton: {
    backgroundColor: '#3370FF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButtonDisabled: {
    backgroundColor: '#86909C',
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  aboutCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E6EB',
    alignItems: 'center',
  },
  aboutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D2129',
    marginBottom: 5,
  },
  aboutSubtext: {
    fontSize: 13,
    color: '#86909C',
  },
  // 夜间模式开关样式
  switchCard: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchContent: {
    flex: 1,
    marginRight: 15,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  switchDesc: {
    fontSize: 13,
  },
  // 提醒时间选择样式
  reminderTimeContainer: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E6EB',
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 10,
  },
  timePickerWrapper: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  timeInput: {
    width: 60,
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  timeSeparator: {
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 15,
  },
  updateTimeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 10,
  },
  updateTimeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  // 习惯评分样式
  scoreCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreLevel: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 12,
  },
  scoreFactors: {
    flex: 1,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  factorName: {
    fontSize: 11,
    width: 50,
  },
  factorBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E6EB',
    borderRadius: 3,
    marginHorizontal: 6,
  },
  factorBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  factorScore: {
    fontSize: 11,
    width: 20,
    textAlign: 'right',
  },
  predictionSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E6EB',
  },
  predictionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  predictionProb: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
