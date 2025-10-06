const { remote } = require("webdriverio");

async function testSecurityDashboard() {
  console.log("🧪 Testing Appium Security Dashboard Plugin\n");

  const capabilities = {
    platformName: "Android",
    "appium:deviceName": "Android Emulator",
    "appium:app":
      "https://github.com/appium/android-apidemos/releases/download/v3.1.0/ApiDemos-debug.apk",
    "appium:automationName": "UiAutomator2",

    // Security-relevant capabilities for testing
    "appium:autoGrantPermissions": true, // Will trigger security event
    "appium:allowTestPackages": true, // Will trigger security event
    "appium:disableWindowAnimation": true, // Will trigger security event
  };

  let driver;
  let sessionId;

  try {
    console.log("🚀 Creating WebDriver session...");
    driver = await remote({
      hostname: "localhost",
      port: 4723,
      capabilities,
    });

    sessionId = driver.sessionId;
    console.log(`✅ Session created: ${sessionId}`);
    console.log("📊 Check dashboard at: http://localhost:4724");

    // Wait for session to register in dashboard
    console.log(
      "\n⏳ Waiting 5 seconds for session to register in dashboard..."
    );
    await driver.pause(5000);

    console.log("\n📝 Testing security operations...");

    // Test 1: File system operations (medium risk) - Fixed version
    try {
      console.log("   🔍 Testing file operations...");
      // Use base64 encoded data (correct format)
      const base64Data = Buffer.from("Security dashboard test data").toString(
        "base64"
      );
      await driver.pushFile("/sdcard/security-test.txt", base64Data);
      console.log(
        "   ✅ File push operation - should appear as Medium Risk event"
      );
    } catch (e) {
      console.log("   ⚠️  File push failed (expected on some devices)");
    }

    // Test 2: Get device info (generates events)
    try {
      console.log("   🔍 Testing device information queries...");
      const deviceTime = await driver.executeScript("mobile: deviceInfo", []);
      console.log("   ✅ Device info query - should appear as security event");
    } catch (e) {
      console.log("   ⚠️  Device info failed, trying alternative...");

      // Try getting system time instead
      try {
        await driver.executeScript("mobile: getDeviceTime", []);
        console.log(
          "   ✅ Device time query - should appear as security event"
        );
      } catch (e2) {
        console.log("   ⚠️  Device time also failed");
      }
    }

    // Test 3: Clipboard operations (medium risk)
    try {
      console.log("   🔍 Testing clipboard operations...");
      await driver.setClipboard("Security test data from Appium", "plaintext");
      console.log("   ✅ Clipboard write - should appear as Medium Risk event");

      const clipboardData = await driver.getClipboard();
      console.log("   ✅ Clipboard read - should appear as security event");
      console.log(`   📋 Clipboard content: "${clipboardData}"`);
    } catch (e) {
      console.log("   ⚠️  Clipboard operations failed:", e.message);
    }

    // Test 4: Execute script (high risk)
    try {
      console.log("   🔍 Testing execute script (high risk)...");
      const result = await driver.executeScript("mobile: shell", [
        {
          command: "echo",
          args: ["Security dashboard test from shell"],
        },
      ]);
      console.log(
        "   ✅ Shell command executed - should appear as HIGH RISK event"
      );
      console.log(`   📟 Shell result: ${result}`);
    } catch (e) {
      console.log(
        "   ⚠️  Shell command failed (need --allow-insecure uiautomator2:adb_shell)"
      );
    }

    // Test 5: App interaction (generates various events)
    try {
      console.log("   🔍 Testing app interactions...");

      // Get page source (standard operation)
      await driver.getPageSource();
      console.log("   ✅ Page source retrieved");

      // Take screenshot
      const screenshot = await driver.takeScreenshot();
      console.log(
        "   ✅ Screenshot taken (base64 length:",
        screenshot.length,
        "chars)"
      );

      // Try to find an element and interact
      try {
        const elements = await driver.$$("android.widget.TextView");
        if (elements.length > 0) {
          console.log(`   ✅ Found ${elements.length} TextView elements`);
          // Try to click first element
          await elements[0].click();
          console.log("   ✅ Element interaction completed");
        }
      } catch (e) {
        console.log("   ⚠️  Element interaction failed (app may not be ready)");
      }
    } catch (e) {
      console.log("   ⚠️  App interactions failed:", e.message);
    }

    // Test 6: Multiple execute calls (should generate multiple events)
    console.log("   🔍 Generating multiple execute events...");
    for (let i = 0; i < 3; i++) {
      try {
        await driver.execute('return window.location || "no location"');
        console.log(`   ✅ Execute script ${i + 1} completed`);
      } catch (e) {
        // This might fail on native apps, that's okay
        console.log(
          `   ⚠️  Execute script ${i + 1} failed (expected for native apps)`
        );
      }
    }

    console.log("\n📊 Dashboard Verification:");
    console.log("=====================================");
    console.log("🌐 Open: http://localhost:4724");
    console.log("👀 You should see:");
    console.log("   ✓ Active Sessions: 1 (while test is running)");
    console.log("   ✓ Security Events: 5-15 events logged");
    console.log("   ✓ Session Details: Shows security features detected");
    console.log("   ✓ Event Timeline: Recent security events with timestamps");
    console.log("   ✓ Risk Chart: Visual distribution of risk levels");

    console.log("\n🔄 Test will keep session alive for 30 seconds...");
    console.log("   Use this time to explore the dashboard!");

    // Keep session alive to examine dashboard
    for (let i = 30; i > 0; i--) {
      if (i % 5 === 0) {
        console.log(`   ⏰ ${i} seconds remaining...`);

        // Generate a periodic event
        try {
          await driver.getCurrentActivity();
          console.log(`   📱 Current activity check (generates event)`);
        } catch (e) {
          // Ignore errors
        }
      }
      await driver.pause(1000);
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
    console.log("\n🔧 Common Solutions:");
    console.log("- Ensure Android emulator is running: adb devices");
    console.log("- Install UiAutomator2: appium driver install uiautomator2");
    console.log(
      "- For shell commands: appium --use-plugins security-dashboard --allow-insecure uiautomator2:adb_shell"
    );
    console.log("- Check if port 4723 is free: netstat -an | findstr 4723");
  } finally {
    if (driver) {
      console.log("\n🔚 Ending session...");
      await driver.deleteSession();
      console.log("✅ Session ended");
      console.log("📊 Check dashboard - session should now show as completed");
      console.log("   Events should remain visible in the timeline");
    }
  }
}

// Run the test
console.log("🎯 Starting Security Dashboard Test");
console.log("📋 Prerequisites:");
console.log("  - Android emulator running");
console.log(
  "  - Appium with security plugin: appium --use-plugins security-dashboard"
);
console.log("  - Dashboard accessible at: http://localhost:4724\n");

testSecurityDashboard().catch((error) => {
  console.error("💥 Unhandled error:", error);
  console.log("\n🚨 If you see connection errors:");
  console.log("1. Make sure Appium is running on port 4723");
  console.log("2. Make sure Android emulator/device is connected");
  console.log("3. Check dashboard is running on port 4724");
});
