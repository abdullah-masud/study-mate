from flask_wtf import FlaskForm
from wtforms import StringField, EmailField, SubmitField, TextAreaField
from wtforms.validators import DataRequired, Email

class ContactForm(FlaskForm):
    name = StringField('Name', validators=[DataRequired()])
    email = EmailField('Email', validators=[DataRequired(), Email()])
    message = TextAreaField('Message', validators=[DataRequired()])
    submit = SubmitField('Send Message')

class NewsletterForm(FlaskForm):
    email = EmailField('Email', validators=[DataRequired(), Email()])
    submit = SubmitField('Subscribe')
