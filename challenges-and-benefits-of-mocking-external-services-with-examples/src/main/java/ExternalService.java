import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class ExternalService {

    private static final String API_URL = "https://api.agify.io?name=michael";

    public AgeData getData() throws IOException {
        OkHttpClient client = new OkHttpClient();
        AgeData ageData = null;

        Request request = new Request.Builder()
                .url(API_URL)
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Unexpected response code: " + response);
            }
            ObjectMapper objectMapper = new ObjectMapper();
            ageData = objectMapper.readValue(response.body().string(), AgeData.class);
        } catch (IOException e) {
            e.printStackTrace();
        }
        return ageData;
    }

    public String performComplexBusinessLogic() {
        return "some complex logic";
    }

    public Map<String, Location> getComplexDataStructure() {
        Map<String, Location> map = new HashMap<>();
        Location location = new Location("France", "Paris", new Population(2161000, 12.6, 6.4));
        map.put("address", location);
        return map;
    }

    public static class Location {
        private String country;
        private String city;
        private Population population;

        public Location(String country, String city, Population population) {
            this.country = country;
            this.city = city;
            this.population = population;
        }

        public String getCity() {
            return city;
        }
    }

    public static class Population {
        private long size;
        private double birthRate;
        private double deathRate;

        public Population(long size, double birthRate, double deathRate) {
            this.size = size;
            this.birthRate = birthRate;
            this.deathRate = deathRate;
        }
    }

    public static class AgeData {
        @JsonProperty("age")
        int age;

        @JsonProperty("count")
        long count;

        @JsonProperty("name")
        String name;

        public int getAge() {
            return age;
        }

        public String getName() {
            return name;
        }

        public long getCount() {
            return count;
        }
    }
}
