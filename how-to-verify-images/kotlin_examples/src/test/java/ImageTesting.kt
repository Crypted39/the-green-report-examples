import org.testng.Assert.assertEquals
import org.testng.annotations.Test
import java.nio.file.Files
import java.nio.file.Path


class ImageTesting {

    @Test
    fun testImageByDataValuePositive() {
        val actualImage = Files.readAllBytes(Path.of("images/original.png")).toList()
        val expectedImage = Files.readAllBytes(Path.of("images/original_copy.png")).toList()
        assertEquals(actualImage, expectedImage)
    }

    @Test
    fun testImageByDataValueNegative() {
        val actualImage = Files.readAllBytes(Path.of("images/original.png")).toList()
        val expectedImage = Files.readAllBytes(Path.of("images/edit.png")).toList()
        assertEquals(
            actualImage,
            expectedImage,
            "The actual and the provided image are not identical"
        )
    }
}