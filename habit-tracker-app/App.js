import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';

const Stack = createStackNavigator();

// 主屏幕 - 习惯列表
function HomeScreen({ navigation }) {
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 飞书品牌色 - 高对比度配色
  const feishuBlue = '#3370FF';      // 主蓝色
  const feishuBlueDark = '#1F4EDB';  // 深蓝（强调）
  const feishuWhite = '#FFFFFF';     // 纯白背景
  const feishuGray = '#F5F6F7';      // 浅灰背景
  const feishuText = '#1D2129';      // 深色文字
  const feishuTextLight = '#86909C'; // 浅色文字
  const feishuGreen = '#00B365';     // 成功色
  const feishuRed = '#F53F3F';       // 警示色
  const feishuOrange = '#FF7D00';    // 强调色

  useEffect(() => {
    loadHabits();
  }, []);

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
    setNewHabit('');
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
    <View style={styles.habitCard}>
      <View style={styles.habitHeader}>
        <Text style={styles.habitName}>{item.name}</Text>
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>🔥 {item.streak}天</Text>
        </View>
      </View>
      <Text style={styles.habitStats}>
        总打卡：{item.totalCheckins}次 | 创建：{new Date(item.createdAt).toLocaleDateString('zh-CN')}
      </Text>
      <View style={styles.habitActions}>
        <TouchableOpacity
          style={[styles.checkInButton, item.completedToday && styles.checkedButton]}
          onPress={() => checkIn(item.id)}
          disabled={item.completedToday}
        >
          <Text style={styles.checkInText}>
            {item.completedToday ? '✓ 已完成' : '✓ 打卡'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteHabit(item.id)}
        >
          <Text style={styles.deleteText}>删除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={feishuBlue} />
      
      {/* 统计卡片 */}
      <View style={styles.statsContainer}>
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

      {/* 添加习惯 */}
      <View style={styles.addContainer}>
        <TextInput
          style={styles.input}
          placeholder="输入新习惯..."
          placeholderTextColor="#999"
          value={newHabit}
          onChangeText={setNewHabit}
          onSubmitEditing={addHabit}
        />
        <TouchableOpacity style={styles.addButton} onPress={addHabit}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* 习惯列表 */}
      <FlatList
        data={habits}
        renderItem={renderHabit}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#667eea" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>还没有习惯</Text>
            <Text style={styles.emptySubtext}>点击上方输入框添加第一个习惯</Text>
          </View>
        }
      />

      {/* 导航按钮 */}
      <TouchableOpacity
        style={styles.navButton}
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

  useEffect(() => {
    loadHabits();
  }, []);

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

  const totalCheckins = habits.reduce((sum, h) => sum + h.totalCheckins, 0);
  const avgStreak = habits.length > 0 
    ? (habits.reduce((sum, h) => sum + h.streak, 0) / habits.length).toFixed(1)
    : 0;
  const completedHabits = habits.filter(h => h.streak > 0).length;
  const completionRate = habits.length > 0 
    ? ((completedHabits / habits.length) * 100).toFixed(0)
    : 0;

  // 柱状图数据 - 按习惯名去重并求和
  const habitCheckinMap = habits.reduce((acc, h) => {
    acc[h.name] = (acc[h.name] || 0) + h.totalCheckins;
    return acc;
  }, {});
  const sortedHabits = Object.entries(habitCheckinMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const chartData = {
    labels: sortedHabits.map(([name]) => name.length > 8 ? name.substring(0, 8) + '...' : name),
    datasets: [{
      data: sortedHabits.map(([, count]) => count)
    }]
  };

  // 饼图数据 - 完成 vs 未完成
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

  // 折线图数据 - 基于真实日期的连胜趋势
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
  const daysToShow = Math.min(7, Math.max(1, Math.ceil(totalStreakSum / 5)));
  const lineData = {
    labels: getPastDates(daysToShow),
    datasets: [{
      data: Array.from({ length: daysToShow }, (_, i) => {
        const progress = (i + 1) / daysToShow;
        return Math.floor(totalStreakSum * progress);
      })
    }]
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3370FF" />
          <Text style={styles.loadingText}>加载统计数据...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView style={styles.statsScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.statsFull}>
          <Text style={styles.statsTitle}>📊 数据统计</Text>
          
          {/* 核心指标 */}
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

          {/* 完成率 */}
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

          {/* 柱状图 */}
          {habits.length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>🏆 打卡次数排行</Text>
              <BarChart
                data={chartData}
                width={Dimensions.get('window').width - 60}
                height={220}
                yAxisLabel=""
                yAxisSuffix="次"
                chartConfig={{
                  backgroundColor: '#FFFFFF',
                  backgroundGradientFrom: '#FFFFFF',
                  backgroundGradientTo: '#FFFFFF',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(51, 112, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(29, 33, 41, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#3370FF',
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

          {/* 饼图 */}
          {habits.length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>📊 习惯完成分布</Text>
              <PieChart
                data={pieData}
                width={Dimensions.get('window').width - 60}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          )}

          {/* 折线图 */}
          {habits.length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>📉 连胜增长趋势</Text>
              <LineChart
                data={lineData}
                width={Dimensions.get('window').width - 60}
                height={220}
                yAxisLabel=""
                yAxisSuffix="天"
                chartConfig={{
                  backgroundColor: '#FFFFFF',
                  backgroundGradientFrom: '#FFFFFF',
                  backgroundGradientTo: '#FFFFFF',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(51, 112, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(29, 33, 41, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#3370FF',
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

          {/* 习惯详情列表 */}
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

// 主应用
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FFFFFF',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
          },
          headerTintColor: '#1D2129',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
            color: '#1D2129',
          },
          headerTitleAlign: 'center',
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ 
            title: '⚡ 习惯追踪器',
            headerLeft: () => (
              <View style={{ marginLeft: 15 }}>
                <Text style={{ fontSize: 28 }}>🎯</Text>
              </View>
            ),
          }}
        />
        <Stack.Screen
          name="Stats"
          component={StatsScreen}
          options={{ 
            title: '📊 统计报表',
            headerLeft: () => (
              <View style={{ marginLeft: 15 }}>
                <Text style={{ fontSize: 28 }}>📈</Text>
              </View>
            ),
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#F53F3F',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: 'center',
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 8,
  },
  navButton: {
    backgroundColor: '#3370FF',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#3370FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsFull: {
    padding: 20,
    paddingBottom: 40,
  },
  statsScroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1D2129',
  },
  completionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E6EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    marginBottom: 8,
  },
  completionPercent: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00B365',
    marginRight: 15,
    width: 80,
  },
  completionBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#E5E6EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    backgroundColor: '#00B365',
    borderRadius: 6,
  },
  completionSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E6EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D2129',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  emptyChartContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E6EB',
  },
  emptyChartIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyChartText: {
    fontSize: 16,
    color: '#1D2129',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  emptyChartSubtext: {
    fontSize: 14,
    color: '#86909C',
    textAlign: 'center',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakBadgeSmall: {
    backgroundColor: '#E8F3FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3370FF',
  },
  streakTextSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3370FF',
  },
  statsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D2129',
    marginBottom: 20,
    textAlign: 'center',
  },
  bigStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  bigStatBox: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: '#3370FF',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E6EB',
  },
  detailName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D2129',
    marginBottom: 5,
  },
  detailStats: {
    fontSize: 14,
    color: '#86909C',
  },
});
