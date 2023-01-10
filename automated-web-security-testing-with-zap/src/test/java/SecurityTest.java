import org.openqa.selenium.By;
import org.openqa.selenium.Proxy;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import static org.testng.Assert.assertTrue;

public class SecurityTest {

    private WebDriver driver;
    private static final String TARGET_URL = "https://juice-shop.herokuapp.com/#/";
    private static final String EMAIL = "test@fakemail.com";
    private static final String PASSWORD = "Juice123!";

    @BeforeMethod
    public void setup(){
        String proxyServerUrl = SecurityScanner.ZAP_ADDRESS + ":" + SecurityScanner.ZAP_PORT;
        Proxy proxy = new Proxy();
        proxy.setHttpProxy(proxyServerUrl);
        proxy.setSslProxy(proxyServerUrl);

        ChromeOptions chromeOptions = new ChromeOptions();
        chromeOptions.addArguments("--start-maximized");
        chromeOptions.addArguments("--ignore-ssl-errors=yes");
        chromeOptions.addArguments("--ignore-certificate-errors");
        chromeOptions.setProxy(proxy);
        driver = new ChromeDriver(chromeOptions);
    }

    @Test
    public void juiceShopSecurityAssessment() throws InterruptedException {
        driver.get(TARGET_URL);
        SecurityScanner.executeSpiderScan(TARGET_URL);
        SecurityScanner.executeActiveScan(TARGET_URL, "beforeLoginReport");
        Thread.sleep(2000);
        driver.findElement(By.className("close-dialog")).click();
        Thread.sleep(2000);
        driver.findElement(By.id("navbarAccount")).click();
        Thread.sleep(2000);
        driver.findElement(By.id("navbarLoginButton")).click();
        driver.findElement(By.id("newCustomerLink")).click();
        driver.findElement(By.id("emailControl")).sendKeys(EMAIL);
        driver.findElement(By.id("passwordControl")).sendKeys(PASSWORD);
        driver.findElement(By.id("repeatPasswordControl")).sendKeys(PASSWORD);
        Thread.sleep(2000);
        driver.findElement(By.id("mat-select-value-3")).click();
        Thread.sleep(2000);
        driver.findElement(By.id("mat-option-3")).click();
        driver.findElement(By.id("securityAnswerControl")).sendKeys("something");
        driver.findElement(By.id("registerButton")).click();
        Thread.sleep(2000);
        assertTrue(driver.findElement(By.xpath("//h1[text()='Login']")).isDisplayed());
        driver.findElement(By.id("email")).sendKeys(EMAIL);
        driver.findElement(By.id("password")).sendKeys(PASSWORD);
        driver.findElement(By.id("loginButton")).click();
        Thread.sleep(2000);
        if(driver.findElement(By.xpath("//button[@aria-label='Show the shopping cart']")).isDisplayed()) {
            SecurityScanner.executeActiveScan(TARGET_URL, "afterLoginReport");
        }
    }

    @AfterMethod
    public void tearDown() {
        driver.quit();
    }
}
