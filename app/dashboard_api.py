from flask import Blueprint, request, jsonify
from app.models import db, StudySession
from collections import defaultdict
from datetime import datetime


# 创建蓝图：用于学习记录相关 API
dashboard_api = Blueprint('dashboard_api', __name__)

# 路由 1：添加学习记录
@dashboard_api.route('/api/add-session', methods=['POST'])
def add_session():
    data = request.get_json()
    date = data.get('date')
    subject = data.get('subject')
    hours = data.get('hours')

    # 检查字段是否完整
    if not all([date, subject, isinstance(hours, int)]):
        return jsonify({"error": "Invalid data"}), 400

    # 创建记录并写入数据库
    session = StudySession(date=date, subject=subject, hours=hours)
    db.session.add(session)
    db.session.commit()

    return jsonify({"message": "Session added successfully!"}), 200

# 路由 2：返回统计信息
@dashboard_api.route('/api/get-summary', methods=['GET'])
def get_summary():
    sessions = StudySession.query.all()

    total_hours = 0
    subject_hours = defaultdict(int)

    # 遍历所有记录进行统计
    for s in sessions:
        total_hours += s.hours
        subject_hours[s.subject] += s.hours

    # 排序找出最多 / 最少学科
    most = max(subject_hours, key=subject_hours.get) if subject_hours else "-"
    least = min(subject_hours, key=subject_hours.get) if subject_hours else "-"

    return jsonify({
        "totalHours": total_hours,
        "mostStudied": most,
        "leastStudied": least
    })

# 路由 3：返回所有学习记录
@dashboard_api.route('/api/get-records', methods=['GET'])
def get_records():
    sessions = StudySession.query.order_by(StudySession.date.desc()).all()
    records = [
        {
            "id": s.id,  
            "date": s.date,
            "subject": s.subject,
            "hours": s.hours
        }
        for s in sessions
    ]
    return jsonify(records)



# 路由 4：删除学习记录
@dashboard_api.route('/api/delete-session/<int:session_id>', methods=['DELETE'])
def delete_session(session_id):
    session = StudySession.query.get(session_id)
    if session:
        db.session.delete(session)
        db.session.commit()
        return jsonify({"message": "Deleted successfully!"}), 200
    return jsonify({"error": "Record not found."}), 404

# 路由 5：按周返回学习记录
@dashboard_api.route('/api/productivity-by-day', methods=['GET'])
def productivity_by_day():
    sessions = StudySession.query.all()
    day_totals = {day: 0 for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]}

    for s in sessions:
        try:
            weekday = datetime.strptime(s.date, '%Y-%m-%d').strftime('%A')
            day_totals[weekday] += s.hours
        except Exception as e:
            print("⚠️ 日期转换失败：", s.date, e)

    return jsonify(day_totals)


