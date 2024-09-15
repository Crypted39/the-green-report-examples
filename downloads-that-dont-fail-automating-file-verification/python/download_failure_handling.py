import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By


# Function to check if the file was downloaded within a timeout period
def wait_for_download(file_path, timeout=30):
    for _ in range(timeout):
        if os.path.exists(file_path):
            return True
        time.sleep(1)
    return False


# Set the expected file path
file_path = "/path/to/file"

# Attempt to download the file
# (Add your Selenium download code here)
options = webdriver.ChromeOptions()
prefs = {"download.default_directory": "/path/to/downloads"}  # Change to your desired path
options.add_experimental_option("prefs", prefs)
driver = webdriver.Chrome(options=options)
driver.get("https://www.test.com")

# Trigger the download by clicking the button
download_button = driver.find_element(By.ID, "download-button")
download_button.click()

# Check if the file was downloaded successfully
if wait_for_download(file_path):
    print("File downloaded successfully")
else:
    raise Exception("File download failed after timeout")
