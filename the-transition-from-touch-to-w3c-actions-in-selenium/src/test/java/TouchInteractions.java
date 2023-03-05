import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.Point;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.interactions.Pause;
import org.openqa.selenium.interactions.PointerInput;
import org.openqa.selenium.interactions.Sequence;
import java.time.Duration;
import java.util.List;

public class TouchInteractions {

    private final AndroidDriver driver;
    private final WebElement singleTapButton;
    private final WebElement doubleTapButton;
    private final WebElement tapStatus;
    private final WebElement dragDropButton;
    private final WebElement scrollButton;

    public TouchInteractions(AndroidDriver driver) {
        this.driver = driver;
        singleTapButton = driver.findElement(By.id("com.example.touchinteractions:id/singleTap"));
        doubleTapButton = driver.findElement(By.id("com.example.touchinteractions:id/doubleTap"));
        tapStatus = driver.findElement(By.id("com.example.touchinteractions:id/textView"));
        dragDropButton = driver.findElement(By.id("com.example.touchinteractions:id/dragDropButton"));
        scrollButton = driver.findElement(By.id("com.example.touchinteractions:id/scrollButton"));
    }

    public void performSingleTap() {
        Point sourceLocation = singleTapButton.getLocation();
        Dimension sourceSize = singleTapButton.getSize();
        int centerX = sourceLocation.getX() + sourceSize.getWidth() / 2;
        int centerY = sourceLocation.getY() + sourceSize.getHeight() / 2;

        PointerInput finger = new PointerInput(PointerInput.Kind.TOUCH, "finger");
        Sequence tap = new Sequence(finger, 1);
        tap.addAction(finger.createPointerMove(Duration.ofMillis(0),
                PointerInput.Origin.viewport(), centerX, centerY));
        tap.addAction(finger.createPointerDown(PointerInput.MouseButton.LEFT.asArg()));
        tap.addAction(finger.createPointerUp(PointerInput.MouseButton.LEFT.asArg()));
        driver.perform(List.of(tap));
    }

    public void performDoubleTap() {
        Point sourceLocation = doubleTapButton.getLocation();
        Dimension sourceSize = doubleTapButton.getSize();
        int centerX = sourceLocation.getX() + sourceSize.getWidth() / 2;
        int centerY = sourceLocation.getY() + sourceSize.getHeight() / 2;

        PointerInput finger = new PointerInput(PointerInput.Kind.TOUCH, "finger");
        Sequence doubleTap = new Sequence(finger, 0);
        doubleTap.addAction(finger.createPointerMove(Duration.ofMillis(0),
                PointerInput.Origin.viewport(), centerX, centerY));
        doubleTap.addAction(finger.createPointerDown(PointerInput.MouseButton.LEFT.asArg()));
        doubleTap.addAction(new Pause(finger, Duration.ofMillis(100)));
        doubleTap.addAction(finger.createPointerUp(PointerInput.MouseButton.LEFT.asArg()));
        doubleTap.addAction(new Pause(finger, Duration.ofMillis(50)));
        doubleTap.addAction(finger.createPointerDown(PointerInput.MouseButton.LEFT.asArg()));
        doubleTap.addAction(new Pause(finger, Duration.ofMillis(100)));
        doubleTap.addAction(finger.createPointerUp(PointerInput.MouseButton.LEFT.asArg()));

        driver.perform(List.of(doubleTap));
    }

    public void performDragAndDrop() {

        WebElement source = driver.findElement(By.id("com.example.touchinteractions:id/moveText"));
        WebElement target = driver.findElement(By.id("com.example.touchinteractions:id/target"));

        Point sourceLocation = source.getLocation();
        Dimension sourceSize = source.getSize();
        int centerX = sourceLocation.getX() + sourceSize.getWidth() / 2;
        int centerY = sourceLocation.getY() + sourceSize.getHeight() / 2;

        Point targetLocation = target.getLocation();
        Dimension targetSize = target.getSize();
        int centerX2 = targetLocation.getX() + targetSize.getWidth() / 2;
        int centerY2 = targetLocation.getY() + targetSize.getHeight() / 2;

        PointerInput finger = new PointerInput(PointerInput.Kind.TOUCH, "finger");
        Sequence dragNDrop = new Sequence(finger, 1);
        dragNDrop.addAction(finger.createPointerMove(Duration.ofMillis(0),
                PointerInput.Origin.viewport(), centerX, centerY));
        dragNDrop.addAction(finger.createPointerDown(PointerInput.MouseButton.LEFT.asArg()));
        dragNDrop.addAction(finger.createPointerMove(Duration.ofMillis(700),
                PointerInput.Origin.viewport(),centerX2, centerY2));
        dragNDrop.addAction(finger.createPointerUp(PointerInput.MouseButton.LEFT.asArg()));
        driver.perform(List.of(dragNDrop));
    }

    public void performScroll() {
        var isElementDisplayed = false;
        while (!isElementDisplayed) {
            try {
                var element = driver.findElement(By.id("com.example.touchinteractions:id/textView10"));
                isElementDisplayed = element.isDisplayed();
            } catch (NoSuchElementException e) {
                System.out.println("Element is not displayed!");
            }
            if (!isElementDisplayed) {
                int startX = driver.manage().window().getSize().getWidth() / 2;
                int startY = driver.manage().window().getSize().getHeight() / 2;
                int endY = (int) (driver.manage().window().getSize().getHeight() * 0.2);
                PointerInput finger = new PointerInput(PointerInput.Kind.TOUCH, "finger");
                Sequence scroll = new Sequence(finger, 0);
                scroll.addAction(finger.createPointerMove(Duration.ZERO, PointerInput.Origin.viewport(), startX, startY));
                scroll.addAction(finger.createPointerDown(PointerInput.MouseButton.LEFT.asArg()));
                scroll.addAction(finger.createPointerMove(Duration.ofMillis(600), PointerInput.Origin.viewport(), startX, endY));
                scroll.addAction(finger.createPointerUp(PointerInput.MouseButton.LEFT.asArg()));
                driver.perform(List.of(scroll));
            }
        }
    }

    public String getInteractionText() {
        return tapStatus.getText();
    }

    public void openDragDropScreen() {
        Actions actions = new Actions(driver);
        actions.click(dragDropButton).perform();
    }

    public String getMoveStatusText() {
        WebElement moveStatus = driver.findElement(By.id("com.example.touchinteractions:id/statusText"));
        return moveStatus.getText();
    }

    public void openScrollScreen() {
        Actions actions = new Actions(driver);
        actions.click(scrollButton).perform();
    }

    public boolean isLastListElementDisplayed() throws InterruptedException {
        Thread.sleep(3000);
        try {
            return driver.findElement(By.id("com.example.touchinteractions:id/textView10")).isDisplayed();
        } catch (NoSuchElementException e) {
            return false;
        }
    }
}