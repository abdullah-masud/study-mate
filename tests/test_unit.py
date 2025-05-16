import pytest
from app import create_app, db
from app.models import Student, StudySession

@pytest.fixture
def client():
    app = create_app({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'})
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            # Create a test student and commit to DB
            student = Student(username='testuser', email='test@example.com')
            student.set_password("Test@1234")
            db.session.add(student)
            db.session.commit()
            
            student_id = student.id
            
            # Simulate login by setting session id 
            with client.session_transaction() as sess:
                sess['id'] = student_id
                
        yield client

# ✅ Test 1: Home page loads successfully
def test_home_page(client):
    response = client.get('/')
    assert response.status_code == 200

# ✅ Test 2: Add study session
def test_add_session(client):
    response = client.post('/api/add-session', json={
        'user_id': 1,
        'date': '2025-05-01',
        'subject': 'Math',
        'hours': 2.0,
        'color': '#ff0000'
    })
    assert response.status_code == 200
    assert response.json['message'] == 'Session added successfully!'

# ✅ Test 3: Get summary after inserting data
def test_get_summary(client):
    client.post('/api/add-session', json={
        'user_id': 1,
        'date': '2025-05-01',
        'subject': 'Math',
        'hours': 2.0,
        'color': '#ff0000'
    })
    response = client.get('/api/get-summary?start=2025-05-01&end=2025-05-31')
    assert response.status_code == 200
    assert isinstance(response.json, dict)

# ✅ Test 4: Handle non-existing routes
def test_invalid_route(client):
    response = client.get('/nonexistent')
    assert response.status_code == 404

# ✅ Test 5: Check keys in summary response
def test_summary_keys(client):
    client.post('/api/add-session', json={
        'user_id': 1,
        'date': '2025-05-02',
        'subject': 'Physics',
        'hours': 1.5,
        'color': '#00ff00'
    })
    response = client.get('/api/get-summary?start=2025-05-01&end=2025-05-31')
    summary = response.json
    assert summary is not None
    assert "totalHours" in summary

# ✅ Test 6: Test user authentication process
def test_user_authentication():
    # Create a new test client without any sessions
    app = create_app({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'})
    
    with app.app_context():
        db.create_all()
        # Create test users
        student = Student(username='testauth', email='testauth@example.com')
        student.set_password("Test@1234")
        db.session.add(student)
        db.session.commit()
    
    with app.test_client() as client:
        # When testing and viewing the dashboard, it will be redirected to the login page
        response = client.get('/dashboard')
        assert response.status_code == 302  
        
        # After a successful test login, you can access the dashboard
        with client.session_transaction() as sess:
            sess['id'] = 1
            sess['username'] = 'testauth'
        
        response = client.get('/dashboard')
        assert response.status_code == 200  
        
        # Test logout
        response = client.get('/logout', follow_redirects=True)
        assert response.status_code == 200
        
        # Confirm that you have logged out
        response = client.get('/dashboard')
        assert response.status_code == 302 
