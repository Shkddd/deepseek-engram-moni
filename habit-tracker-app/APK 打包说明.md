# 📦 APK 打包说明

## 当前状态

- ✅ 代码已完成
- ✅ 项目已创建：https://expo.dev/accounts/jxnxnxn/projects/habit-tracker
- ⏳ APK 构建：需要通过网页完成

---

## 🌐 网页打包（推荐，最简单）

### 步骤 1：打开构建页面
https://expo.dev/accounts/jxnxnxn/projects/habit-tracker/builds

### 步骤 2：创建构建
1. 点击 **"Create build"** 按钮
2. 选择 **Android** 平台
3. 选择 **APK** 类型（用于直接安装）
4. 点击 **"Run build"**

### 步骤 3：等待完成
- 构建时间：约 10-15 分钟
- 完成后会显示下载链接

### 步骤 4：下载 APK
- 点击构建记录中的 **"Download"** 按钮
- 或复制链接到浏览器下载

---

## 📱 立即测试（不用等打包）

### 方式 1：Expo Go（推荐）

1. **手机安装 Expo Go**
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. **启动开发服务器**
   ```bash
   cd /home/mi/.openclaw/workspace/habit-tracker-app
   npx expo start
   ```

3. **扫码运行**
   - 手机打开 Expo Go
   - 扫描终端显示的二维码
   - App 立即运行！

### 方式 2：本地构建（需要 Android Studio）

```bash
cd /home/mi/.openclaw/workspace/habit-tracker-app
npx expo run:android
```

---

## 📁 文件位置

- **项目源码**: `/home/mi/.openclaw/workspace/habit-tracker-app/`
- **打包压缩包**: `/home/mi/.openclaw/workspace/habit-tracker-app-complete.tar.gz`

---

## 🔗 相关链接

- **项目主页**: https://expo.dev/accounts/jxnxnxn/projects/habit-tracker
- **构建历史**: https://expo.dev/accounts/jxnxnxn/projects/habit-tracker/builds
- **Expo 文档**: https://docs.expo.dev/

---

## 💡 提示

- APK 文件大小约 40-60MB（包含 Expo 运行时）
- 首次构建需要生成签名密钥（Expo 自动处理）
- 构建完成后邮件会收到通知
