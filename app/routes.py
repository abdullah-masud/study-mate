from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from app.models import db, Student, StudySession, PasswordResetToken
from app.utils import isPasswordComplex
from app.forms import LoginForm, SignupForm, ForgotPasswordForm, ResetPasswordForm
import datetime

home_bp = Blueprint('home', __name__)

@home_bp.route('/')
def home():
    session.clear()
    return render_template('home/home.html')

@home_bp.route('/dashboard')
def dashboard():
    if "username" in session and "id" in session:
        user_id = session['id']
        sessions = StudySession.query.filter_by(student_id=user_id).all()
        return render_template('dashboard/dashboard.html', username=session['username'], sessions=sessions)
    flash('You must be logged in to view the dashboard.', 'warning')
    return redirect(url_for('home.login'))

@home_bp.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        email = form.email.data
        password = form.password.data

        user = Student.query.filter_by(email=email).first()
        if user and user.check_password(password):
            session.permanent = False
            session['id'] = user.id
            session['username'] = user.username
            
            flash('Login successful!', 'success')
            return redirect(url_for('home.dashboard'))
        else:
            flash('Invalid email or password.', 'danger')

    return render_template('auth/login.html', form=form)

@home_bp.route('/signup', methods=['GET', 'POST'])
def signup():
    form = SignupForm()
    if form.validate_on_submit():
        username = form.username.data
        email = form.email.data
        password = form.password.data

        valid, message = isPasswordComplex(password)
        if not valid:
            flash(message, 'danger')
            return render_template('auth/signup.html', form=form)

        existing_user = Student.query.filter((Student.username == username) | (Student.email == email)).first()
        if existing_user:
            flash('Username or email already exists.', 'warning')
            return redirect(url_for('home.signup'))

        new_user = Student(username=username, email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()

        session['username'] = username
        flash('Signup successful! Login to continue.', 'success')
        return redirect(url_for('home.login'))

    return render_template('auth/signup.html', form=form)

@home_bp.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('home.login'))

@home_bp.route('/forgotPassword', methods=['GET', 'POST'])
def forgot_password():
    form = ForgotPasswordForm()
    if form.validate_on_submit():
        email = form.email.data
        user = Student.query.filter_by(email=email).first()

        if user:
            token_entry = PasswordResetToken(user_id=user.id)
            db.session.add(token_entry)
            db.session.commit()
            flash('Reset token created. Reset your password now.', 'info')
            return redirect(url_for('home.reset_password', token=token_entry.token))

        flash('If the email exists, a reset link is generated.', 'info')

    return render_template('auth/forgotPassword.html', form=form)

@home_bp.route('/resetPassword/<token>', methods=['GET', 'POST'])
def reset_password(token):
    token_entry = PasswordResetToken.query.filter_by(token=token).first()

    if not token_entry or token_entry.expiry < datetime.datetime.utcnow():
        flash('Invalid or expired token.', 'danger')
        return redirect(url_for('home.forgot_password'))

    form = ResetPasswordForm()
    if form.validate_on_submit():
        password = form.password.data
        confirm = form.confirm_password.data

        valid, message = isPasswordComplex(password)
        if not valid:
            flash(message, 'danger')
            return render_template('auth/resetPassword.html', form=form, token=token)

        if password != confirm:
            flash("Passwords do not match.", "danger")
            return render_template('auth/resetPassword.html', form=form, token=token)

        user = token_entry.user
        user.set_password(password)
        db.session.delete(token_entry)
        db.session.commit()

        flash("Password updated successfully!", "success")
        return redirect(url_for('home.login'))

    return render_template('auth/resetPassword.html', form=form, token=token)


