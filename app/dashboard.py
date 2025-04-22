from flask import Blueprint, render_template

# Define a unique name for the blueprint
dashboard_bp = Blueprint('dashboard_home', __name__, template_folder='templates')

@dashboard_bp.route('/')
def dashboard_home():
    return render_template('dashboard/dashboard.html')
