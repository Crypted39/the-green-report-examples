from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

# Initialize the Chrome driver
driver = webdriver.Chrome()

try:
    # Admin user login
    driver.get('http://example.com/login')
    driver.find_element(By.ID, 'username').send_keys('admin')
    driver.find_element(By.ID, 'password').send_keys('adminpass' + Keys.RETURN)

    # Access restricted admin page
    driver.get('http://example.com/admin')
    assert "Admin Page" in driver.page_source, "Admin should have access to admin page"

    # Logout
    driver.get('http://example.com/logout')

    # Regular user login
    driver.get('http://example.com/login')
    driver.find_element(By.ID, 'username').send_keys('user')
    driver.find_element(By.ID, 'password').send_keys('userpass' + Keys.RETURN)

    # Try accessing the restricted admin page
    driver.get('http://example.com/admin')
    assert "Access Denied" in driver.page_source, "Regular user should not have access to admin page"

finally:
    driver.quit()
