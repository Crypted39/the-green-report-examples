import java.util.Map;

public class MainService {
    private ExternalService externalService;

    public MainService(ExternalService externalService) {
        this.externalService = externalService;
    }

    public String doSomething() {
        String externalResult = externalService.performComplexBusinessLogic();
        return externalResult + " with main service data";
    }

    public String complexDataStructureUse() {
        Map<String, ExternalService.Location> externalResult = externalService.getComplexDataStructure();
        ExternalService.Location address = externalResult.get("address");
        String city = address.getCity();
        return "Complex data returned " + city;
    }
}