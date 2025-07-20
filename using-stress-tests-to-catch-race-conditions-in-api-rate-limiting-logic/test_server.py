from flask import Flask, request, jsonify
import time
from collections import defaultdict
from threading import Lock

app = Flask(__name__)


class BrokenRateLimiter:
    """Rate limiter with race condition for demonstration"""

    def __init__(self):
        self.requests = defaultdict(list)
        # Intentionally NOT using a lock to demonstrate race condition

    def is_allowed(self, client_id, limit=10, window_seconds=60):
        now = time.time()

        # RACE CONDITION: Multiple threads can read the same length
        # before any of them append their timestamp
        current_requests = [
            timestamp for timestamp in self.requests[client_id]
            if now - timestamp < window_seconds
        ]

        if len(current_requests) < limit:
            # Simulate some processing time to make race condition more likely
            time.sleep(0.001)
            self.requests[client_id] = current_requests + [now]
            return True

        return False


class FixedRateLimiter:
    """Properly synchronized rate limiter"""

    def __init__(self):
        self.requests = defaultdict(list)
        self.lock = Lock()

    def is_allowed(self, client_id, limit=10, window_seconds=60):
        with self.lock:  # This prevents race conditions
            now = time.time()

            # Clean old requests
            self.requests[client_id] = [
                timestamp for timestamp in self.requests[client_id]
                if now - timestamp < window_seconds
            ]

            # Check if under limit
            if len(self.requests[client_id]) < limit:
                self.requests[client_id].append(now)
                return True

            return False

    # Choose which rate limiter to test
    # Use BrokenRateLimiter to see the race condition
    # Use FixedRateLimiter to see proper behavior


# rate_limiter = BrokenRateLimiter()
rate_limiter = FixedRateLimiter()


@app.route('/api/data', methods=['GET'])
def get_data():
    client_id = request.headers.get('X-Client-ID', 'default')

    if rate_limiter.is_allowed(client_id, limit=10, window_seconds=60):
        return jsonify({
            "status": "success",
            "data": "Your API response data here",
            "timestamp": time.time(),
            "client_id": client_id
        }), 200
    else:
        return jsonify({
            "error": "Rate limit exceeded",
            "client_id": client_id,
            "timestamp": time.time()
        }), 429


@app.route('/api/status', methods=['GET'])
def get_status():
    """Endpoint to check current rate limit status"""
    client_id = request.headers.get('X-Client-ID', 'default')
    current_count = len([
        ts for ts in rate_limiter.requests[client_id]
        if time.time() - ts < 60
    ])

    return jsonify({
        "client_id": client_id,
        "current_requests_in_window": current_count,
        "limit": 10,
        "window_seconds": 60
    })


if __name__ == '__main__':
    print("Starting test server with BROKEN rate limiter...")
    print("API endpoints:")
    print("  GET http://localhost:8000/api/data (rate limited)")
    print("  GET http://localhost:8000/api/status (check rate limit status)")
    print("\nTo test the fixed version, change 'rate_limiter = FixedRateLimiter()' in the code")

    app.run(host='0.0.0.0', port=8000, threaded=True, debug=False)
