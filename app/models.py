from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import validates
from datetime import datetime, timedelta
from sqlalchemy import Float
import uuid
import hashlib
import os
import binascii

# SQLAlchemy object for database operations
db = SQLAlchemy()

# Study session model definition
class StudySession(db.Model):
    id = db.Column(db.Integer, primary_key=True)  # Auto-increment primary key
    date = db.Column(db.String(20), nullable=False)  # Date of study session
    subject = db.Column(db.String(100), nullable=False)  # Subject studied
    hours = db.Column(Float, nullable=False)  # Hours studied
    color = db.Column(db.String(20), default="#888888")  # Optional color label

    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)

    @classmethod
    def total_hours_for_student(cls, student_id):
        # Sum all hours for a student
        return db.session.query(db.func.sum(StudySession.hours)).filter_by(student_id=student_id).scalar() or 0

    def __repr__(self):
        return f'<StudySession {self.date} {self.subject} {self.hours}h>'

# Student user model with salted password hashing
class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(300), nullable=False)  # store salt + hash together
    password_history = db.Column(db.JSON, default=[])

    sessions = db.relationship('StudySession', backref='student', lazy=True)

    @validates('email')
    def validate_email(self, key, address):
        assert '@' in address, 'Invalid email address'
        return address

    def set_password(self, password):
        """Hashes password using PBKDF2-HMAC with a random salt."""
        salt = os.urandom(16)
        hashed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        self.password_hash = binascii.hexlify(salt).decode() + ':' + binascii.hexlify(hashed).decode()

    def check_password(self, password):
        """Verifies password by re-generating hash using stored salt."""
        try:
            salt_hex, hash_hex = self.password_hash.split(':')
            salt = binascii.unhexlify(salt_hex)
            expected_hash = binascii.unhexlify(hash_hex)
            new_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
            return new_hash == expected_hash
        except Exception:
            return False

    def __repr__(self):
        return f'<User {self.username}>'

# ShareRecord model
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

# PasswordResetToken model
class PasswordResetToken(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(100), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    expiry = db.Column(db.DateTime, nullable=False)

    user = db.relationship('Student', backref='reset_tokens')

    def __init__(self, user_id):
        self.token = str(uuid.uuid4())
        self.user_id = user_id
        self.expiry = datetime.utcnow() + timedelta(minutes=30)  # Valid for 30 minutes
