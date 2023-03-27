import javax.naming.AuthenticationException;

public interface AuthenticationService {
    /**
     * Authenticates a user and returns an authentication token.
     *
     * @param username the username of the user to authenticate
     * @param password the password of the user to authenticate
     * @return an authentication token for the authenticated user
     * @throws AuthenticationException if the user cannot be authenticated
     */
    String authenticate(String username, String password) throws AuthenticationException;
}
