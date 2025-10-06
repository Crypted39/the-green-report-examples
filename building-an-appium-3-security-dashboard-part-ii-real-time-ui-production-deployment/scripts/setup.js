#!/usr/bin/env node

const path = require("path");
const { exec } = require("child_process");

console.log("🔧 Setting up Appium Security Dashboard Plugin...\n");

console.log("📋 Setup Instructions:");
console.log("======================\n");

console.log("1. Install the plugin in your Appium environment:");
console.log("   npm install -g .");
console.log("   # OR for local development:");
console.log("   appium plugin install --source=local .\n");

console.log("2. Start Appium with the security dashboard plugin:");
console.log(
  "   appium --use-plugins security-dashboard --plugin-security-dashboard-port 4724\n"
);

console.log("3. Open the security dashboard in your browser:");
console.log("   http://localhost:4724\n");

console.log("4. Run your Appium tests as normal. The dashboard will show:");
console.log("   • Real-time security events");
console.log("   • Active session monitoring");
console.log("   • Risk assessments");
console.log("   • Security recommendations\n");

console.log("🔒 Security Features Monitored:");
console.log("===============================");
console.log("• Shell command execution (mobile: shell)");
console.log("• File system access (pushFile, pullFile)");
console.log("• App installation/removal");
console.log("• Clipboard access");
console.log("• Permission changes");
console.log("• Custom execute scripts");
console.log("• High-risk capabilities\n");

console.log("🎯 Example Test Command:");
console.log("========================");
console.log("# Start Appium with security monitoring");
console.log(
  "appium --use-plugins security-dashboard --allow-insecure uiautomator2:adb_shell\n"
);

console.log("✅ Plugin setup complete!");
console.log("📖 For more information, check the README.md file.");
