"""Backend tests for AW139 Power Assurance Calculator API."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://helicopter-calc.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- root ---
class TestRoot:
    def test_root(self, client):
        r = client.get(f"{API}/")
        assert r.status_code == 200
        assert "message" in r.json()


# --- /pac/calculate ---
class TestCalculate:
    def _payload(self, **overrides):
        base = {
            "oat": 15,
            "pressure_altitude": 6000,
            "engine1": {"torque": 101, "itt": 700, "ng": 95},
            "engine2": None,
        }
        base.update(overrides)
        return base

    def test_single_engine(self, client):
        r = client.post(f"{API}/pac/calculate", json=self._payload())
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["engine1"] is not None
        assert data["engine2"] is None
        assert data["overall_pass"] == data["engine1"]["passed"]

    def test_both_engines_overall_and(self, client):
        payload = self._payload(
            engine1={"torque": 101, "itt": 700, "ng": 95},
            engine2={"torque": 101, "itt": 730, "ng": 97},  # ITT 730 > max ~718 → fail
        )
        r = client.post(f"{API}/pac/calculate", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["engine1"] is not None and d["engine2"] is not None
        assert d["overall_pass"] == (d["engine1"]["passed"] and d["engine2"]["passed"])
        assert d["engine2"]["passed"] is False
        assert d["overall_pass"] is False

    def test_worked_example_values(self, client):
        # Chart's worked example: TQ~101, OAT 15, PA 6000 → max_itt ~718, max_ng ~96.8
        r = client.post(f"{API}/pac/calculate", json=self._payload())
        d = r.json()
        e1 = d["engine1"]
        assert 715 <= e1["max_itt"] <= 721, f"max_itt={e1['max_itt']}"
        assert 93.8 <= e1["max_ng"] <= 99.8, f"max_ng={e1['max_ng']}"

    def test_margins_and_fail_when_itt_exceeds_max(self, client):
        # Use a measured ITT well above max. With OAT15/PA6000/TQ101 max≈718.
        payload = self._payload(engine1={"torque": 101, "itt": 760, "ng": 95})
        r = client.post(f"{API}/pac/calculate", json=payload)
        d = r.json()
        e = d["engine1"]
        assert e["itt_pass"] is False
        assert e["passed"] is False
        # margin sign: max - measured = negative
        assert e["itt_margin"] == pytest.approx(round(e["max_itt"] - 760, 1), abs=0.2)
        assert e["itt_margin"] < 0

    def test_near_limit_flag_small_itt_margin(self, client):
        # set measured ITT = max - 5 → margin 5, near_limit True (caution band ≤10)
        # First get max
        r0 = client.post(f"{API}/pac/calculate", json=self._payload())
        max_itt = r0.json()["engine1"]["max_itt"]
        max_ng = r0.json()["engine1"]["max_ng"]
        payload = self._payload(engine1={"torque": 101, "itt": max_itt - 5, "ng": max_ng - 5})
        r = client.post(f"{API}/pac/calculate", json=payload)
        d = r.json()["engine1"]
        assert d["passed"] is True
        assert d["near_limit"] is True

    def test_oat_out_of_range(self, client):
        r = client.post(f"{API}/pac/calculate", json=self._payload(oat=60))
        assert r.status_code == 400
        r = client.post(f"{API}/pac/calculate", json=self._payload(oat=-50))
        assert r.status_code == 400

    def test_pa_out_of_range(self, client):
        r = client.post(f"{API}/pac/calculate", json=self._payload(pressure_altitude=15000))
        assert r.status_code == 400
        r = client.post(f"{API}/pac/calculate", json=self._payload(pressure_altitude=-2000))
        assert r.status_code == 400

    def test_op_limit_exceeded_notes(self, client):
        # ITT > 775 → op_limit_exceeded True and a note generated
        payload = self._payload(engine1={"torque": 106, "itt": 780, "ng": 103})
        r = client.post(f"{API}/pac/calculate", json=payload)
        d = r.json()["engine1"]
        assert d["op_limit_exceeded"] is True
        joined = " | ".join(d["notes"])
        assert "operational limit" in joined.lower()
        assert "775" in joined
        assert "102.4" in joined
        assert "105" in joined


# --- /pac/history ---
class TestHistory:
    def test_post_and_get_history_roundtrip(self, client):
        rec = {"note": "TEST_pac_history_entry", "oat": 15}
        r = client.post(f"{API}/pac/history", json=rec)
        assert r.status_code == 200, r.text
        new_id = r.json().get("id")
        assert new_id

        r2 = client.get(f"{API}/pac/history")
        assert r2.status_code == 200
        rows = r2.json()
        assert isinstance(rows, list)
        ids = [row.get("id") for row in rows]
        assert new_id in ids
        # ensure no mongo _id leaks
        for row in rows:
            assert "_id" not in row
