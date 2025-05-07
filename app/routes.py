from flask import Blueprint, render_template
from flask import request, redirect, url_for, flash, session
from app.models import db, Student, StudySession
from app.utils import isPasswordComplex
from app.models import PasswordResetToken
import uuid
import datetime


home_bp = Blueprint('home', __name__)

@home_bp.route('/')
def home():
    return render_template('home/home.html')

@home_bp.route('/dashboard')
def dashboard():
    if "username" in session and "id" in session:
        user_id = session['id']
        sessions = StudySession.query.filter_by(student_id=user_id).all()  # 🟢 Get only this user's sessions
        return render_template('dashboard/dashboard.html', username=session['username'], sessions=sessions)
    flash('You must be logged in to view the dashboard.', 'warning')
    return redirect(url_for('home.login'))

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
            flash('Login successful!', 'success')
            return redirect(url_for('home.dashboard'))
        else:
             flash('Invalid email or password.', 'danger')

    return render_template('auth/login.html')

# Sign up route
# This route handles user registration. It checks if the username or email already exists in the database.
@home_bp.route('/signup', methods=['GET','POST'])
def signup():
    
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']

        # Validate password complexity
        valid, message = isPasswordComplex(password)
        if not valid:
            flash(message, 'danger')
            return render_template('auth/signup.html')

         # Check if user already exists
        existing_user = Student.query.filter((Student.username == username) | (Student.email == email)).first()
        if existing_user:
            flash('Username or email already exists.', 'warning')
            return redirect(url_for('home.signup'))  # This ensures the message is shown only on the signup page.

        # Create new user
        new_user = Student(username=username, email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        session['username'] = username  # Store username in session

        flash('Signup successful! Login to Continue', 'success')
        return redirect(url_for('home.login'))

    return render_template('auth/signup.html')

# logout route
@home_bp.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('home.login'))

@home_bp.route('/forgotPassword', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form['email']
        user = Student.query.filter_by(email=email).first()

        if user:
            # Create and save token
            token_entry = PasswordResetToken(user_id=user.id)
            db.session.add(token_entry)
            db.session.commit()

            # Redirect with token
            flash('Reset token created. Reset your password now.', 'info')
            return redirect(url_for('home.reset_password', token=token_entry.token))

        flash('If the email exists, a reset link is generated.', 'info')

    return render_template('auth/forgotPassword.html')

@home_bp.route('/resetPassword/<token>', methods=['GET', 'POST'])
def reset_password(token):
    token_entry = PasswordResetToken.query.filter_by(token=token).first()

    if not token_entry or token_entry.expiry < datetime.datetime.utcnow():
        flash('Invalid or expired token.', 'danger')
        return redirect(url_for('home.forgot_password'))

    if request.method == 'POST':
        password = request.form['password']
        confirm = request.form['confirm_password']

        valid, message = isPasswordComplex(password)
        if not valid:
            flash(message, 'danger')
            return render_template('auth/resetPassword.html', token=token)

        if password != confirm:
            flash("Passwords do not match.", "danger")
            return render_template('auth/resetPassword.html', token=token)

        user = token_entry.user
        user.set_password(password)
        db.session.delete(token_entry)  # Remove token
        db.session.commit()

        flash("Password updated successfully!", "success")
        return redirect(url_for('home.login'))

    return render_template('auth/resetPassword.html', token=token)


