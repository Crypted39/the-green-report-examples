from selenium import webdriver
from selenium.webdriver.common.by import By

# Set up the Selenium WebDriver
driver = webdriver.Chrome()

# Open the login page
driver.get('https://example.com/login')

# Input valid credentials and click the login button
driver.find_element(By.ID, 'username').send_keys('test_user')
driver.find_element(By.ID, 'password').send_keys('test_password')
driver.find_element(By.ID, 'loginButton').click()

# Verify successful login
if 'Welcome' in driver.page_source:
    print("Authentication Test Passed")
else:
    print("Authentication Test Failed")

# Close the browser
driver.quit()
