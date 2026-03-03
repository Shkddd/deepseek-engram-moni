# 重要记忆 - 习惯追踪器项目

## 用户信息
- **姓名:** 李想
- **偏好:** 纯文本回复，不要飞书消息卡片
- **要求:** 聪明能干、快速反应，回复显示 token 数

---

## 项目关键信息

### 技术栈
- React Native + Expo (SDK 55.0.0)
- AsyncStorage 本地存储
- react-native-chart-kit 图表

### 账户信息
- **EAS Project ID:** `e1c639d6-487f-4ce1-a2d6-9d4cd73a90c5`
- **Expo Account:** `jxnxnxn` (robot: `clasw1`)
- **GitHub Repo:** https://github.com/Shkddd/deepseek-engram-moni
- **EAS Token:** `FWP0YFPn8YJwV_3XSkqKVuLXlBiGZtwA-ox9Jz56`

### 功能演进
| 日期 | 功能 |
|------|------|
| 2026-03-03 上午 | 习惯打卡 CRUD |
| 2026-03-03 下午 | 统计图表（柱状图、饼图、折线图）|
| 2026-03-03 下午 | 记事本功能 |
| 2026-03-03 傍晚 | 白底 Logo、修复构建错误 |
| 2026-03-03 晚上 | 修复统计刷新 bug、记事本图片、夜间模式 |
| 2026-03-04 凌晨 | P2P 聊天、提醒通知、预测评分、成就系统 |

### 新增依赖（按时间顺序）
1. `@react-navigation/bottom-tabs` - 底部导航
2. `expo-image-picker` - 图片选择
3. `react-native-webrtc` - P2P 聊天
4. `expo-notifications` - 提醒通知
5. `@tensorflow/tfjs` + `ml-random-forest` - 预测评分（备用）
6. 成就系统 - 纯 JS 实现

---

## 技术方案

### P2P 聊天 (WebRTC + STUN)
- 使用 STUN 服务器获取公网 IP（免费公开服务器）
- DataChannel 进行消息传输
- 无需后端服务器

### 预测评分算法
基于规则的评分系统（5个维度）:
1. 历史完成率 (30分)
2. 最长连续 (25分)
3. 今日进度 (20分)
4. 活跃度 (15分)
5. 动力因素 (10分)

### 成就系统
20+ 个成就，分为:
- 打卡成就 (5个)
- 连续成就 (5个)
- 习惯数量成就 (4个)
- 今日完成成就 (1个)
- 笔记成就 (3个)
- 综合成就 (2个)

---

## 待完成
- [ ] 明早 8 点构建 APK 测试
- [ ] 夜间模式适配统计/记事本页面
- [ ] 实际测试 P2P 聊天功能

---

*更新时间: 2026-03-04 00:20*
