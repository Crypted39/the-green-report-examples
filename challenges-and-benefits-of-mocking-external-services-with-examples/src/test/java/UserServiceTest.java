import org.mockito.Mockito;
import org.springframework.web.client.RestTemplate;
import org.testng.annotations.Test;

import static org.testng.Assert.assertEquals;


public class UserServiceTest {

    @Test
    public void getUserTest() {
        RestTemplate restTemplate = Mockito.mock(RestTemplate.class);

        User expectedUser = new User("123", "John Doe");
        Mockito.when(restTemplate.getForObject("https://api.example.com/users/123", User.class))
                .thenReturn(expectedUser);

        UserService userService = new UserService(restTemplate);
        User actualUser = userService.getUser("123");

        assertEquals(actualUser, expectedUser);
    }
}
