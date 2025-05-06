from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv
import os

from app.models import db
from app.dashboard import dashboard_bp
from app.dashboard_api import dashboard_api
from app.routes import home_bp


def create_app():
    # ✅ Load environment variables in .env file
    load_dotenv()

    app = Flask(__name__)

    # ✅ Configure Flask using environment variables
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    migrate = Migrate(app, db)

    # ✅ Registration Blueprint
    app.register_blueprint(home_bp)
    app.register_blueprint(dashboard_bp, url_prefix='/dashboard')
    app.register_blueprint(dashboard_api)
    
    print("🔒 SECRET_KEY loaded from .env:", os.getenv('SECRET_KEY'))


    return app

