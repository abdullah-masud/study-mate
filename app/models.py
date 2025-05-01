from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.orm import validates
from datetime import datetime


# Creating SQLAlchemy objects for database operations
db = SQLAlchemy()

# The study record model class, corresponding to the study_session table in the database.
class StudySession(db.Model):
    id = db.Column(db.Integer, primary_key=True)  # Primary key, self incrementing ID
    date = db.Column(db.String(20), nullable=False)  # Learning Dates, String Format
    subject = db.Column(db.String(100), nullable=False)  # Study Subjects
    hours = db.Column(db.Integer, nullable=False)  # Study hours
    color = db.Column(db.String(20), default="#888888")  # 🟡 Added: Record colour values (e.g. #36a2eb)

    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)  # 👈 Link to Student

    @classmethod
    def total_hours_for_student(cls, student_id):
        #Calculate total study hours for a specific student.
        return db.session.query(db.func.sum(StudySession.hours)).filter_by(student_id=student_id).scalar() or 0


    def __repr__(self):
        # String representation for debugging
        return f'<StudySession {self.date} {self.subject} {self.hours}h>'

class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)

    sessions = db.relationship('StudySession', backref='student', lazy=True)  # 👈 Relationship

    @validates('email') # validates email
    def validate_email(self, key, addresss):
        assert '@' in addresss, 'Invalid email address'
        return addresss
    

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


    def __repr__(self):
        return f'<User {self.username}>'
    

class ShareRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    sender_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    recipient_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)

    sender = db.relationship('Student', foreign_keys=[sender_id], backref='sent_shares')
    recipient = db.relationship('Student', foreign_keys=[recipient_id], backref='received_shares')

    share_summary = db.Column(db.Boolean, default=False)
    share_bar = db.Column(db.Boolean, default=False)
    share_pie = db.Column(db.Boolean, default=False)

    shared_at = db.Column(db.DateTime, default=datetime.utcnow)


    def __repr__(self):
        return f'<ShareRecord from {self.sender_id} to {self.recipient_id}>'