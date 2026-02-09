from fastapi.testclient import TestClient

from src.app import app, activities


client = TestClient(app)


def test_root_redirects_to_static_index():
    response = client.get("/", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"


def test_get_activities_returns_expected_payload():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert "Soccer Team" in data
    assert data["Soccer Team"]["max_participants"] == 18


def test_signup_adds_participant():
    activity_name = "Soccer Team"
    email = "test-student@mergington.edu"

    activities[activity_name]["participants"] = []

    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": email},
    )

    assert response.status_code == 200
    assert email in activities[activity_name]["participants"]


def test_signup_rejects_duplicate_participant():
    activity_name = "Art Studio"
    email = "duplicate@mergington.edu"

    activities[activity_name]["participants"] = [email]

    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": email},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_unregister_removes_participant():
    activity_name = "Chess Club"
    email = "michael@mergington.edu"

    activities[activity_name]["participants"] = [email]

    response = client.delete(
        f"/activities/{activity_name}/participants",
        params={"email": email},
    )

    assert response.status_code == 200
    assert email not in activities[activity_name]["participants"]


def test_unregister_missing_participant_returns_404():
    activity_name = "Drama Club"
    email = "missing@mergington.edu"

    activities[activity_name]["participants"] = []

    response = client.delete(
        f"/activities/{activity_name}/participants",
        params={"email": email},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Student not found in this activity"
