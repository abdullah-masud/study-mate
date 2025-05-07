from app import create_app
import os

# Create Flask application instance
app = create_app()

# Setup database
with app.app_context():
    # Ensure instance directory exists
    os.makedirs(app.instance_path, exist_ok=True)
    
    # Import database models
    from app.models import db
    
    # Create all tables
    db.create_all()

# Only start the application when this file is run directly
if __name__ == '__main__':
    app.run(debug=True)