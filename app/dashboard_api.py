from flask import Blueprint, request, jsonify, session
from app.models import db, StudySession
from collections import defaultdict
from datetime import datetime
from datetime import timedelta

# 创建蓝图：用于学习记录相关 API
dashboard_api = Blueprint('dashboard_api', __name__)

# 路由 1：添加学习记录
@dashboard_api.route('/api/add-session', methods=['POST'])
def add_session():
    data = request.get_json()
    date = data.get('date')
    subject = data.get('subject')
    hours = data.get('hours')
    color = data.get('color')
    
    student_id = session.get('id')
    if not student_id:
        return jsonify({"error": "User not logged in"}), 401

    if not date or not subject or not isinstance(hours, int):
        return jsonify({"error": "Invalid input data format."}), 400

    if hours <= 0 or hours > 24:
        return jsonify({"error": "Hours must be between 1 and 24."}), 400

    try:
        date_obj = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    # 🟡 只查询该用户自己的记录！
    existing_sessions = StudySession.query.filter_by(date=date, student_id=student_id).all()
    total_hours = sum(s.hours for s in existing_sessions)

    if total_hours + hours > 24:
        return jsonify({"error": f"Total study time for {date} exceeds 24 hours."}), 400

    # ✅ 查找当天这个学生这个科目的记录
    existing = StudySession.query.filter_by(date=date, subject=subject, student_id=student_id).first()

    if existing:
        existing.hours += hours
        existing.color = color  # 可选更新颜色
    else:
        new_session = StudySession(
            date=date,
            subject=subject,
            hours=hours,
            color=color,
            student_id=student_id  # ✅ 必须带 student_id
        )
        db.session.add(new_session)

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
            "hours": s.hours,
            "color": s.color  # ✅ 加上 color 字段
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
    start_str = request.args.get("start")
    try:
        if start_str:
            start_date = datetime.strptime(start_str, "%Y-%m-%d").date()
        else:
            start_date = datetime.today().date()
    except Exception as e:
        return jsonify({"error": "Invalid date format."}), 400

    end_date = start_date + timedelta(days=6)

    sessions = StudySession.query.filter(
        StudySession.date >= start_date,
        StudySession.date <= end_date
    ).all()

    data = defaultdict(lambda: defaultdict(lambda: {"hours": 0, "color": "#999"}))

    for s in sessions:
        subj = s.subject.lower()
        data[s.date][subj]["hours"] += s.hours
        if s.color:
            data[s.date][subj]["color"] = s.color

    sorted_data = dict(sorted(data.items()))
    return jsonify(sorted_data)


# ✅ 路由 6：更新颜色字段
@dashboard_api.route('/api/update-color-subject/<subject>', methods=['PUT'])
def update_color_by_subject(subject):
    data = request.get_json()
    new_color = data.get("color")
    if not new_color:
        return jsonify({"error": "No color provided"}), 400

    sessions = StudySession.query.filter_by(subject=subject).all()
    for session in sessions:
        session.color = new_color

    db.session.commit()
    return jsonify({"message": f"All {subject} colors updated!"}), 200



