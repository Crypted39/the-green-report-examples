import javax.naming.AuthenticationException;

public class AuthExternalService {

    private AuthenticationService authenticationService;

    public AuthExternalService(AuthenticationService authService) {
        this.authenticationService = authService;
    }

    public String callExternalService(String authToken) throws ExternalServiceException, AuthenticationException {
        // Check if authToken is valid
        if (authToken == null || authToken.isEmpty()) {
            throw new ExternalServiceException("Invalid authentication token");
        }
        // Call the authentication service to authenticate the user
        authenticationService.authenticate("username", "password");
        // Call the external service with the authToken
        // Return the response from the external service
        return "Response from external service";
    }
}
