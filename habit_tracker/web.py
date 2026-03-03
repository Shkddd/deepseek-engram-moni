"""Web 界面 - v2.0 (Flask)"""

from flask import Flask, render_template_string, request, jsonify, send_file
from manager import HabitManager
from export import ExportManager
from datetime import datetime
import os

app = Flask(__name__)
manager = HabitManager()
export_mgr = ExportManager()

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎯 习惯追踪器</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 { text-align: center; color: #333; margin-bottom: 30px; }
        .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            text-align: center;
        }
        .stat-card h3 { font-size: 2em; margin-bottom: 5px; }
        .stat-card p { opacity: 0.9; }
        .input-group {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
        }
        input[type="text"] {
            flex: 1;
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 16px;
        }
        button {
            padding: 15px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            cursor: pointer;
            transition: transform 0.2s;
        }
        button:hover { transform: translateY(-2px); }
        .habit-list { list-style: none; }
        .habit-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            margin: 10px 0;
            background: #f8f9fa;
            border-radius: 15px;
            transition: all 0.3s;
        }
        .habit-item:hover { box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .habit-info h3 { color: #333; margin-bottom: 5px; }
        .habit-stats { color: #666; font-size: 0.9em; }
        .habit-actions { display: flex; gap: 10px; }
        .btn-check { background: #28a745; }
        .btn-delete { background: #dc3545; }
        .btn-export { background: #17a2b8; margin-top: 20px; width: 100%; }
        .checked { opacity: 0.6; }
        .streak { color: #ff6b6b; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 习惯追踪器</h1>
        
        <div class="stats">
            <div class="stat-card">
                <h3>{{ stats.total_habits }}</h3>
                <p>总习惯</p>
            </div>
            <div class="stat-card">
                <h3>{{ stats.today_checkins }}/{{ stats.total_habits }}</h3>
                <p>今日完成</p>
            </div>
            <div class="stat-card">
                <h3>{{ stats.total_checkins }}</h3>
                <p>总打卡</p>
            </div>
        </div>
        
        <div class="input-group">
            <input type="text" id="habitInput" placeholder="输入习惯名称，如：早起">
            <button onclick="addHabit()">添加习惯</button>
        </div>
        
        <ul class="habit-list" id="habitList">
            {% for habit in habits %}
            <li class="habit-item {{ 'checked' if habit.today else '' }}">
                <div class="habit-info">
                    <h3>{{ '✅' if habit.today else '⬜' }} {{ habit.name }}</h3>
                    <div class="habit-stats">
                        连续 <span class="streak">{{ habit.streak }}</span> 天 🔥 
                        | 总计 {{ habit.total }} 次
                    </div>
                </div>
                <div class="habit-actions">
                    {% if not habit.today %}
                    <button class="btn-check" onclick="checkIn('{{ habit.name }}')">打卡</button>
                    {% endif %}
                    <button class="btn-delete" onclick="deleteHabit('{{ habit.name }}')">删除</button>
                </div>
            </li>
            {% endfor %}
        </ul>
        
        <button class="btn-export" onclick="exportData()">📥 导出数据</button>
    </div>
    
    <script>
        function addHabit() {
            const input = document.getElementById('habitInput');
            const name = input.value.trim();
            if (!name) return alert('请输入习惯名称');
            
            fetch('/api/habit', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name: name})
            }).then(() => location.reload());
        }
        
        function checkIn(name) {
            fetch(`/api/habit/${encodeURIComponent(name)}/check`, {method: 'POST'})
                .then(() => location.reload());
        }
        
        function deleteHabit(name) {
            if (!confirm('确定删除这个习惯？')) return;
            fetch(`/api/habit/${encodeURIComponent(name)}`, {method: 'DELETE'})
                .then(() => location.reload());
        }
        
        function exportData() {
            fetch('/api/export/csv').then(r => r.blob()).then(b => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(b);
                a.download = 'habits_export.csv';
                a.click();
            });
        }
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    stats = manager.get_stats()
    habits = stats['habits']
    return render_template_string(HTML_TEMPLATE, stats=stats, habits=habits)

@app.route('/api/habit', methods=['POST'])
def api_add_habit():
    data = request.json
    name = data.get('name')
    if name:
        manager.add_habit(name)
    return jsonify({'success': True})

@app.route('/api/habit/<name>/check', methods=['POST'])
def api_check_in(name):
    success, msg = manager.check_in(name)
    return jsonify({'success': success, 'message': msg})

@app.route('/api/habit/<name>', methods=['DELETE'])
def api_delete_habit(name):
    manager.delete_habit(name)
    return jsonify({'success': True})

@app.route('/api/export/csv')
def api_export_csv():
    path = export_mgr.export_csv()
    return send_file(path, as_attachment=True)

@app.route('/api/export/json')
def api_export_json():
    path = export_mgr.export_json()
    return send_file(path, as_attachment=True)

def run_web(port=5000):
    print(f"🌐 Web 界面启动：http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)

if __name__ == "__main__":
    run_web()
