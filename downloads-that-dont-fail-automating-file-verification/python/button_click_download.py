import time
from selenium import webdriver
from selenium.webdriver.common.by import By

# Set up WebDriver and navigate to the page
driver = webdriver.Chrome()
driver.get("https://www.test.com")

# Trigger the download by clicking the button
download_button = driver.find_element(By.ID, "download-button")
download_button.click()

# The file is now downloading
time.sleep(1)
driver.quit()
