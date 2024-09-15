import time
from selenium import webdriver
from selenium.webdriver.common.by import By

# Set up WebDriver and navigate to the form page
driver = webdriver.Chrome()
driver.get("https://www.test.com")

# Fill out the form fields
first_name = driver.find_element(By.NAME, "first-name")
first_name.send_keys("John")

last_name = driver.find_element(By.NAME, "last-name")
last_name.send_keys("Doe")

# Submit the form to trigger the download
submit_button = driver.find_element(By.ID, "submit-button")
submit_button.click()

# The file is now downloading after form submission
time.sleep(1)
driver.quit()
