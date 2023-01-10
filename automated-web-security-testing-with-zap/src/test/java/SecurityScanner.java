import org.zaproxy.clientapi.core.ApiResponse;
import org.zaproxy.clientapi.core.ApiResponseElement;
import org.zaproxy.clientapi.core.ApiResponseList;
import org.zaproxy.clientapi.core.ClientApi;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.List;

public class SecurityScanner {

    static final String ZAP_ADDRESS = "localhost";
    static final int ZAP_PORT = 8090;
    private static final String ZAP_API_KEY = ""; //insert your API key
    static ClientApi api = new ClientApi(ZAP_ADDRESS, ZAP_PORT, ZAP_API_KEY);

    public static void executeSpiderScan(String targetUrl) {
        System.out.println("Spidering target : " + targetUrl);
        String scanId;

        try {
            int progress;
            ApiResponse response = api.spider.scan(targetUrl, null, null, null, null);
            scanId = ((ApiResponseElement) response).getValue();
            do {
                Thread.sleep(1000);
                progress = Integer.parseInt(((ApiResponseElement) api.spider.status(scanId)).getValue());
                System.out.println("Spider progress : " + progress + "%");
            } while (progress < 100);
            System.out.println("Spider completed!");
            List<ApiResponse> spiderResults = ((ApiResponseList) api.spider.results(scanId)).getItems();
            System.out.println("Following resources have been found:");
            spiderResults.forEach(System.out::println);
        } catch (Exception e) {
            System.out.println("Exception caught: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public static void executeActiveScan(String targetUrl, String reportName) {
        System.out.println("Active scanning target : " + targetUrl);
        String scanId;
        try {
            int progress;
            ApiResponse resp = api.ascan.scan(targetUrl, "True", "False", null, null, null);
            scanId = ((ApiResponseElement) resp).getValue();
            do {
                Thread.sleep(5000);
                progress = Integer.parseInt(((ApiResponseElement) api.ascan.status(scanId)).getValue());
                System.out.println("Active scan progress : " + progress + "%");
            } while (progress < 100);
            System.out.println("Active scan completed!");

            URL url = new URL("http://" + ZAP_ADDRESS + ":" + ZAP_PORT + "/OTHER/core/other/htmlreport/?apikey=" + ZAP_API_KEY);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            int responseCode = connection.getResponseCode();
            if(responseCode == 200) {
                BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                BufferedWriter out = new BufferedWriter(new FileWriter("src/reports/" + reportName + ".html"));
                String line;
                while ((line = in.readLine()) != null) {
                    out.write(line);
                    out.newLine();
                }
                in.close();
                out.close();
            } else {
                throw new MalformedURLException("Url could not be accessed! Response code was " + responseCode);
            }
        } catch (Exception e) {
            System.out.println("Exception caught: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
