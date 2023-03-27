import org.mockito.Mockito;
import org.testng.annotations.Test;

import java.util.HashMap;
import java.util.Map;

import static org.testng.Assert.assertEquals;

public class ComplexDataStructureTest {


    @Test
    public void externalServiceMockTest() {
        ExternalService mockService = Mockito.mock(ExternalService.class);

        Map<String, ExternalService.Location> expectedData = new HashMap<>();
        expectedData.put("address", new ExternalService.Location(
                "France",
                "Paris",
                new ExternalService.Population(2161000, 12.6, 6.4)
                )
        );

        Mockito.when(mockService.getComplexDataStructure()).thenReturn(expectedData);

        MainService mainService = new MainService(mockService);
        String actualData = mainService.complexDataStructureUse();

        assertEquals(actualData, "Complex data returned Paris");
    }

    @Test
    public void externalServiceTest() {
        ExternalService externalService = new ExternalService();
        MainService mainService = new MainService(externalService);
        assertEquals(mainService.complexDataStructureUse(), "Complex data returned Paris");
    }
}
