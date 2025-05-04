from flask import Blueprint, request, jsonify, session
from app.models import db, StudySession, Student, ShareRecord
from collections import defaultdict
from datetime import datetime, timedelta

dashboard_api = Blueprint('dashboard_api', __name__)

# Route 1: Adding a Learning Record
@dashboard_api.route('/api/add-session', methods=['POST'])
def add_session():
    data = request.get_json()
    date = data.get('date')
    subject = data.get('subject')
    hours = float(data.get("hours"))
    color = data.get('color')

    student_id = session.get('id')
    if not student_id:
        return jsonify({"error": "User not logged in"}), 401

    if not date or not subject or not isinstance(hours, (int, float)) or hours is None:
        return jsonify({"error": "Invalid input data format."}), 400


    if hours <= 0 or hours > 24:
        return jsonify({"error": "Hours must be between 1 and 24."}), 400

    try:
        date_obj = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    existing_sessions = StudySession.query.filter_by(date=date, student_id=student_id).all()
    total_hours = sum(s.hours for s in existing_sessions)

    if total_hours + hours > 24:
        return jsonify({"error": f"Total study time for {date} exceeds 24 hours."}), 400

    existing = StudySession.query.filter_by(date=date, subject=subject, student_id=student_id).first()

    if existing:
        existing.hours += hours
        existing.color = color
    else:
        new_session = StudySession(
            date=date,
            subject=subject,
            hours=hours,
            color=color,
            student_id=student_id
        )
        db.session.add(new_session)

    db.session.commit()
    return jsonify({"message": "Session added successfully!"}), 200

# Route 2: Return Statistics
@dashboard_api.route('/api/get-summary', methods=['GET'])
def get_summary():
    student_id = session.get('id')
    if not student_id:
        return jsonify({"error": "User not logged in"}), 401

    # 获取时间范围参数
    start_str = request.args.get('start')
    end_str = request.args.get('end')

    try:
        if not start_str or not end_str:
            raise ValueError("Missing date range")
        start_date = datetime.strptime(start_str, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_str, "%Y-%m-%d").date()
    except Exception as e:
        return jsonify({"error": f"Invalid date format: {e}"}), 400

    sessions = StudySession.query.filter(
        StudySession.student_id == student_id,
        StudySession.date >= start_date,
        StudySession.date <= end_date
    ).all()

    total_hours = 0
    subject_hours = defaultdict(int)

    for s in sessions:
        total_hours += s.hours
        subject_hours[s.subject] += s.hours

    most = max(subject_hours, key=subject_hours.get) if subject_hours else "-"
    least = min(subject_hours, key=subject_hours.get) if subject_hours else "-"

    return jsonify({
        "totalHours": total_hours,
        "mostStudied": most,
        "leastStudied": least
    })

# Route 3: Return to All Learning Records
@dashboard_api.route('/api/get-records', methods=['GET'])
def get_records():
    student_id = session.get('id')
    if not student_id:
        return jsonify({"error": "User not logged in"}), 401

    sessions = StudySession.query.filter_by(student_id=student_id).order_by(StudySession.date.desc()).all()
    records = [
        {
            "id": s.id,
            "date": s.date,
            "subject": s.subject,
            "hours": s.hours,
            "color": s.color
        }
        for s in sessions
    ]
    return jsonify(records)

# Route 4: Deletion of Learning Record (renamed ✅)
@dashboard_api.route('/api/delete-session/<int:session_id>', methods=['DELETE'])
def delete_study_session(session_id):
    student_id = session.get('id')
    if not student_id:
        return jsonify({"error": "User not logged in"}), 401

    record = StudySession.query.get(session_id)
    if record and record.student_id == student_id:
        db.session.delete(record)
        db.session.commit()
        return jsonify({"message": "Deleted successfully!"}), 200
    return jsonify({"error": "Record not found or no permission."}), 404

# Route 5: Return to Learning Record by Week
@dashboard_api.route('/api/productivity-by-day', methods=['GET'])
def productivity_by_day():
    student_id = session.get('id')
    if not student_id:
        return jsonify({"error": "User not logged in"}), 401

    start_str = request.args.get("start")
    try:
        start_date = datetime.strptime(start_str, "%Y-%m-%d").date() if start_str else datetime.today().date()
    except Exception:
        return jsonify({"error": "Invalid date format."}), 400

    end_date = start_date + timedelta(days=6)

    sessions = StudySession.query.filter(
        StudySession.student_id == student_id,
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

# Route 6: Updating the colours of a subject
@dashboard_api.route('/api/update-color-subject/<subject>', methods=['PUT'])
def update_color_by_subject(subject):
    student_id = session.get('id')
    if not student_id:
        return jsonify({"error": "User not logged in"}), 401

    data = request.get_json()
    new_color = data.get("color")
    if not new_color:
        return jsonify({"error": "No color provided"}), 400

    sessions = StudySession.query.filter_by(student_id=student_id, subject=subject).all()
    for s in sessions:
        s.color = new_color

    db.session.commit()
    return jsonify({"message": f"Color updated for subject {subject}!"}), 200



# ========== 分享功能 ==========
@dashboard_api.route('/api/share-record', methods=['POST'])
def share_record():
    data = request.get_json()
    sender_id = session.get('id')
    recipient_email = data.get("recipient_email")
    share_summary = data.get("share_summary")
    share_bar = data.get("share_bar")
    share_pie = data.get("share_pie")

    recipient = Student.query.filter_by(email=recipient_email).first()
    if not recipient:
        return jsonify({"error": "Recipient not found"}), 404

    record = ShareRecord(
        sender_id=sender_id,
        recipient_id=recipient.id,
        share_summary=share_summary,
        share_bar=share_bar,
        share_pie=share_pie
    )
    db.session.add(record)
    db.session.commit()
    return jsonify({"message": "Record shared successfully!"})


@dashboard_api.route('/api/received-shares', methods=['GET'])
def get_received_shares():
    user_id = session.get('id')
    shares = ShareRecord.query.filter_by(recipient_id=user_id).all()
    senders = {}
    for share in shares:
        email = share.sender.email
        if email not in senders:
            senders[email] = {"summary": [], "bar": [], "pie": []}
        if share.share_summary:
            senders[email]["summary"].append(True)
        if share.share_bar:
            senders[email]["bar"].append(True)
        if share.share_pie:
            senders[email]["pie"].append(True)
    return jsonify(senders)


@dashboard_api.route('/api/shared-chart-data', methods=['GET'])
def get_shared_chart_data():
    sender_email = request.args.get('sender_email')
    start_str = request.args.get('start')
    current_user_id = session.get('id')

    sender = Student.query.filter_by(email=sender_email).first()
    if not sender:
        return jsonify({"error": "Sender not found"}), 404

    # ✅ 默认 start = 今天 -6 天；否则按传入解析
    try:
        if start_str:
            start_date = datetime.strptime(start_str, "%Y-%m-%d").date()
        else:
            start_date = datetime.today().date() - timedelta(days=6)
    except Exception as e:
        return jsonify({"error": f"Invalid start date: {e}"}), 400

    end_date = start_date + timedelta(days=6)

    sessions = StudySession.query.filter(
        StudySession.student_id == sender.id,
        StudySession.date >= start_date,
        StudySession.date <= end_date
    ).all()

        # ✅ 统计总小时、科目小时数、颜色
    total_hours = 0
    subject_hours = defaultdict(int)
    bar_data = defaultdict(lambda: defaultdict(int))
    colors = {}

    # ✅ 提取所有出现过的科目
    all_subjects = set(s.subject for s in sessions)

    # ✅ 初始化 raw_data 为每天都有所有科目的结构
    raw_data = {}
    for i in range(7):
        day_obj = start_date + timedelta(days=i)
        date_str = day_obj.strftime('%Y-%m-%d')
        raw_data[date_str] = {}

        for subject in all_subjects:
            # 查找该科目的颜色（只找一次）
            if subject not in colors:
                subject_color = next((s.color or "#888" for s in sessions if s.subject == subject), "#888")
                colors[subject] = subject_color
            raw_data[date_str][subject] = {
                "hours": 0,
                "color": colors[subject]
            }

    # ✅ 填入实际数据
    for s in sessions:
        total_hours += s.hours
        subject_hours[s.subject] += s.hours
        date_str = s.date.strftime('%Y-%m-%d') if not isinstance(s.date, str) else s.date
        bar_data[date_str][s.subject] += s.hours
        raw_data[date_str][s.subject]["hours"] += s.hours



    dates = [(start_date + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(7)]
    subjects = list(subject_hours.keys())

    bar_chart_data = {
        "labels": dates,
        "datasets": [
            {
                "label": subject,
                "data": [bar_data.get(date, {}).get(subject, 0) for date in dates],
                "backgroundColor": colors.get(subject, "#ccc")
            }
            for subject in subjects
        ]
    }

    pie_chart_data = {
        "labels": subjects,
        "datasets": [{
            "data": [subject_hours[subj] for subj in subjects],
            "backgroundColor": [colors.get(subj, "#ccc") for subj in subjects]
        }]
    }

    return jsonify({
        "summary": {
            "totalHours": total_hours,
            "mostStudied": max(subject_hours, key=subject_hours.get) if subject_hours else "-",
            "leastStudied": min(subject_hours, key=subject_hours.get) if subject_hours else "-"
        },
        "barChartData": bar_chart_data,
        "pieChartData": pie_chart_data,
        "rawData": raw_data  # ✅ 前端可以用它构建和 MyData 一致的图表
    })





