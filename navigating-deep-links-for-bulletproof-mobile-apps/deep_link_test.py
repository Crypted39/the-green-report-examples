import unittest
from appium import webdriver
from appium.webdriver.common.appiumby import AppiumBy
from appium.options.android import UiAutomator2Options
from selenium.common import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as ec

capabilities = dict(
    platformName='Android',
    automationName='uiautomator2',
    deviceName='Samsung_Galaxy_S21_API_31 [emulator-5554]',
    appPackage='com.example.deep_link_app',
    appActivity='com.example.deep_link_app.MainActivity',
    language='en',
    locale='US'
)

appium_server_url = 'http://localhost:4723'
deep_link_url = "deep-link-app://deeplink"


class TestDeepLink(unittest.TestCase):
    def setUp(self) -> None:
        self.driver = webdriver.Remote(appium_server_url, options=UiAutomator2Options().load_capabilities(capabilities))

    def tearDown(self) -> None:
        if self.driver:
            self.driver.quit()

    def test_deep_link(self) -> None:
        self.driver.get(deep_link_url)
        try:
            element = WebDriverWait(self.driver, 10).until(
                ec.presence_of_element_located((AppiumBy.ID, "deepLinkText"))
            )
            self.assertTrue(element.is_displayed(), "Element with ID 'deepLinkText' is not displayed!")
        except TimeoutException:
            print("Error: Element not found after waiting for 10 seconds!")


if __name__ == '__main__':
    unittest.main()
