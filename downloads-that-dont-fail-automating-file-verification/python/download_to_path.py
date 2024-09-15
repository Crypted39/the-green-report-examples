import time

from selenium import webdriver
from selenium.webdriver.common.by import By

# Set up Chrome options to specify download directory
options = webdriver.ChromeOptions()
prefs = {"download.default_directory": "/path/to/downloads"}  # Change to your desired path
options.add_experimental_option("prefs", prefs)

# Initialize the WebDriver with the configured options
driver = webdriver.Chrome(options=options)
driver.get("https://www.test.com")

# Trigger the download action
download_button = driver.find_element(By.ID, "download-button")
download_button.click()
time.sleep(1)
driver.quit()
