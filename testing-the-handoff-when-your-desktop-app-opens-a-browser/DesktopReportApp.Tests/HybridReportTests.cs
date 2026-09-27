using FlaUI.Core;
using FlaUI.Core.AutomationElements;
using FlaUI.Core.Tools;
using FlaUI.UIA3;
using Microsoft.Playwright;

namespace DesktopReportApp.Tests;

public class HybridReportTests
{
    [Fact]
    public async Task ClickingViewReport_OpensReportInBrowser()
    {
        var appExePath = GetAppExecutablePath();

        // Desktop automation layer: launch the app and click the real button.
        using var app = Application.Launch(appExePath);
        using var automation = new UIA3Automation();
        app.WaitWhileMainHandleIsMissing(TimeSpan.FromSeconds(5));
        var mainWindow = app.GetMainWindow(automation)!;

        var viewReportButton = mainWindow.FindFirstDescendant(
            cf => cf.ByAutomationId("ViewReportButton"))!.AsButton();
        var statusText = mainWindow.FindFirstDescendant(
            cf => cf.ByAutomationId("StatusText"))!.AsLabel();

        viewReportButton.Click();

        Retry.WhileEmpty(() => statusText.Text, TimeSpan.FromSeconds(5));
        Assert.Equal("Report opened in browser", statusText.Text);

        // Web automation layer: verify the page the click was supposed to open.
        var reportPath = Path.Combine(Path.GetDirectoryName(appExePath) ?? ".", "report.html");
        var reportUrl = new Uri(reportPath).AbsoluteUri;

        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync();
        var page = await browser.NewPageAsync();
        await page.GotoAsync(reportUrl);

        await Assertions.Expect(page.GetByText("Report successfully generated")).ToBeVisibleAsync();

        app.Close();
    }

    private static string GetAppExecutablePath()
    {
        var appAssembly = typeof(MainWindow).Assembly;
        return Path.ChangeExtension(appAssembly.Location, ".exe");
    }
}
