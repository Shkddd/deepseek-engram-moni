# 🎯 习惯追踪器 - Android App

基于 React Native + Expo 开发的习惯养成应用。

## 📱 功能特性

- ✅ 习惯创建与管理
- ✅ 每日打卡
- ✅ 连续天数统计
- ✅ 数据本地存储
- ✅ 统计报表
- ✅ 下拉刷新

## 🚀 快速开始

### 方式一：Expo Go (推荐用于测试)

1. 在手机上安装 **Expo Go** App
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
   - iOS: https://apps.apple.com/app/expo-go/id982107779

2. 启动开发服务器：
   ```bash
   cd habit-tracker-app
   npx expo start
   ```

3. 用手机扫描屏幕上的二维码即可运行

### 方式二：打包 APK

#### 步骤 1: 登录 Expo
```bash
eas login
```
(没有账号的话会提示注册，免费注册)

#### 步骤 2: 配置项目
```bash
eas build:configure
```

#### 步骤 3: 构建 APK
```bash
# 构建内部测试版 APK
eas build --platform android --profile preview

# 或构建生产版 (AAB，用于 Google Play)
eas build --platform android --profile production
```

#### 步骤 4: 下载 APK
构建完成后，Expo 会提供一个下载链接，或运行：
```bash
eas build:list
```
找到你的构建，复制链接下载。

#### 步骤 5: 安装到手机
- 下载 APK 文件
- 通过 USB 传输到手机
- 在手机上安装（需要允许"未知来源"）

## 📁 项目结构

```
habit-tracker-app/
├── App.js              # 主应用代码
├── app.json            # Expo 配置
├── eas.json            # EAS Build 配置
├── package.json        # 依赖配置
├── assets/             # 图标和启动图
└── README.md           # 本文件
```

## 🛠️ 技术栈

- **React Native** - 跨平台移动开发
- **Expo** - 开发工具和构建服务
- **AsyncStorage** - 本地数据存储
- **React Navigation** - 页面导航

## 📊 打包位置

APK 文件会存储在 Expo 云端，下载后建议保存到：
```
/home/mi/.openclaw/workspace/habit-tracker-app/builds/
```

## 🔧 开发命令

```bash
# 启动开发服务器
npx expo start

# 在 Android 模拟器运行
npx expo run:android

# 在 iOS 模拟器运行
npx expo run:ios

# 构建 APK
eas build --platform android --profile preview

# 查看构建历史
eas build:list

# 下载构建产物
eas build:download --platform android
```

## 📝 注意事项

1. **首次构建需要 Expo 账号** (免费)
2. **APK 构建约需 10-15 分钟** (云端构建)
3. **测试建议先用 Expo Go**，确认功能后再打包
4. **数据存储在本地**，卸载 App 会丢失数据

## 🎨 界面预览

- 主屏幕：习惯列表 + 统计卡片
- 统计页：详细数据分析
- 渐变色设计 (#667eea → #764ba2)
- 支持深色模式

## 📄 许可证

MIT License
