import org.openqa.selenium.By
import org.openqa.selenium.WebDriver
import org.openqa.selenium.chrome.ChromeDriver
import org.testng.Assert.assertEquals
import org.testng.Assert.assertTrue
import org.testng.annotations.AfterClass
import org.testng.annotations.BeforeClass
import org.testng.annotations.Test
import org.testng.annotations.Listeners

@Listeners(CustomTestListener::class)
class BaseTest {
    private var driver: WebDriver? = null
    private val baseUrl = "https://www.thegreenreport.blog/"
    private var logger: TestExecutionLogger? = null

    @BeforeClass
    fun setUp() {
        System.setProperty("webdriver.chrome.driver", "src/main/resources/chromedriver.exe")
        driver = ChromeDriver()
        (driver as ChromeDriver).manage().window().maximize()
        logger = TestExecutionLogger()
    }

    @Test
    fun testPageTitle() {
        driver!![baseUrl]
        val actualTitle = driver!!.title
        assertEquals(actualTitle, "The Green Report | Home", "Page title is not as expected.")
    }

    @Test
    fun testLinkClick() {
        driver!![baseUrl]
        driver!!.findElement(By.linkText("About")).click()
        val actualUrl = driver!!.currentUrl
        assertEquals(actualUrl, "https://www.thegreenreport.blog/about.html", "Link click did not navigate to the correct page.")
    }

    @Test
    fun testElementVisibility() {
        driver!![baseUrl]
        val isLogoVisible = driver!!.findElement(By.className("logo")).isDisplayed
        assertTrue(isLogoVisible, "Logo is not visible.")
    }

    @Test
    fun testElementExistence() {
        driver!![baseUrl]
        val isButtonExists = driver!!.findElements(By.id("submitButton")).size > 0
        assertTrue(isButtonExists, "Submit button does not exist.")
    }

    @AfterClass
    fun tearDown() {
        if (driver != null) {
            driver!!.quit()
        }
    }
}