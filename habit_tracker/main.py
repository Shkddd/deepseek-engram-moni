#!/usr/bin/env python3
"""习惯追踪器 - 主程序"""

import sys
from manager import HabitManager

def print_banner():
    print("=" * 50)
    print("🎯 习惯追踪器 v1.0")
    print("=" * 50)

def print_help():
    print("\n📖 可用命令：")
    print("  add <习惯名>     - 添加新习惯")
    print("  list             - 查看所有习惯")
    print("  check <习惯名>   - 今日打卡")
    print("  stats            - 查看统计报表")
    print("  delete <习惯名>  - 删除习惯")
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

def cmd_delete(manager, args):
    if not args:
        print("❌ 请指定习惯名称，如：delete 早起")
        return
    
    name = " ".join(args)
    if manager.delete_habit(name):
        print(f"✅ 习惯 '{name}' 已删除")
    else:
        print(f"❌ 习惯 '{name}' 不存在")

def main():
    manager = HabitManager()
    print_banner()
    print_help()
    
    while True:
        try:
            cmd_input = input("\n👉 输入命令：").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n👋 再见！")
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
        elif cmd == 'stats':
            cmd_stats(manager, args)
        elif cmd == 'delete':
            cmd_delete(manager, args)
        else:
            print(f"❌ 未知命令 '{cmd}'，输入 'help' 查看帮助")

if __name__ == "__main__":
    main()
