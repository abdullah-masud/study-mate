from app import create_app, db
from app.models import Student, StudySession
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP, getcontext
import random

# Setting Floating Point Precision and Rounding
getcontext().prec = 4  # Limit the total number of digits
ROUND_TO = Decimal("0.1")

app = create_app()

with app.app_context():
    db.drop_all()
    db.create_all()

    # Add user jame
    jame = Student(
        email='jame@gmail.com',
        username='jame'
    )
    jame.set_password("Jame1234!")
    db.session.add(jame)
    db.session.commit()

    # Disciplines and colours
    subjects = [
        {'name': 'Math', 'color': '#f87171'},
        {'name': 'Physics', 'color': '#60a5fa'},
        {'name': 'Literature', 'color': '#34d399'},
        {'name': 'History', 'color': '#fbbf24'},
        {'name': 'ComputerSci', 'color': '#a78bfa'}
    ]

    
    start_date = datetime.strptime('2025-05-01', '%Y-%m-%d')
    for i in range(16):
        current_date = start_date + timedelta(days=i)

        
        num_subjects = random.choice([2, 3])
        today_subjects = random.sample(subjects, num_subjects)

        
        total_hours = Decimal(str(round(random.uniform(7.8, 8.3), 1)))

       
        weights = [Decimal(str(random.uniform(0.2, 0.5))) for _ in range(num_subjects)]
        total_weight = sum(weights)

        split_hours = [(w / total_weight * total_hours).quantize(ROUND_TO, rounding=ROUND_HALF_UP) for w in weights]

        for idx, subj in enumerate(today_subjects):
            session = StudySession(
                student_id=jame.id,
                date=current_date.date(),
                subject=subj['name'],
                hours=float(split_hours[idx]),  # Eventually it's converted back to a float and stored in the database.
                color=subj['color']
            )
            db.session.add(session)

    db.session.commit()
    print("✔ Seed data inserted: user 'jame' with clean 0.1-rounded study hours (no float tail!)")
