"""提醒功能模块 - v1.1"""

import json
import os
from datetime import datetime, time
from typing import Dict, List, Optional

REMINDERS_FILE = "reminders.json"

def get_reminders_path() -> str:
    return os.path.join(os.path.dirname(__file__), REMINDERS_FILE)

def load_reminders() -> Dict:
    """加载提醒配置"""
    path = get_reminders_path()
    if not os.path.exists(path):
        return {"reminders": {}}
    
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_reminders(data: Dict) -> None:
    """保存提醒配置"""
    path = get_reminders_path()
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

class ReminderManager:
    """提醒管理器"""
    
    def __init__(self):
        self.data = load_reminders()
        self.reminders: Dict[str, List[Dict]] = self.data.get("reminders", {})
    
    def _save(self):
        self.data["reminders"] = self.reminders
        save_reminders(self.data)
    
    def add_reminder(self, habit_name: str, hour: int, minute: int) -> bool:
        """添加提醒"""
        if habit_name not in self.reminders:
            self.reminders[habit_name] = []
        
        reminder = {
            "time": f"{hour:02d}:{minute:02d}",
            "hour": hour,
            "minute": minute,
            "enabled": True,
            "created_at": datetime.now().isoformat()
        }
        
        self.reminders[habit_name].append(reminder)
        self._save()
        return True
    
    def list_reminders(self, habit_name: str = None) -> List[Dict]:
        """列出提醒"""
        if habit_name:
            return self.reminders.get(habit_name, [])
        return [r for habits in self.reminders.values() for r in habits]
    
    def delete_reminder(self, habit_name: str, index: int) -> bool:
        """删除提醒"""
        if habit_name not in self.reminders:
            return False
        
        if index < 0 or index >= len(self.reminders[habit_name]):
            return False
        
        del self.reminders[habit_name][index]
        if not self.reminders[habit_name]:
            del self.reminders[habit_name]
        
        self._save()
        return True
    
    def toggle_reminder(self, habit_name: str, index: int) -> Optional[bool]:
        """开关提醒"""
        if habit_name not in self.reminders:
            return None
        
        if index < 0 or index >= len(self.reminders[habit_name]):
            return None
        
        reminder = self.reminders[habit_name][index]
        reminder["enabled"] = not reminder["enabled"]
        self._save()
        return reminder["enabled"]
    
    def get_due_reminders(self, current_time: time = None) -> List[Dict]:
        """获取当前时间应触发的提醒"""
        if current_time is None:
            current_time = datetime.now().time()
        
        due = []
        for habit_name, reminders in self.reminders.items():
            for idx, reminder in enumerate(reminders):
                if not reminder.get("enabled", True):
                    continue
                
                r_hour = reminder["hour"]
                r_minute = reminder["minute"]
                
                if current_time.hour == r_hour and current_time.minute == r_minute:
                    due.append({
                        "habit": habit_name,
                        "time": reminder["time"],
                        "index": idx
                    })
        
        return due
