import io.appium.java_client.android.AndroidDriver
import io.appium.java_client.android.options.UiAutomator2Options
import org.openqa.selenium.By
import org.openqa.selenium.support.ui.ExpectedConditions
import org.openqa.selenium.support.ui.WebDriverWait
import org.testng.Assert
import org.testng.annotations.AfterMethod
import org.testng.annotations.BeforeMethod
import org.testng.annotations.Test
import java.net.URL
import java.time.Duration

/**
 * Appium test for verifying push notification functionality
 *
 * Prerequisites:
 * 1. Appium server running: appium
 * 2. Android emulator or real device connected: adb devices
 * 3. App APK available
 */
class NotificationTest {

    private lateinit var driver: AndroidDriver
    private lateinit var wait: WebDriverWait

    @BeforeMethod
    fun setUp() {
        val options = UiAutomator2Options()
            .setDeviceName("emulator-5554")
            .setPlatformName("Android")
            .setAutomationName("UiAutomator2")
            .setApp("path-to-the-apk-file") // update with your apk file path
            .setAppPackage("com.tgr.pushnotificationsdemo")
            .setAppActivity(".MainActivity")
            .setAutoGrantPermissions(true)
            .setNoReset(false)  // Fresh install each time
            .setFullReset(false)  // Don't uninstall, just clear data

        driver = AndroidDriver(URL("http://127.0.0.1:4723"), options)
        wait = WebDriverWait(driver, Duration.ofSeconds(15))

        Thread.sleep(3000)  // Give app time to fully load
    }

    @Test
    fun testPushNotificationFlow() {
        val statusIndicator = wait.until(
            ExpectedConditions.presenceOfElementLocated(
                By.id("com.tgr.pushnotificationsdemo:id/statusIndicator")
            )
        )

        val initialStatus = statusIndicator.text

        Assert.assertTrue(
            initialStatus.contains("Waiting"),
            "Initial status should show 'Waiting for notification' but was: $initialStatus"
        )

        val sendButton = driver.findElement(
            By.id("com.tgr.pushnotificationsdemo:id/sendNotificationButton")
        )
        sendButton.click()

        Thread.sleep(1000)
        wait.until(
            ExpectedConditions.textToBePresentInElement(
                statusIndicator, "sent"
            )
        )

        driver.openNotifications()
        Thread.sleep(2000)

        val notification = wait.until(
            ExpectedConditions.presenceOfElementLocated(
                By.xpath("//*[contains(@text, 'Test Notification')]")
            )
        )

        Assert.assertTrue(
            notification.isDisplayed,
            "Notification should be visible in notification drawer"
        )

        notification.click()
        Thread.sleep(2000)

        val successIndicator = wait.until(
            ExpectedConditions.visibilityOfElementLocated(
                By.id("com.tgr.pushnotificationsdemo:id/notificationClickedIndicator")
            )
        )

        Assert.assertTrue(
            successIndicator.isDisplayed,
            "Success indicator should be visible"
        )

        val successText = successIndicator.text

        Assert.assertTrue(
            successText.contains("Notification Opened Successfully"),
            "Success message should display correctly"
        )

        // Re-find the element since the page refreshed
        val updatedStatusIndicator = driver.findElement(
            By.id("com.tgr.pushnotificationsdemo:id/statusIndicator")
        )
        val finalStatus = updatedStatusIndicator.text

        Assert.assertTrue(
            finalStatus.contains("clicked"),
            "Status should indicate notification was clicked"
        )
    }

    @Test
    fun testMultipleNotifications() {
        Thread.sleep(2000)

        val sendButton = driver.findElement(
            By.id("com.tgr.pushnotificationsdemo:id/sendNotificationButton")
        )
        sendButton.click()
        Thread.sleep(1500)

        // Send second notification
        sendButton.click()
        Thread.sleep(1000)

        driver.openNotifications()
        Thread.sleep(2000)

        val notification = wait.until(
            ExpectedConditions.presenceOfElementLocated(
                By.xpath("//*[contains(@text, 'Test Notification')]")
            )
        )

        Assert.assertTrue(
            notification.isDisplayed,
            "Notification should be displayed after multiple sends"
        )

        notification.click()
        Thread.sleep(2000)

        val successIndicator = wait.until(
            ExpectedConditions.visibilityOfElementLocated(
                By.id("com.tgr.pushnotificationsdemo:id/notificationClickedIndicator")
            )
        )

        Assert.assertTrue(successIndicator.isDisplayed)
    }

    @AfterMethod
    fun tearDown() {
        if (::driver.isInitialized) {
            driver.quit()
        }
    }
}