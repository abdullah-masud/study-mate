from flask import Flask
from app.models import db
from app.dashboard import dashboard_bp
from app.dashboard_api import dashboard_api
from app.routes import home_bp  # <-- add this

def create_app():
    app = Flask(__name__)

    app.config['SECRET_KEY'] = 'your_secret_key'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///studymate_yingqi.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    # Register all blueprints
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(dashboard_api)
    app.register_blueprint(home_bp)  # <-- register your home routes here

    return app
