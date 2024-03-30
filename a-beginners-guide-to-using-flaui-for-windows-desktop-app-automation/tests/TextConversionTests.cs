using Microsoft.VisualStudio.TestTools.UnitTesting;
using FlaUI.UIA3;
using FlaUI.Core.Conditions;
using FlaUI.Core.AutomationElements;
using FlaUI.Core;

namespace TextConversionTests {
    [TestClass]
    public class TextConversionTests {

        private Application application;
        private Window mainWindow;
        private ConditionFactory cf;

        [TestInitialize]
        public void Setup() {
            application = Application.Launch(@"C:\Users\IRFAN\Documents\Test Projects\tests\FlaUiTest\resources\textToLowerCase.exe");
            mainWindow = application.GetMainWindow(new UIA3Automation());
            cf = new ConditionFactory(new UIA3PropertyLibrary());
        }

        [TestMethod]
        public void VerifyApplicationLabel() {
            Label descriptionLabel = mainWindow.FindFirstDescendant(
                cf.ByAutomationId("descriptionLabel")
                ).AsLabel();
            Assert.AreEqual("Enter some text for the conversion", descriptionLabel.Text);
        }

        [TestMethod]
        public void VerifyApplicationConversionFunctionality() {
            string conversionText = "TEst mE out!";
            mainWindow.FindFirstDescendant(cf.ByAutomationId("inputField"))
                .AsTextBox()
                .Enter(conversionText);
            mainWindow.FindFirstDescendant(cf.ByAutomationId("convertButton"))
                .AsButton()
                .Click();
            Label outputLabel = mainWindow.FindFirstDescendant(cf.ByAutomationId("outputLabel"))
                .AsLabel();
            Assert.AreEqual(conversionText.ToLower(), outputLabel.Text);
        }

        [TestCleanup]
        public void Cleanup() {
            application.Close();
        }
    }
}