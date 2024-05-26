import requests

# Base URL for the web application
base_url = 'http://example.com/'

# List of URLs to test for directory listing and headers
urls = [
    base_url,
    base_url + 'admin/',
    base_url + 'config/'
]

# Default credentials to test
default_credentials = [
    ('admin', 'admin'),
    ('root', 'root'),
    ('admin', 'password'),
    ('user', 'user')
]


# Function to check for directory listing
def check_directory_listing(url):
    response = requests.get(url)
    if 'Index of /' in response.text:
        print(f'Directory listing enabled on: {url}')
    else:
        print(f'Directory listing not enabled on: {url}')


# Function to check for default credentials
def check_default_credentials(base_url, creds):
    login_url = base_url + 'login'
    for username, password in creds:
        response = requests.post(login_url, data={'username': username, 'password': password})
        if response.status_code == 200 and 'Welcome' in response.text:
            print(f'Default credentials work on {base_url} with username: {username} and password: {password}')
        else:
            print(f'Default credentials failed on {base_url} with username: {username} and password: {password}')


# Function to check for overly permissive headers
def check_headers(url):
    response = requests.get(url)
    if 'X-Frame-Options' not in response.headers:
        print(f'Missing X-Frame-Options header on: {url}')
    if 'Content-Security-Policy' not in response.headers:
        print(f'Missing Content-Security-Policy header on: {url}')
    if 'X-XSS-Protection' not in response.headers:
        print(f'Missing X-XSS-Protection header on: {url}')


# Run tests
print(f'\nTesting Base URL for Default Credentials: {base_url}')
check_default_credentials(base_url, default_credentials)

for url in urls:
    print(f'\nTesting URL: {url}')
    check_directory_listing(url)
    check_headers(url)
