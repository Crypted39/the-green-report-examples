import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.mockito.Spy;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

import java.io.IOException;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.testng.Assert.assertEquals;

public class SynchronizationTest {

    @Mock
    private ExternalService externalService;

    @Spy
    private SynchronizedMock synchronizedMock;

    @BeforeClass
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void externalServiceMockTest() throws Exception {
        ExternalService externalServiceMock = Mockito.mock(ExternalService.class);

        ExternalService.AgeData mockData = new ExternalService.AgeData();
        mockData.age = 62;
        mockData.count = 298219;
        mockData.name = "michael";
        Mockito.when(externalServiceMock.getData()).thenReturn(mockData);

        ExecutorService executorService = Executors.newSingleThreadExecutor();
        CountDownLatch latch = new CountDownLatch(1);
        executorService.execute(() -> {
            ExternalService.AgeData realData = null;
            try {
                externalService = new ExternalService();
                realData = externalService.getData();
            } catch (IOException e) {
                e.printStackTrace();
            }
            synchronizedMock.setData(realData);
            latch.countDown();
        });
        latch.await();

        ExternalService.AgeData synchronizedData = synchronizedMock.getData();
        assertEquals(mockData.getAge(), synchronizedData.getAge());
        assertEquals(mockData.getCount(), synchronizedData.getCount());
        assertEquals(mockData.getName(), synchronizedData.getName());
    }

    private static class SynchronizedMock {
        private volatile ExternalService.AgeData data;

        public void setData(ExternalService.AgeData data) {
            this.data = data;
        }

        public ExternalService.AgeData getData() {
            return data;
        }
    }
}