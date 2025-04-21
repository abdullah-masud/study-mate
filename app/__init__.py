from flask import Flask
from app.models import db  # 只保留这一个 db 实例！
from app.dashboard import dashboard_bp
from app.dashboard_api import dashboard_api

def create_app():
    app = Flask(__name__)

    # Flask 配置
    app.config['SECRET_KEY'] = 'your_secret_key'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///studymate.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # 初始化数据库
    db.init_app(app)

    # 注册蓝图
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(dashboard_api)

    return app
