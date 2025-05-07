from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv
import os
import sys

from app.models import db
from app.dashboard import dashboard_bp
from app.dashboard_api import dashboard_api
from app.routes import home_bp


def create_app(test_config=None):
    # Load .env file
    load_dotenv()
    
    # Create Flask application instance
    app = Flask(__name__, instance_relative_config=True)
    
    # Get environment variables
    database_url = os.getenv('DATABASE_URL')
    secret_key = os.getenv('SECRET_KEY')
    
    # Configure Flask application
    app.config.from_mapping(
        SECRET_KEY=secret_key or 'dev_key_please_change',
        SQLALCHEMY_DATABASE_URI=database_url or 'sqlite:///instance/studymate_database.db',
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )
    
    # Ensure instance folder exists
    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except OSError:
        pass
    
    # Test configuration (if provided)
    if test_config is not None:
        app.config.from_mapping(test_config)
    
    # Initialize database
    db.init_app(app)
    migrate = Migrate(app, db)
    
    # Register blueprints
    app.register_blueprint(home_bp)
    app.register_blueprint(dashboard_bp, url_prefix='/dashboard')
    app.register_blueprint(dashboard_api)
    
    print(f"🔒 DATABASE_URL loaded from .env: {database_url}")

    
    return app