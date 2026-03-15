"""
Vulnerable search API

The JSON *values* are safely parameterised.
The JSON *keys* are concatenated raw into SQL → SQL injection.
"""

import sqlite3
import os
from flask import Flask, request, jsonify

app = Flask(__name__)
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lilli_lab.db")


# ---------------------------------------------------------------------------
# DB setup
# ---------------------------------------------------------------------------

def init_db():
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id      INTEGER PRIMARY KEY,
            email   TEXT,
            role    TEXT
        );
        CREATE TABLE IF NOT EXISTS messages (
            id      INTEGER PRIMARY KEY,
            user_id INTEGER,
            body    TEXT
        );
        INSERT OR IGNORE INTO users VALUES (1, 'alice@mckinsey.com', 'partner');
        INSERT OR IGNORE INTO users VALUES (2, 'bob@mckinsey.com',   'analyst');
        INSERT OR IGNORE INTO messages VALUES (1, 1, 'Q3 merger strategy for client X');
        INSERT OR IGNORE INTO messages VALUES (2, 2, 'Draft slide deck for board meeting');
    """)
    con.commit()
    con.close()


def get_db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con


# ---------------------------------------------------------------------------
# Vulnerable endpoint  (no auth, keys concatenated into SQL)
# ---------------------------------------------------------------------------

@app.route("/api/search", methods=["POST"])
def search():
    body = request.get_json(force=True, silent=True) or {}

    results = []
    errors = []

    con = get_db()
    for key, value in body.items():
        # BUG: key is concatenated directly into the SQL string
        # NO BUG: value is safely parameterised via ?
        sql = f"SELECT * FROM messages WHERE {key} = ?"
        try:
            rows = con.execute(sql, (value,)).fetchall()
            results.extend([dict(r) for r in rows])
        except sqlite3.OperationalError as e:
            # Real bug: error message reflected back — leaks query shape
            errors.append(str(e))

    con.close()

    resp = {"results": results}
    if errors:
        resp["errors"] = errors  # ← this is what lets error-based extraction work
    return jsonify(resp)


# ---------------------------------------------------------------------------
# Fixed endpoint  (allowlist keys before building SQL)
# ---------------------------------------------------------------------------

ALLOWED_FIELDS = {"id", "user_id", "body"}


@app.route("/api/search/safe", methods=["POST"])
def search_safe():
    body = request.get_json(force=True, silent=True) or {}

    for key in body:
        if key not in ALLOWED_FIELDS:
            return jsonify({"error": f"Unknown field: {key}"}), 400

    con = get_db()
    results = []
    for key, value in body.items():
        sql = f"SELECT * FROM messages WHERE {key} = ?"  # key is now allowlisted
        rows = con.execute(sql, (value,)).fetchall()
        results.extend([dict(r) for r in rows])
    con.close()

    return jsonify({"results": results})


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.route("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    init_db()
    print("\nVulnerable endpoint: POST http://localhost:5000/api/search")
    print("Fixed endpoint: POST http://localhost:5000/api/search/safe\n")
    app.run(port=5000, debug=False)
