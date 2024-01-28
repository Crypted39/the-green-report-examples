from selenium import webdriver

# Set up the Selenium WebDriver
driver = webdriver.Chrome()

# Open the dashboard (replace 'admin_dashboard_url' with the actual URL)
driver.get('admin_dashboard_url')

# Check if the user is redirected to the login page (unauthorized access)
if 'Login' in driver.page_source:
    print("Authorization Test Failed: User not authenticated")
    driver.quit()
else:
    # Assume the user is already authenticated, proceed with checking the role
    if 'Admin Dashboard' in driver.page_source:
        print("Authorization Test Passed: User has access to Admin Dashboard")
    else:
        print("Authorization Test Failed: User does not have access to Admin Dashboard")

# Close the browser
driver.quit()
