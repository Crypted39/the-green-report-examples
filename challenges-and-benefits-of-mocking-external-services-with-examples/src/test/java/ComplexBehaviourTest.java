import org.mockito.Mockito;
import org.testng.annotations.Test;

import static org.testng.Assert.assertEquals;

public class ComplexBehaviourTest {

    @Test
    public void complexBehaviourTest() {
        ExternalService externalService = new ExternalService();
        MainService mainService = new MainService(externalService);
        assertEquals(mainService.doSomething(), "some complex logic with main service data");
    }

    @Test
    public void complexBehaviourMockTest() {
        ExternalService externalServiceMock = Mockito.mock(ExternalService.class);
        Mockito.when(externalServiceMock.performComplexBusinessLogic())
                .thenReturn("some complex logic");
        MainService mainService = new MainService(externalServiceMock);
        String result = mainService.doSomething();
        assertEquals(result, "some complex logic with main service data");
    }
}
