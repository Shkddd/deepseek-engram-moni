"""社交功能模块 - v2.1 (好友 PK)"""

import json
import os
from datetime import datetime, date
from typing import Dict, List, Optional
import hashlib

SOCIAL_FILE = "social_data.json"

def get_social_path() -> str:
    return os.path.join(os.path.dirname(__file__), SOCIAL_FILE)

def load_social_data() -> Dict:
    path = get_social_path()
    if not os.path.exists(path):
        return {"users": {}, "challenges": []}
    
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_social_data(data: Dict) -> None:
    path = get_social_path()
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def generate_user_id(username: str) -> str:
    """生成用户 ID"""
    return hashlib.md5(username.encode()).hexdigest()[:8]

class SocialManager:
    """社交功能管理器"""
    
    def __init__(self, username: str = "default"):
        self.username = username
        self.user_id = generate_user_id(username)
        self.data = load_social_data()
        self._ensure_user()
    
    def _ensure_user(self):
        """确保当前用户存在"""
        if self.user_id not in self.data["users"]:
            self.data["users"][self.user_id] = {
                "username": self.username,
                "created_at": datetime.now().isoformat(),
                "habits": {},
                "friends": [],
                "total_streak": 0
            }
            self._save()
    
    def _save(self):
        save_social_data(self.data)
    
    def sync_habits(self, habits_data: Dict):
        """同步习惯数据"""
        user = self.data["users"][self.user_id]
        user["habits"] = habits_data
        
        # 计算总连续天数
        from data import Habit
        total_streak = 0
        for habit_data in habits_data.values():
            habit = Habit.from_dict(habit_data)
            total_streak += habit.get_streak()
        
        user["total_streak"] = total_streak
        self._save()
    
    def add_friend(self, friend_username: str) -> tuple:
        """添加好友"""
        friend_id = generate_user_id(friend_username)
        
        if friend_id not in self.data["users"]:
            return False, f"用户 '{friend_username}' 不存在"
        
        if friend_id in self.data["users"][self.user_id]["friends"]:
            return False, "已是好友"
        
        self.data["users"][self.user_id]["friends"].append(friend_id)
        self._save()
        return True, f"已添加好友 '{friend_username}'"
    
    def get_friends(self) -> List[Dict]:
        """获取好友列表"""
        friends = []
        user = self.data["users"][self.user_id]
        
        for friend_id in user["friends"]:
            if friend_id in self.data["users"]:
                friend = self.data["users"][friend_id]
                friends.append({
                    "username": friend["username"],
                    "total_streak": friend["total_streak"],
                    "habits_count": len(friend["habits"])
                })
        
        return sorted(friends, key=lambda x: x["total_streak"], reverse=True)
    
    def create_challenge(self, habit_name: str, friend_username: str, days: int = 7) -> tuple:
        """创建挑战"""
        friend_id = generate_user_id(friend_username)
        
        if friend_id not in self.data["users"]:
            return False, f"用户 '{friend_username}' 不存在"
        
        challenge = {
            "id": f"challenge_{datetime.now().timestamp()}",
            "creator": self.user_id,
            "target": friend_id,
            "habit": habit_name,
            "days": days,
            "start_date": date.today().isoformat(),
            "status": "active"
        }
        
        self.data["challenges"].append(challenge)
        self._save()
        return True, f"已向 '{friend_username}' 发起 {days} 天挑战！"
    
    def get_leaderboard(self, limit: int = 10) -> List[Dict]:
        """获取排行榜"""
        users = []
        for user_id, user in self.data["users"].items():
            users.append({
                "username": user["username"],
                "total_streak": user["total_streak"],
                "habits_count": len(user["habits"]),
                "rank": 0
            })
        
        users = sorted(users, key=lambda x: x["total_streak"], reverse=True)[:limit]
        for i, user in enumerate(users):
            user["rank"] = i + 1
        
        return users
    
    def get_my_rank(self) -> Dict:
        """获取我的排名"""
        leaderboard = self.get_leaderboard(limit=100)
        for user in leaderboard:
            if user["username"] == self.username:
                return user
        return {"username": self.username, "rank": len(leaderboard) + 1, "total_streak": 0}
