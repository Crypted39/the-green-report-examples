import time

from selenium import webdriver
from selenium.webdriver.common.by import By

# Set up WebDriver and navigate to the page
driver = webdriver.Chrome()
driver.get("https://www.test.com")

# Trigger the download by clicking the download link
download_link = driver.find_element(By.LINK_TEXT, "Click to Download")
download_link.click()

# The file is now being downloaded to the specified directory
time.sleep(1)
driver.quit()
