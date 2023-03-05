import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.remote.AndroidMobileCapabilityType;
import io.appium.java_client.remote.MobileCapabilityType;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

import java.net.MalformedURLException;
import java.net.URL;

public class TouchInteractionsTest {
    private AndroidDriver driver;
    private TouchInteractions touchInteractions;

    @BeforeClass(alwaysRun = true)
    public void setUp() throws MalformedURLException {
        DesiredCapabilities capabilities = new DesiredCapabilities();
        capabilities.setCapability(MobileCapabilityType.PLATFORM_NAME, "Android");
        capabilities.setCapability(MobileCapabilityType.DEVICE_NAME, "Pixel 5 API 30");
        capabilities.setCapability(AndroidMobileCapabilityType.APP_ACTIVITY, ".MainActivity");
        capabilities.setCapability(MobileCapabilityType.APP, "\\touch_interactions.apk"); //enter your path to the application file
        capabilities.setCapability(MobileCapabilityType.AUTOMATION_NAME, "UiAutomator2");
        driver = new AndroidDriver(new URL("http://localhost:4723/wd/hub"), capabilities);
        touchInteractions = new TouchInteractions(driver);
    }

    @Test
    public void verifySingleTapInteraction() {
        Assert.assertEquals(touchInteractions.getInteractionText(), "Last Interaction");
        touchInteractions.performSingleTap();
        Assert.assertEquals(touchInteractions.getInteractionText(), "Single Tap Success!");
    }

    @Test
    public void verifyDoubleTapInteraction() {
        touchInteractions.performDoubleTap();
        Assert.assertEquals(touchInteractions.getInteractionText(), "Button double-tapped!");
    }

    @Test
    public void verifyDragAndDropInteraction() {
        touchInteractions.openDragDropScreen();
        Assert.assertEquals(touchInteractions.getMoveStatusText(), "Move the text into the white box!");
        touchInteractions.performDragAndDrop();
        Assert.assertEquals(touchInteractions.getMoveStatusText(), "Move successful!");
    }

    @Test
    public void verifyScrollInteraction() throws InterruptedException {
        touchInteractions.openScrollScreen();
        Assert.assertFalse(touchInteractions.isLastListElementDisplayed());
        touchInteractions.performScroll();
        Assert.assertTrue(touchInteractions.isLastListElementDisplayed());
    }

    @AfterClass(alwaysRun = true)
    public void tearDown() {
        driver.quit();
    }
}
