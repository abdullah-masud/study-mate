from app import app
from flask import render_template

@app.route('/home')
def home():
    return render_template('home/home.html')

@app.route('/login')
def login():
    return render_template('auth/login.html')
