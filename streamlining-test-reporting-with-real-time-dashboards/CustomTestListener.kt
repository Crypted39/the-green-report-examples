import org.testng.ITestContext
import org.testng.ITestListener
import org.testng.ITestResult

class CustomTestListener : ITestListener {
    private var logger: TestExecutionLogger? = null

    override fun onStart(context: ITestContext) {
        logger = TestExecutionLogger()
    }

    override fun onTestSuccess(result: ITestResult) {
        logTestResult(result)
    }

    override fun onTestFailure(result: ITestResult) {
        logTestResult(result)
    }

    override fun onFinish(context: ITestContext) {
        if (logger != null) {
            logger!!.close()
        }
    }

    private fun logTestResult(result: ITestResult) {
        val testName = result.name
        val status = if (result.isSuccess) "passed" else "failed"
        val executionTime = result.endMillis - result.startMillis
        logger!!.logTestResult(testName, status, executionTime)
    }
}