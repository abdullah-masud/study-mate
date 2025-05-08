import pytest
from app import create_app, db
from app.models import StudySession

# This fixture creates a temporary Flask test client with an in-memory SQLite database.
@pytest.fixture
def client():
    app = create_app({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'})
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client

# ✅ Test 1: Check if the home page ("/") is accessible and returns status code 200.
def test_home_page(client):
    response = client.get('/')
    assert response.status_code == 200

# ✅ Test 2: Verify that a study session can be successfully added via POST request.
def test_add_session(client):
    response = client.post('/api/add-session', json={
        'user_id': 1,
        'date': '2025-05-01',
        'subject': 'Math',
        'hours': 2,
        'color': '#ff0000'
    })
    assert response.status_code == 200
    assert response.json['status'] == 'success'

# ✅ Test 3: Ensure the summary API returns a valid dictionary when queried.
def test_get_summary(client):
    # Precondition: Add one record before fetching summary
    client.post('/api/add-session', json={
        'user_id': 1,
        'date': '2025-05-01',
        'subject': 'Math',
        'hours': 2.0,
        'color': '#ff0000'
    })
    response = client.get('/api/summary?user_id=1&start_date=2025-05-01')
    assert response.status_code == 200
    assert isinstance(response.json, dict)

# ✅ Test 4: Confirm that accessing a nonexistent route returns 404 Not Found.
def test_invalid_route(client):
    response = client.get('/nonexistent')
    assert response.status_code == 404

# ✅ Test 5: Check if the summary response contains expected keys like "total_hours".
def test_summary_keys(client):
    # Add a study record as precondition
    client.post('/api/add-session', json={
        'user_id': 2,
        'date': '2025-05-02',
        'subject': 'Physics',
        'hours': 1.5,
        'color': '#00ff00'
    })
    response = client.get('/api/summary?user_id=2&start_date=2025-05-01')
    summary = response.json

    # Adjust the key check based on your actual summary response format
    assert "total_hours" in summary or "summary" in summary
