"""习惯管理逻辑模块"""

from data import load_data, save_data, Habit
from typing import List, Optional, Dict

class HabitManager:
    """习惯管理器"""
    
    def __init__(self):
        self.data = load_data()
        self.habits: Dict[str, Habit] = {}
        self._load_habits()
    
    def _load_habits(self):
        """从数据加载习惯"""
        for name, habit_data in self.data.get("habits", {}).items():
            self.habits[name] = Habit.from_dict(habit_data)
    
    def _save(self):
        """保存数据"""
        self.data["habits"] = {name: h.to_dict() for name, h in self.habits.items()}
        save_data(self.data)
    
    def add_habit(self, name: str) -> bool:
        """添加习惯"""
        if name in self.habits:
            return False
        
        self.habits[name] = Habit(name)
        self._save()
        return True
    
    def delete_habit(self, name: str) -> bool:
        """删除习惯"""
        if name not in self.habits:
            return False
        
        del self.habits[name]
        self._save()
        return True
    
    def get_habit(self, name: str) -> Optional[Habit]:
        """获取习惯"""
        return self.habits.get(name)
    
    def list_habits(self) -> List[Habit]:
        """列出所有习惯"""
        return list(self.habits.values())
    
    def check_in(self, name: str) -> tuple:
        """打卡，返回 (成功与否，消息)"""
        habit = self.get_habit(name)
        if not habit:
            return False, f"❌ 习惯 '{name}' 不存在"
        
        if habit.checked_today():
            return False, f"⚠️  '{name}' 今日已打卡"
        
        habit.check_in()
        self._save()
        streak = habit.get_streak()
        return True, f"✅ '{name}' 打卡成功！连续 {streak} 天 🔥"
    
    def get_stats(self) -> Dict:
        """获取统计数据"""
        total_habits = len(self.habits)
        total_checkins = sum(h.get_total_checkins() for h in self.habits.values())
        today_checkins = sum(1 for h in self.habits.values() if h.checked_today())
        
        habits_stats = []
        for habit in self.habits.values():
            habits_stats.append({
                "name": habit.name,
                "streak": habit.get_streak(),
                "total": habit.get_total_checkins(),
                "today": habit.checked_today()
            })
        
        return {
            "total_habits": total_habits,
            "total_checkins": total_checkins,
            "today_checkins": today_checkins,
            "today_completion": f"{today_checkins}/{total_habits}" if total_habits > 0 else "0/0",
            "habits": habits_stats
        }
