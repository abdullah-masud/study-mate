from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

# 创建 SQLAlchemy 对象，用于数据库操作
db = SQLAlchemy()

# 学习记录模型类，对应数据库中的 study_session 表
class StudySession(db.Model):
    id = db.Column(db.Integer, primary_key=True)  # 主键，自增ID
    date = db.Column(db.String(20), nullable=False)  # 学习日期，字符串格式
    subject = db.Column(db.String(100), nullable=False)  # 学习科目
    hours = db.Column(db.Integer, nullable=False)  # 学习小时数
    color = db.Column(db.String(20), default="#888888")  # 🟡 新增：记录颜色值（如 #36a2eb）

    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)  # 👈 Link to Student


    def __repr__(self):
        # 调试时使用的字符串表示形式
        return f'<StudySession {self.date} {self.subject} {self.hours}h>'

class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)

    sessions = db.relationship('StudySession', backref='student', lazy=True)  # 👈 Relationship

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


    def __repr__(self):
        return f'<User {self.username}>'