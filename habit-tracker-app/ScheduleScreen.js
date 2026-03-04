// 日程屏幕
function ScheduleScreen() {
  const [schedules, setSchedules] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [category, setCategory] = useState('work');
  const { theme } = useContext(ThemeContext);
  
  const categories = [
    { id: 'work', name: '工作', icon: '💼', color: '#3370FF' },
    { id: 'life', name: '生活', icon: '🏠', color: '#00B365' },
    { id: 'learning', name: '学习', icon: '📚', color: '#FF7D00' },
  ];

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const stored = await AsyncStorage.getItem('schedules');
      if (stored) {
        setSchedules(JSON.parse(stored));
      }
    } catch (error) {
      console.error('加载日程失败:', error);
    }
  };

  const saveSchedules = async (newSchedules) => {
    try {
      await AsyncStorage.setItem('schedules', JSON.stringify(newSchedules));
      setSchedules(newSchedules);
    } catch (error) {
      console.error('保存日程失败:', error);
    }
  };

  // 冲突检测
  const detectConflicts = (newSchedule, existingSchedules) => {
    const conflicts = [];
    const newStart = new Date(newSchedule.startTime).getTime();
    const newEnd = new Date(newSchedule.endTime).getTime();
    
    existingSchedules.forEach(s => {
      const sStart = new Date(s.startTime).getTime();
      const sEnd = new Date(s.endTime).getTime();
      
      // 检测时间重叠
      if (newStart < sEnd && newEnd > sStart) {
        conflicts.push(s);
      }
    });
    
    return conflicts;
  };

  const addSchedule = () => {
    if (!newTitle.trim() || !newStartTime || !newEndTime) {
      Alert.alert('提示', '请填写完整日程信息');
      return;
    }
    
    const newSchedule = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      startTime: newStartTime,
      endTime: newEndTime,
      category,
      createdAt: new Date().toISOString(),
    };
    
    // 检测冲突
    const conflicts = detectConflicts(newSchedule, schedules);
    if (conflicts.length > 0) {
      const conflictNames = conflicts.map(c => c.title).join('、');
      Alert.alert(
        '⚠️ 日程冲突',
        `与现有日程冲突: ${conflictNames}`,
        [
          { text: '取消', style: 'cancel' },
          { 
            text: '仍然添加', 
            onPress: () => {
              saveSchedules([newSchedule, ...schedules]);
              resetForm();
              Alert.alert('✓', '日程已添加');
            }
          },
        ]
      );
      return;
    }
    
    saveSchedules([newSchedule, ...schedules]);
    resetForm();
    Alert.alert('✓', '日程已添加');
  };

  const resetForm = () => {
    setNewTitle('');
    setNewStartTime('');
    setNewEndTime('');
  };

  const deleteSchedule = (id) => {
    Alert.alert('确认', '确定要删除这个日程吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => saveSchedules(schedules.filter(s => s.id !== id)),
      },
    ]);
  };

  const getCategoryInfo = (catId) => categories.find(c => c.id === catId) || categories[0];

  const renderSchedule = ({ item }) => {
    const catInfo = getCategoryInfo(item.category);
    return (
      <View style={[styles.scheduleCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.scheduleHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: catInfo.color + '20' }]}>
            <Text style={styles.categoryIcon}>{catInfo.icon}</Text>
            <Text style={[styles.categoryText, { color: catInfo.color }]}>{catInfo.name}</Text>
          </View>
          <TouchableOpacity onPress={() => deleteSchedule(item.id)}>
            <Text style={[styles.deleteText, { color: theme.colors.danger }]}>删除</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.scheduleTitle, { color: theme.colors.text }]}>{item.title}</Text>
        <Text style={[styles.scheduleTime, { color: theme.colors.textLight }]}>
          {new Date(item.startTime).toLocaleString('zh-CN')} - {new Date(item.endTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.primary} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 添加日程表单 */}
        <View style={[styles.addForm, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.formTitle, { color: theme.colors.text }]}>添加日程</Text>
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, color: theme.colors.text }]}
            placeholder="日程标题"
            placeholderTextColor={theme.colors.textLight}
            value={newTitle}
            onChangeText={setNewTitle}
          />
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, color: theme.colors.text }]}
            placeholder="开始时间 (YYYY-MM-DDTHH:MM)"
            placeholderTextColor={theme.colors.textLight}
            value={newStartTime}
            onChangeText={setNewStartTime}
          />
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, color: theme.colors.text }]}
            placeholder="结束时间 (YYYY-MM-DDTHH:MM)"
            placeholderTextColor={theme.colors.textLight}
            value={newEndTime}
            onChangeText={setNewEndTime}
          />
          
          {/* 分类选择 */}
          <View style={styles.categoryRow}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  { borderColor: cat.color },
                  category === cat.id && { backgroundColor: cat.color + '20' }
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[styles.categoryBtnText, { color: category === cat.id ? cat.color : theme.colors.textLight }]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]} 
            onPress={addSchedule}
          >
            <Text style={styles.addButtonText}>+ 添加日程</Text>
          </TouchableOpacity>
        </View>
        
        {/* 日程列表 */}
        <View style={styles.listContainer}>
          <Text style={[styles.listTitle, { color: theme.colors.text }]}>我的日程</Text>
          
          {schedules.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textLight }]}>暂无日程</Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textLight }]}>点击上方添加日程</Text>
            </View>
          ) : (
            schedules.map(item => renderSchedule({ item }))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
