import requests
from datetime import datetime

url = "https://testing-api.com"
params = {"_": datetime.now().timestamp()}  # Cache-busting query parameter
headers = {"Cache-Control": "no-cache"}
response = requests.get(url, params=params, headers=headers)
print(response.json())
