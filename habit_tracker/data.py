"""数据模型和存储模块"""

import json
import os
from datetime import datetime, date
from typing import Dict, List, Optional

DATA_FILE = "habits_data.json"

def get_data_path() -> str:
    """获取数据文件路径"""
    return os.path.join(os.path.dirname(__file__), DATA_FILE)

def load_data() -> Dict:
    """加载数据"""
    path = get_data_path()
    if not os.path.exists(path):
        return {"habits": {}}
    
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data: Dict) -> None:
    """保存数据"""
    path = get_data_path()
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

class Habit:
    """习惯类"""
    
    def __init__(self, name: str, created_at: str = None):
        self.name = name
        self.created_at = created_at or datetime.now().isoformat()
        self.check_ins: List[str] = []  # 打卡日期列表 ISO format
    
    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "created_at": self.created_at,
            "check_ins": self.check_ins
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Habit':
        habit = cls(data["name"], data["created_at"])
        habit.check_ins = data.get("check_ins", [])
        return habit
    
    def check_in(self, check_date: str = None) -> bool:
        """打卡，返回是否成功"""
        if check_date is None:
            check_date = date.today().isoformat()
        
        if check_date in self.check_ins:
            return False  # 已打卡
        
        self.check_ins.append(check_date)
        return True
    
    def get_streak(self) -> int:
        """获取连续打卡天数"""
        if not self.check_ins:
            return 0
        
        sorted_dates = sorted(self.check_ins, reverse=True)
        today = date.today()
        yesterday = date.fromisoformat(sorted_dates[0])
        
        # 如果最近一次打卡不是今天或昨天，连续中断
        if (today - yesterday).days > 1:
            return 0
        
        streak = 1
        for i in range(1, len(sorted_dates)):
            curr = date.fromisoformat(sorted_dates[i])
            prev = date.fromisoformat(sorted_dates[i-1])
            if (prev - curr).days == 1:
                streak += 1
            else:
                break
        
        return streak
    
    def get_total_checkins(self) -> int:
        """获取总打卡次数"""
        return len(self.check_ins)
    
    def checked_today(self) -> bool:
        """检查今天是否已打卡"""
        return date.today().isoformat() in self.check_ins
