#!/usr/bin/env python3
"""习惯追踪器 - 主程序 v2.1 (完整版)"""

import sys
from manager import HabitManager
from reminders import ReminderManager
from export import ExportManager
from social import SocialManager

def print_banner():
    print("=" * 50)
    print("🎯 习惯追踪器 v2.1 完整版")
    print("=" * 50)

def print_help():
    print("\n📖 可用命令：")
    print("\n【习惯管理】")
    print("  add <习惯名>     - 添加新习惯")
    print("  list             - 查看所有习惯")
    print("  check <习惯名>   - 今日打卡")
    print("  delete <习惯名>  - 删除习惯")
    print("\n【提醒功能】")
    print("  remind <习惯名> <时> <分> - 添加提醒")
    print("  reminders        - 查看所有提醒")
    print("\n【数据导出】")
    print("  export csv       - 导出 CSV")
    print("  export json      - 导出 JSON")
    print("  report           - 生成报告")
    print("\n【社交功能】")
    print("  social rank      - 查看排行榜")
    print("  social myrank    - 我的排名")
    print("  social add <用户名> - 添加好友")
    print("  social friends   - 好友列表")
    print("  social challenge <习惯> <用户名> <天数> - 发起挑战")
    print("\n【Web 界面】")
    print("  web              - 启动 Web 界面")
    print("\n【其他】")
    print("  stats            - 查看统计报表")
    print("  help             - 显示帮助")
    print("  quit / q         - 退出程序")

def cmd_add(manager, args):
    if not args:
        print("❌ 请指定习惯名称，如：add 早起")
        return
    name = " ".join(args)
    if manager.add_habit(name):
        print(f"✅ 习惯 '{name}' 创建成功！")
    else:
        print(f"⚠️  习惯 '{name}' 已存在")

def cmd_list(manager, args):
    habits = manager.list_habits()
    if not habits:
        print("📭 还没有任何习惯，用 'add <习惯名>' 添加第一个吧！")
        return
    print(f"\n📋 你的习惯 ({len(habits)} 个)：")
    print("-" * 40)
    for habit in habits:
        today = "✅" if habit.checked_today() else "⬜"
        streak = habit.get_streak()
        streak_icon = "🔥" if streak > 0 else ""
        print(f"{today} {habit.name}  (连续 {streak} 天{streak_icon})")

def cmd_check(manager, args):
    if not args:
        print("❌ 请指定习惯名称，如：check 早起")
        return
    name = " ".join(args)
    success, msg = manager.check_in(name)
    print(msg)

def cmd_delete(manager, args):
    if not args:
        print("❌ 请指定习惯名称，如：delete 早起")
        return
    name = " ".join(args)
    if manager.delete_habit(name):
        print(f"✅ 习惯 '{name}' 已删除")
    else:
        print(f"❌ 习惯 '{name}' 不存在")

def cmd_stats(manager, args):
    stats = manager.get_stats()
    print("\n📊 统计报表")
    print("=" * 40)
    print(f"总习惯数：{stats['total_habits']}")
    print(f"总打卡次数：{stats['total_checkins']}")
    print(f"今日完成：{stats['today_completion']}")
    if stats['habits']:
        print("\n📈 习惯详情：")
        print("-" * 40)
        for h in sorted(stats['habits'], key=lambda x: x['streak'], reverse=True):
            today_icon = "✅" if h['today'] else "⬜"
            print(f"{today_icon} {h['name']}: 连续 {h['streak']} 天 | 总计 {h['total']} 次")

def cmd_remind(reminder_mgr, manager, args):
    if len(args) < 3:
        print("❌ 用法：remind <习惯名> <时> <分>，如：remind 早起 8 0")
        return
    habit_name = args[0]
    try:
        hour = int(args[1])
        minute = int(args[2])
    except ValueError:
        print("❌ 时间必须是数字")
        return
    
    habit = manager.get_habit(habit_name)
    if not habit:
        print(f"❌ 习惯 '{habit_name}' 不存在")
        return
    
    reminder_mgr.add_reminder(habit_name, hour, minute)
    print(f"✅ 已设置提醒：{habit_name} 每天 {hour:02d}:{minute:02d}")

def cmd_reminders(reminder_mgr, args):
    reminders = reminder_mgr.list_reminders()
    if not reminders:
        print("📭 还没有设置提醒")
        return
    print("\n⏰ 提醒列表：")
    print("-" * 40)
    for r in reminders:
        status = "✅" if r.get("enabled", True) else "⏸️"
        print(f"{status} {r['time']}")

def cmd_export(export_mgr, args):
    if not args:
        print("❌ 用法：export csv|json|report")
        return
    
    cmd = args[0].lower()
    if cmd == 'csv':
        path = export_mgr.export_csv()
        print(f"✅ 已导出 CSV: {path}")
    elif cmd == 'json':
        path = export_mgr.export_json()
        print(f"✅ 已导出 JSON: {path}")
    elif cmd == 'report':
        path = export_mgr.save_report()
        print(f"✅ 报告已保存：{path}")
        print(export_mgr.generate_report())
    else:
        print("❌ 用法：export csv|json|report")

def cmd_social(social_mgr, manager, args):
    if not args:
        print("❌ 用法：social rank|myrank|add|friends|challenge")
        return
    
    cmd = args[0]
    
    # 先同步习惯数据
    social_mgr.sync_habits(manager.data.get("habits", {}))
    
    if cmd == 'rank':
        leaderboard = social_mgr.get_leaderboard()
        print("\n🏆 排行榜")
        print("=" * 40)
        for user in leaderboard:
            print(f"#{user['rank']} {user['username']}: {user['total_streak']} 天 🔥")
    
    elif cmd == 'myrank':
        rank = social_mgr.get_my_rank()
        print(f"\n📊 你的排名：#{rank['rank']}")
        print(f"   总连续天数：{rank['total_streak']} 天 🔥")
    
    elif cmd == 'add':
        if len(args) < 2:
            print("❌ 用法：social add <用户名>")
            return
        success, msg = social_mgr.add_friend(args[1])
        print(f"{'✅' if success else '❌'} {msg}")
    
    elif cmd == 'friends':
        friends = social_mgr.get_friends()
        if not friends:
            print("📭 还没有好友")
            return
        print("\n👥 好友列表：")
        print("-" * 40)
        for f in friends:
            print(f"👤 {f['username']}: {f['total_streak']} 天 | {f['habits_count']} 个习惯")
    
    elif cmd == 'challenge':
        if len(args) < 4:
            print("❌ 用法：social challenge <习惯名> <用户名> <天数>")
            return
        success, msg = social_mgr.create_challenge(args[1], args[2], int(args[3]))
        print(f"{'✅' if success else '❌'} {msg}")
    else:
        print("❌ 用法：social rank|myrank|add|friends|challenge")

def cmd_web(args):
    print("🌐 正在启动 Web 界面...")
    print("访问地址：http://localhost:5000")
    print("按 Ctrl+C 停止")
    try:
        from web import run_web
        run_web()
    except ImportError:
        print("❌ 需要先安装 Flask: pip install flask")

def main():
    manager = HabitManager()
    reminder_mgr = ReminderManager()
    export_mgr = ExportManager()
    social_mgr = SocialManager("default_user")
    
    print_banner()
    print_help()
    
    while True:
        try:
            cmd_input = input("\n👉 输入命令：").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n👋 再见！坚持你的习惯！💪")
            break
        
        if not cmd_input:
            continue
        
        parts = cmd_input.split(maxsplit=1)
        cmd = parts[0].lower()
        args = parts[1].split() if len(parts) > 1 else []
        
        if cmd in ['quit', 'q', 'exit']:
            print("👋 再见！坚持你的习惯！💪")
            break
        elif cmd == 'help':
            print_help()
        elif cmd == 'add':
            cmd_add(manager, args)
        elif cmd == 'list':
            cmd_list(manager, args)
        elif cmd == 'check':
            cmd_check(manager, args)
        elif cmd == 'delete':
            cmd_delete(manager, args)
        elif cmd == 'stats':
            cmd_stats(manager, args)
        elif cmd == 'remind':
            cmd_remind(reminder_mgr, manager, args)
        elif cmd == 'reminders':
            cmd_reminders(reminder_mgr, args)
        elif cmd == 'export':
            cmd_export(export_mgr, args)
        elif cmd == 'social':
            cmd_social(social_mgr, manager, args)
        elif cmd == 'web':
            cmd_web(args)
        else:
            print(f"❌ 未知命令 '{cmd}'，输入 'help' 查看帮助")

if __name__ == "__main__":
    main()
