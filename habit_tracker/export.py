"""数据导出模块 - v1.2"""

import csv
import json
import os
from datetime import datetime
from typing import List, Dict

from data import load_data, Habit

class ExportManager:
    """数据导出管理器"""
    
    def __init__(self):
        self.data = load_data()
    
    def export_csv(self, output_path: str = None) -> str:
        """导出为 CSV 格式"""
        if output_path is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = f"habits_export_{timestamp}.csv"
        
        habits = self.data.get("habits", {})
        
        with open(output_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            # 写入表头
            writer.writerow(['习惯名称', '创建时间', '打卡次数', '连续天数', '打卡日期列表'])
            
            # 写入数据
            for name, habit_data in habits.items():
                habit = Habit.from_dict(habit_data)
                writer.writerow([
                    habit.name,
                    habit.created_at,
                    habit.get_total_checkins(),
                    habit.get_streak(),
                    '; '.join(sorted(habit.check_ins))
                ])
        
        return output_path
    
    def export_json(self, output_path: str = None) -> str:
        """导出为 JSON 格式"""
        if output_path is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = f"habits_export_{timestamp}.json"
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)
        
        return output_path
    
    def generate_report(self) -> str:
        """生成文本报告"""
        habits = self.data.get("habits", {})
        
        lines = []
        lines.append("=" * 60)
        lines.append("📊 习惯追踪器 - 统计报告")
        lines.append(f"生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("=" * 60)
        lines.append("")
        
        total_habits = len(habits)
        total_checkins = sum(
            Habit.from_dict(h).get_total_checkins() 
            for h in habits.values()
        )
        
        lines.append(f"📈 总体统计")
        lines.append(f"   总习惯数：{total_habits}")
        lines.append(f"   总打卡次数：{total_checkins}")
        lines.append("")
        
        if habits:
            lines.append("📋 习惯详情")
            lines.append("-" * 60)
            
            sorted_habits = sorted(
                [(name, Habit.from_dict(h)) for name, h in habits.items()],
                key=lambda x: x[1].get_streak(),
                reverse=True
            )
            
            for name, habit in sorted_habits:
                lines.append(f"\n🎯 {habit.name}")
                lines.append(f"   创建时间：{habit.created_at[:10]}")
                lines.append(f"   连续打卡：{habit.get_streak()} 天 🔥")
                lines.append(f"   总计打卡：{habit.get_total_checkins()} 次")
                lines.append(f"   今日打卡：{'✅' if habit.checked_today() else '⬜'}")
        
        lines.append("")
        lines.append("=" * 60)
        
        return "\n".join(lines)
    
    def save_report(self, output_path: str = None) -> str:
        """保存报告到文件"""
        if output_path is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = f"habits_report_{timestamp}.txt"
        
        report = self.generate_report()
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(report)
        
        return output_path
