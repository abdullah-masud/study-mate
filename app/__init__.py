from flask import Flask
from app.models import db
from app.dashboard import dashboard_bp
from flask_sqlalchemy import SQLAlchemy
from app.dashboard_api import dashboard_api
from app.routes import home_bp  # Add this to import the home routes
from flask_migrate import Migrate


def create_app():
    app = Flask(__name__)

    app.config['SECRET_KEY'] = 'your_secret_key'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///studymate_database.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    migrate = Migrate(app, db)


    # from .routes import home_bp, dashboard_bp, dashboard_api
    # Register the blueprints
    app.register_blueprint(home_bp)  # Home routes without prefix
    app.register_blueprint(dashboard_bp, url_prefix='/dashboard')  # Dashboard routes with '/dashboard' prefix
    app.register_blueprint(dashboard_api)

    return app
