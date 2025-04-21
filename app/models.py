from flask_sqlalchemy import SQLAlchemy

# 创建 SQLAlchemy 对象，用于数据库操作
db = SQLAlchemy()

# 学习记录模型类，对应数据库中的 study_session 表
class StudySession(db.Model):
    id = db.Column(db.Integer, primary_key=True)  # 主键，自增ID
    date = db.Column(db.String(20), nullable=False)  # 学习日期，字符串格式
    subject = db.Column(db.String(100), nullable=False)  # 学习科目
    hours = db.Column(db.Integer, nullable=False)  # 学习小时数

    def __repr__(self):
        # 调试时使用的字符串表示形式
        return f'<StudySession {self.date} {self.subject} {self.hours}h>'

