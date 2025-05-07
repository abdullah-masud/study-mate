from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_wtf.csrf import CSRFProtect
from dotenv import load_dotenv
import os

from app.models import db
from app.dashboard import dashboard_bp
from app.dashboard_api import dashboard_api
from app.routes import home_bp

def create_app(test_config=None):
    # Load environment variables
    load_dotenv()

    # Create Flask app instance
    app = Flask(__name__, instance_relative_config=True)

    # Secure secret key from environment
    secret_key = os.getenv('SECRET_KEY') or 'dev_key_please_change'

    # Dynamically construct cross-platform database path
    db_path = os.path.join(app.instance_path, 'studymate_database.db')
    db_uri = 'sqlite:///' + db_path

    # Configure app
    app.config.from_mapping(
        SECRET_KEY=secret_key,
        SQLALCHEMY_DATABASE_URI=db_uri,
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        WTF_CSRF_ENABLED=True,
        WTF_CSRF_TIME_LIMIT=3600,
    )

    # Ensure instance/ folder exists
    os.makedirs(os.path.dirname(db_path), exist_ok=True)

    # Apply test config if needed
    if test_config:
        app.config.from_mapping(test_config)

    # Init extensions
    csrf = CSRFProtect(app)
    db.init_app(app)
    Migrate(app, db)

    # Register blueprints
    app.register_blueprint(home_bp)
    app.register_blueprint(dashboard_bp, url_prefix='/dashboard')
    app.register_blueprint(dashboard_api)

    # Debug info
    print("✅ Flask App Created")
    print("📁 Database Path:", db_path)
    print("🔐 SECRET_KEY loaded:", bool(secret_key))

    return app
