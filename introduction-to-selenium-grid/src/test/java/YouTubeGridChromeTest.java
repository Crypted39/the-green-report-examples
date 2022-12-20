import org.openqa.selenium.By;
import org.openqa.selenium.remote.CapabilityType;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.testng.annotations.Test;

import java.net.MalformedURLException;
import java.net.URL;

import static org.testng.Assert.assertTrue;

public class YouTubeGridChromeTest {

    @Test
    public void verifyYouTubeLandingPage() throws MalformedURLException {
        DesiredCapabilities capabilities = new DesiredCapabilities();
        capabilities.setCapability(CapabilityType.BROWSER_NAME, "chrome");
        RemoteWebDriver driver = new RemoteWebDriver(new URL("http://<hub-ip-address-and-port>"), capabilities);

        driver.get("https://youtube.com");
        assertTrue(driver.findElement(By.id("logo")).isDisplayed());
        driver.close();
    }
}
