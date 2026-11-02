import os
import sqlite3
import logging
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Initialize Flask to serve frontend static assets
app = Flask(__name__, static_folder="../frontend", static_url_path="/static")

# Intentional Security Flaw 1: Insecure Wildcard CORS with Credentials
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}})

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Intentional Security Flaw 2: Hardcoded Secrets (For Secret Scanners)
DVLA_INTERNAL_API_KEY = "dvla_live_sec_994829104810294820194820"
GCP_TEST_SERVICE_KEY = "AIzaSyD-FakeGoogleCloudKeyScannerTarget12345"
SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"

DB_FILE = "dvla_mock.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    # Intentional Security Flaw 3: Storing raw PII unencrypted
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS keepers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT,
            dob TEXT,
            car_reg TEXT,
            driving_licence TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

@app.route("/")
def index():
    return send_from_directory("../frontend", "index.html")

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    
    # Intentional Security Flaw 4: Logging Full Raw PII to stdout/Cloud Logging
    # Triggers DLP/PII scanners inspecting container logs
    logging.info("PII EXPOSURE: Processing registration payload: %s", data)

    full_name = data.get("full_name")
    dob = data.get("dob")
    car_reg = data.get("car_reg")
    driving_licence = data.get("driving_licence")

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO keepers (full_name, dob, car_reg, driving_licence) VALUES (?, ?, ?, ?)",
        (full_name, dob, car_reg, driving_licence)
    )
    conn.commit()
    conn.close()

    return jsonify({"status": "SUCCESS", "message": "Record registered", "data": data}), 201

@app.route("/api/vehicles", methods=["GET"])
def lookup_vehicle():
    car_reg = request.args.get("reg", "")
    
    # Intentional Security Flaw 5: Classic SQL Injection (Direct string concatenation)
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    raw_query = f"SELECT full_name, dob, car_reg, driving_licence FROM keepers WHERE car_reg = '{car_reg}'"
    logging.info("Executing raw SQL: %s", raw_query)

    try:
        cursor.execute(raw_query)
        rows = cursor.fetchall()
        # Intentional Security Flaw 6: Excessive Data Exposure (Exposing Licence/DOB on public lookup)
        results = [{"full_name": r[0], "dob": r[1], "car_reg": r[2], "driving_licence": r[3]} for r in rows]
        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)
