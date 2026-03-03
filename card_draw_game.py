#!/usr/bin/env python3
"""简单的抽纸牌小游戏"""

import random

# 定义花色和点数
SUITS = ['♠️ 黑桃', '♥️ 红心', '♦️ 方块', '♣️ 梅花']
RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

def create_deck():
    """创建一副牌"""
    return [f"{suit}{rank}" for suit in SUITS for rank in RANKS]

def draw_card(deck):
    """抽一张牌"""
    if not deck:
        return None
    return random.choice(deck)

def main():
    print("🎴 欢迎来到抽纸牌小游戏！")
    print("=" * 40)
    
    deck = create_deck()
    print(f"牌已洗好，共 {len(deck)} 张牌\n")
    
    while True:
        cmd = input("输入 '抽' 来抽牌，输入 'q' 退出：").strip()
        
        if cmd.lower() == 'q':
            print("再见！👋")
            break
        elif cmd == '抽':
            card = draw_card(deck)
            if card:
                print(f"你抽到了：{card}")
                # 不移除牌，可以重复抽到
            else:
                print("牌堆空了！")
        else:
            print("输入 '抽' 或 'q'")

if __name__ == "__main__":
    main()
