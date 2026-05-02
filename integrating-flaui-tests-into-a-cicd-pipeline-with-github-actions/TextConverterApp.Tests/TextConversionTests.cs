using Microsoft.VisualStudio.TestTools.UnitTesting;
using FlaUI.UIA3;
using FlaUI.Core.Conditions;
using FlaUI.Core.AutomationElements;
using FlaUI.Core;
using System;
using System.IO;

namespace TextConverterApp.Tests
{
    [TestClass]
    public class TextConversionTests
    {
        private Application? application;
        private Window? mainWindow;
        private ConditionFactory? cf;

        public TestContext? TestContext { get; set; }

        [TestInitialize]
        public void Setup()
        {
            string appExe = Environment.GetEnvironmentVariable("APP_PATH")
                ?? "TextConverterApp.exe";

            string appPath = Path.IsPathRooted(appExe)
                ? appExe
                : Path.Combine(AppDomain.CurrentDomain.BaseDirectory, appExe);

            application = Application.Launch(appPath);
            mainWindow = application.GetMainWindow(new UIA3Automation());
            cf = new ConditionFactory(new UIA3PropertyLibrary());
        }

        [TestMethod]
        public void VerifyApplicationLabel()
        {
            Label descriptionLabel = mainWindow!
                .FindFirstDescendant(cf!.ByAutomationId("descriptionLabel"))
                .AsLabel();

            Assert.AreEqual("Enter some text for the conversion", descriptionLabel.Text);
        }

        [TestMethod]
        public void VerifyApplicationConversionFunctionality()
        {
            string conversionText = "TEst mE out!";

            mainWindow!.FindFirstDescendant(cf!.ByAutomationId("inputField"))
                .AsTextBox()
                .Enter(conversionText);

            mainWindow.FindFirstDescendant(cf.ByAutomationId("convertButton"))
                .AsButton()
                .Click();

            Label outputLabel = mainWindow
                .FindFirstDescendant(cf.ByAutomationId("outputLabel"))
                .AsLabel();

            Assert.AreEqual(conversionText.ToLower(), outputLabel.Text);
        }

        [TestCleanup]
        public void Cleanup()
        {
            if (TestContext?.CurrentTestOutcome != UnitTestOutcome.Passed)
            {
                try
                {
                    string screenshotDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "TestResults");
                    Directory.CreateDirectory(screenshotDir);
                    string screenshotPath = Path.Combine(screenshotDir, $"{TestContext?.TestName}_failure.png");
                    FlaUI.Core.Capturing.Capture.Screen().ToFile(screenshotPath);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to capture screenshot: {ex.Message}");
                }
            }

            application?.Close();
        }
    }
}