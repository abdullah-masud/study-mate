from flask import Blueprint, render_template
from flask import request, redirect, url_for, flash, session
from app.models import db, Student 


home_bp = Blueprint('home', __name__)




@home_bp.route('/')
def home():
    return render_template('home/home.html')

@home_bp.route('/dashboard')
def dashboard():
    id = session.get('id')  # or however you store it
    if not id:
        return redirect(url_for('login'))

    user = Student.query.get(id)
    return render_template('dashboard/dashboard.html', username=user.username)


# Login route
# This route clears the session and redirects to the home page.
@home_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        user = Student.query.filter_by(email=email).first()
        if user and user.check_password(password):
            session['id'] = user.id
            session['username'] = user.username
            flash('Login successful!')
            return redirect(url_for('home.dashboard'))
        else:
            flash('Invalid credentials')

    return render_template('auth/login.html')


# Sign up route
# This route handles user registration. It checks if the username or email already exists in the database.
@home_bp.route('/signup', methods=['GET','POST'])
def signup():
    
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']

        # Check if user already exists
        if Student.query.filter((Student.username == username) | (Student.email == email)).first():
            flash('Username or email already exists')
            return redirect(url_for('home.signup'))

        # Create new user
        new_user = Student(username=username, email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        session['username'] = username  # Store username in session

        flash('Signup successful! Please login.')
        return redirect(url_for('home.dashboard'))

    return render_template('auth/signup.html')
