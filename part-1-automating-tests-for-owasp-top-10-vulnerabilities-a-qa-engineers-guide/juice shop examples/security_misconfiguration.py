import requests

# Base URL for Juice Shop
base_url = ''

# List of URLs to test
urls = [
    base_url + '/#/search',
    base_url + '/profile',
    base_url + '/#/score-board'
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
def check_default_credentials(url, creds):
    login_url = url + 'login'
    for username, password in creds:
        response = requests.post(login_url, data={'email': username, 'password': password})
        if response.status_code == 200 and 'authentication' in response.text:
            print(f'Default credentials work on {url} with username: {username} and password: {password}')
        else:
            print(f'Default credentials failed on {url} with username: {username} and password: {password}')


# Function to check for overly permissive headers
def check_headers(url):
    response = requests.get(url)
    if 'X-Frame-Options' not in response.headers:
        print(f'Missing X-Frame-Options header on: {url}')
    if 'Content-Security-Policy' not in response.headers:
        print(f'Missing Content-Security-Policy header on: {url}')
    if 'X-XSS-Protection' not in response.headers:
        print(f'Missing X-XSS-Protection header on: {url}')


print(f'\nTesting Base URL for Default Credentials: {base_url}')
check_default_credentials(base_url, default_credentials)

# Run tests
for url in urls:
    print(f'\nTesting URL: {url}')
    check_directory_listing(url)
    check_headers(url)
