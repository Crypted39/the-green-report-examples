import com.influxdb.client.InfluxDBClientFactory
import com.influxdb.client.WriteApiBlocking
import com.influxdb.client.domain.WritePrecision
import com.influxdb.client.write.Point


class TestExecutionLogger {
     private val influxDBClient = InfluxDBClientFactory.create(
        "http://localhost:8086",
        "your_api_token".toCharArray(),
        "the_green_report",
        "tgr_automation"
    )

    fun logTestResult(testName: String?, status: String?, executionTime: Long) {
        val writeApi: WriteApiBlocking = influxDBClient.writeApiBlocking
            val point = Point.measurement("test_metrics")
                .addTag("test_name", testName)
                .addTag("status", status)
                .addField("execution_time", executionTime)
                .time(System.currentTimeMillis(), WritePrecision.MS)
        writeApi.writePoint(point)
    }

    fun close() {
        influxDBClient.close()
    }
}