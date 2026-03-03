# 📦 APK 打包指南

## 快速打包步骤

### 1️⃣ 登录 Expo (首次需要)
```bash
cd /home/mi/.openclaw/workspace/habit-tracker-app
eas login
```
- 没有账号？按提示注册（免费）
- 登录后会保存凭证，下次不用重复登录

### 2️⃣ 开始构建 APK
```bash
eas build --platform android --profile preview
```

### 3️⃣ 等待构建完成
- 云端构建，约 **10-15 分钟**
- 可以关闭终端，构建在后台继续
- 完成后会收到邮件通知

### 4️⃣ 下载 APK
构建完成后有两种方式下载：

**方式 A - 使用链接**
- 构建完成后终端会显示下载链接
- 或查看邮件中的链接

**方式 B - 命令行下载**
```bash
# 查看构建历史
eas build:list

# 下载最新构建
eas build:download --platform android --latest
```

### 5️⃣ 保存到本地
建议保存位置：
```
/home/mi/.openclaw/workspace/habit-tracker-app/builds/
```

创建目录并下载：
```bash
mkdir -p builds
eas build:download --platform android --latest --output-dir ./builds
```

### 6️⃣ 安装到手机
1. 将 APK 文件传输到手机（USB/微信/网盘）
2. 在手机上打开 APK 文件
3. 允许"未知来源"安装
4. 完成安装

---

## 🔍 查看构建状态

```bash
# 查看所有构建
eas build:list

# 查看正在进行的构建
eas build:list --status IN_PROGRESS

# 查看最近 5 个构建
eas build:list --limit 5
```

---

## 📱 替代方案：Expo Go (即时测试)

如果不想等打包，可以立即用手机测试：

1. **安装 Expo Go**
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. **启动开发服务器**
   ```bash
   cd /home/mi/.openclaw/workspace/habit-tracker-app
   npx expo start
   ```

3. **扫码运行**
   - 手机打开 Expo Go
   - 扫描终端显示的二维码
   - App 立即在手机上运行！

---

## ⚠️ 常见问题

**Q: 构建失败怎么办？**
A: 检查终端错误信息，常见问题：
- 网络问题 → 重试
- 配置错误 → 检查 eas.json 和 app.json

**Q: 构建太慢？**
A: 免费队列可能需要等待，可以：
- 用 Expo Go 先测试功能
- 付费升级 EAS 优先级（不推荐，没必要）

**Q: APK 太大？**
A: 正常现象，Expo 包含完整运行时。如需优化：
- 使用 "eject" 脱离 Expo（复杂，不推荐）
- 或用 React Native CLI 重新初始化

**Q: 数据会丢失吗？**
A: 当前版本数据存储在本地：
- 卸载 App = 数据清空
- 更新 App = 数据保留
- 未来版本可加云同步

---

## 📊 构建产物说明

| 类型 | 文件格式 | 用途 | 大小 |
|------|---------|------|------|
| **preview** | .apk | 直接安装测试 | ~50MB |
| **production** | .aab | Google Play 发布 | ~30MB |

当前使用 **preview** 模式，生成 APK 可直接安装。

---

## 🎯 下一步

打包完成后，你可以：
1. 安装到手机测试
2. 分享给朋友
3. 继续开发新功能（云同步、AI 分析等）

有任何问题随时问我！
