from flask import Blueprint, request, jsonify, session
from app.models import db, StudySession
from collections import defaultdict
from datetime import datetime, timedelta

dashboard_api = Blueprint('dashboard_api', __name__)

# Route 1: Adding a Learning Record
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

    sessions = StudySession.query.filter_by(student_id=student_id).all()

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





