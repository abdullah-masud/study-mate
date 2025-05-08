# seed.py

from app import create_app, db
from app.models import Student, StudySession
from datetime import datetime

app = create_app()

with app.app_context():
    # Drop and recreate all tables (for fresh testing)
    db.drop_all()
    db.create_all()

    # Create sample student and hash password
    student = Student(
        email='test@example.com',
        username='testuser'
    )
    student.set_password("Testpassword123！")
    db.session.add(student)
    db.session.commit()  # Must commit to generate student.id

    # Create sample study sessions for that student
    sessions = [
        StudySession(student_id=student.id, date='2025-05-01', subject='Math', hours=2.5, color='#ff0000'),
        StudySession(student_id=student.id, date='2025-05-02', subject='Science', hours=1.5, color='#00ff00'),
        StudySession(student_id=student.id, date='2025-05-03', subject='English', hours=3.0, color='#0000ff'),
    ]
    db.session.add_all(sessions)
    db.session.commit()

    print("✔ Seed data inserted: 1 student + 3 study sessions")
