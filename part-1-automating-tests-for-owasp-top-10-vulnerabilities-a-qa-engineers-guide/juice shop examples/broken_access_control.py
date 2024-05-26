import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

base_url = ''  # enter your base url for Juice Shop
regular_user_email = ''  # enter a regular user email
regular_user_password = ''  # enter a regular user password
admin_user_email = ''  # enter an admin user email
admin_user_password = ''  # enter an admin user password


def initialize_driver():
    driver = webdriver.Chrome()
    driver.maximize_window()
    return driver


def login(driver, email, password, first_login):
    driver.get(base_url + '/login')
    if first_login:
        WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, '.close-dialog'))).click()
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, 'email'))).send_keys(email)
    driver.find_element(By.ID, 'password').send_keys(password + Keys.RETURN)
    time.sleep(2)


def logout(driver):
    WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.ID, 'navbarAccount'))).click()
    WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.ID, 'navbarLogoutButton'))).click()


def assert_admin_page_access(driver, should_have_access):
    driver.get(base_url + '/administration')
    if should_have_access:
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(text(),'Administration')]")))
        assert "Administration" in driver.page_source, "Administration panel should be available to Admin users."
    else:
        WebDriverWait(driver, 10).until(EC.presence_of_element_located(
            (By.XPATH, "//*[contains(text(),'You are not allowed to access this page!')]")))
        assert "You are not allowed to access this page!" in driver.page_source, "Regular user should not have access to admin page"


def main():
    driver = initialize_driver()
    try:
        # Admin user login
        login(driver, admin_user_email, admin_user_password, True)
        # Access restricted admin page
        assert_admin_page_access(driver, True)
        # Logout
        logout(driver)

        # Regular user login
        login(driver, regular_user_email, regular_user_password, False)
        # Try accessing the restricted admin page
        assert_admin_page_access(driver, False)

    finally:
        driver.quit()


if __name__ == "__main__":
    main()
