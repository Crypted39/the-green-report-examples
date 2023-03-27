import org.springframework.web.client.RestTemplate;

public class UserService {

    private RestTemplate restTemplate;

    public UserService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public User getUser(String userId) {
        String url = "https://api.example.com/users/" + userId;
        User user = restTemplate.getForObject(url, User.class);
        return user;
    }
}