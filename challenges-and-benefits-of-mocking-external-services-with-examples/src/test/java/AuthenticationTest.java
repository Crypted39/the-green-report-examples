import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

import javax.naming.AuthenticationException;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertThrows;

public class AuthenticationTest {

    @Mock
    private AuthenticationService authService;

    @BeforeClass
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void authenticationServiceTest() throws AuthenticationException, ExternalServiceException {
        // Create mock authentication token
        String authToken = "abc123";

        // Mock authentication service to return mock token
        when(authService.authenticate(eq("username"), eq("password"))).thenReturn(authToken);

        // Create external service client with mock authentication service
        AuthExternalService client = new AuthExternalService(authService);

        // Call the external service with mock token
        String response = client.callExternalService(authToken);

        // Verify that the authentication service was called with correct parameters
        verify(authService).authenticate(eq("username"), eq("password"));

        // Verify that the external service was called with the mock token
        assertEquals(response, "Response from external service");

        // Verify that an exception is thrown when authToken is null
        assertThrows(ExternalServiceException.class, () -> {
            client.callExternalService(null);
        });
    }
}