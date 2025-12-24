from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)

def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # Ensure known activities exist
    assert "Chess Club" in data


def test_signup_and_unregister():
    activity = "Chess Club"
    email = "testuser@example.com"

    # Ensure user not present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Signup
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    assert email in activities[activity]["participants"]

    # Duplicate signup should fail
    res2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert res2.status_code == 400

    # Unregister
    res3 = client.delete(f"/activities/{activity}/unregister?email={email}")
    assert res3.status_code == 200
    assert email not in activities[activity]["participants"]

    # Unregistering again should fail
    res4 = client.delete(f"/activities/{activity}/unregister?email={email}")
    assert res4.status_code == 400
