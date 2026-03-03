# 🎯 Habit Tracker - 个人习惯追踪器

简洁高效的习惯养成工具（CLI + Web）

## ✨ 功能特性

### v1.0 核心功能
- ✅ 创建和管理个人习惯
- ✅ 每日打卡记录
- ✅ 连续打卡天数统计
- ✅ 数据本地存储（JSON）

### v1.1 提醒功能
- ⏰ 定时提醒打卡
- ⏸️ 启用/禁用提醒
- 📋 提醒列表管理

### v1.2 数据导出
- 📥 导出 CSV 格式
- 📥 导出 JSON 格式
- 📊 生成统计报告

### v2.0 Web 界面
- 🌐 美观的响应式 Web UI
- 📱 支持移动端访问
- 🎨 可视化数据展示

### v2.1 社交功能
- 👥 好友系统
- 🏆 排行榜
- ⚔️ 习惯挑战 PK

---

## 🚀 快速开始

### 安装依赖

```bash
pip install -r requirements.txt
```

### CLI 模式

```bash
python3 main.py
```

### Web 模式

```bash
python3 web.py
# 访问 http://localhost:5000
```

---

## 📖 命令说明

### 习惯管理

| 命令 | 说明 | 示例 |
|------|------|------|
| `add <习惯名>` | 添加新习惯 | `add 早起` |
| `list` | 查看所有习惯 | `list` |
| `check <习惯名>` | 今日打卡 | `check 早起` |
| `delete <习惯名>` | 删除习惯 | `delete 早起` |
| `stats` | 查看统计报表 | `stats` |

### 提醒功能

| 命令 | 说明 | 示例 |
|------|------|------|
| `remind <习惯> <时> <分>` | 添加提醒 | `remind 早起 8 0` |
| `reminders` | 查看所有提醒 | `reminders` |

### 数据导出

| 命令 | 说明 |
|------|------|
| `export csv` | 导出 CSV 格式 |
| `export json` | 导出 JSON 格式 |
| `report` | 生成统计报告 |

### 社交功能

| 命令 | 说明 | 示例 |
|------|------|------|
| `social rank` | 查看排行榜 | `social rank` |
| `social myrank` | 我的排名 | `social myrank` |
| `social add <用户名>` | 添加好友 | `social add 张三` |
| `social friends` | 好友列表 | `social friends` |
| `social challenge <习惯> <用户名> <天数>` | 发起挑战 | `social challenge 早起 张三 7` |

### Web 界面

| 命令 | 说明 |
|------|------|
| `web` | 启动 Web 界面 |

---

## 📁 项目结构

```
habit_tracker/
├── main.py           # CLI 主程序
├── web.py            # Web 界面
├── manager.py        # 习惯管理逻辑
├── data.py           # 数据模型
├── reminders.py      # 提醒功能
├── export.py         # 数据导出
├── social.py         # 社交功能
├── requirements.txt  # Python 依赖
├── README.md         # 项目文档
└── .gitignore        # Git 配置
```

---

## 💡 使用示例

```bash
# 1. 添加习惯
add 早起
add 运动
add 阅读

# 2. 设置提醒
remind 早起 7 0
remind 运动 18 30

# 3. 打卡
check 早起

# 4. 查看统计
stats

# 5. 导出数据
export csv

# 6. 社交 PK
social add 张三
social challenge 早起 张三 7
social rank

# 7. 启动 Web 界面
web
```

---

## 🛠️ 技术栈

- **Python 3.8+**
- **Flask** (Web 界面)
- **JSON** (数据存储)
- **无数据库依赖**

---

## 📝 版本历史

| 版本 | 功能 | 状态 |
|------|------|------|
| v1.0 | 核心习惯管理 | ✅ |
| v1.1 | 提醒功能 | ✅ |
| v1.2 | 数据导出 | ✅ |
| v2.0 | Web 界面 | ✅ |
| v2.1 | 社交功能 | ✅ |

---

## 📄 许可证

MIT License
