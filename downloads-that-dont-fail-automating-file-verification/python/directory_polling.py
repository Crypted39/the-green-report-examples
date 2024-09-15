import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By

# Set up WebDriver and configure the download directory
options = webdriver.ChromeOptions()
download_directory = "/path/to/downloads"
prefs = {"download.default_directory": download_directory}
options.add_experimental_option("prefs", prefs)

driver = webdriver.Chrome(options=options)
driver.get("https://www.test.com")

# Trigger the download by clicking the button
download_button = driver.find_element(By.ID, "download-button")
download_button.click()

# Define the expected file name and the download path
file_name = "sample-file.txt"
file_path = os.path.join(download_directory, file_name)

# Poll the download directory and wait for the file to appear
timeout = 30  # Maximum wait time in seconds
poll_interval = 1  # Time between checks in seconds
elapsed_time = 0

while not os.path.exists(file_path):
    time.sleep(poll_interval)
    elapsed_time += poll_interval
    if elapsed_time > timeout:
        raise Exception(f"Download timed out. File not found: {file_name}")

# Once the file is downloaded, proceed with the test
print(f"File downloaded successfully: {file_name}")

driver.quit()
