from flask import Flask
from app.models import db
from app.dashboard import dashboard_bp
from app.dashboard_api import dashboard_api
from app.routes import home_bp   
from flask_migrate import Migrate
from flask_wtf.csrf import CSRFProtect

def create_app():
    app = Flask(__name__)

    app.config['SECRET_KEY'] = 'your_secret_key'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///studymate_database.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['WTF_CSRF_ENABLED'] = True # Enable CSRF protection
    app.config['WTF_CSRF_TIME_LIMIT'] = 3600  # Token expires after 1 hour
    
    csrf = CSRFProtect()
    csrf.init_app(app)
    db.init_app(app)
    migrate = Migrate(app, db)

    # Register the blueprints
    app.register_blueprint(home_bp)  # Home routes without prefix
    app.register_blueprint(dashboard_bp, url_prefix='/dashboard')  # Dashboard routes with '/dashboard' prefix
    app.register_blueprint(dashboard_api)

    return app
