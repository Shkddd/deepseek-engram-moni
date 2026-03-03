import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 配置通知行为
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 请求通知权限
export const requestNotificationPermission = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return false;
  }
  
  return true;
};

// 保存提醒时间
export const saveReminderTime = async (hour, minute) => {
  try {
    await AsyncStorage.setItem('reminder_hour', String(hour));
    await AsyncStorage.setItem('reminder_minute', String(minute));
    return true;
  } catch (error) {
    console.error('保存提醒时间失败:', error);
    return false;
  }
};

// 获取提醒时间
export const getReminderTime = async () => {
  try {
    const hour = await AsyncStorage.getItem('reminder_hour');
    const minute = await AsyncStorage.getItem('reminder_minute');
    return {
      hour: hour ? parseInt(hour) : 20,
      minute: minute ? parseInt(minute) : 0,
    };
  } catch (error) {
    console.error('获取提醒时间失败:', error);
    return { hour: 20, minute: 0 };
  }
};

// 开启每日提醒
export const enableDailyReminder = async (hour, minute) => {
  try {
    // 先取消之前的提醒
    await cancelDailyReminder();
    
    // 创建新的每日提醒
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎯 习惯提醒',
        body: '该打卡了！别忘了今天的好习惯',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hour,
        minute: minute,
      },
    });
    
    await AsyncStorage.setItem('reminder_enabled', 'true');
    return true;
  } catch (error) {
    console.error('开启提醒失败:', error);
    return false;
  }
};

// 取消每日提醒
export const cancelDailyReminder = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.setItem('reminder_enabled', 'false');
    return true;
  } catch (error) {
    console.error('取消提醒失败:', error);
    return false;
  }
};

// 检查提醒是否开启
export const isReminderEnabled = async () => {
  try {
    const enabled = await AsyncStorage.getItem('reminder_enabled');
    return enabled === 'true';
  } catch (error) {
    return false;
  }
};
