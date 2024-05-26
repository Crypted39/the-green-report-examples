import requests

# List of URLs to test
urls = [
    'http://example.com/login',
    'http://example.com/register',
    'http://example.com/profile'
]


def check_https(url):
    https_url = url.replace('http://', 'https://')
    try:
        response = requests.get(https_url)
        if response.status_code == 200:
            print(f"HTTPS is enforced for: {url}")
        else:
            print(f"HTTPS not enforced for: {url}")
    except requests.exceptions.RequestException as e:
        print(f"Failed to connect to {https_url}: {e}")


for url in urls:
    check_https(url)
