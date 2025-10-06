# Appium Security Dashboard Plugin

A comprehensive security monitoring plugin for Appium 3 that provides real-time visibility into security events, risk assessment, and compliance reporting.

## Installation

### Prerequisites
- Node.js 20.19+ (required for Appium 3)
- Appium 3.0+

### 1. Install Dependencies
```bash
npm install
```

### 2. Install the Plugin
```bash
appium plugin install --source=local .
```

### 3. Install UiAutomator2 Driver (if not already installed)
```bash
appium driver install uiautomator2
```

### 4. Start an Android Emulator
```bash
# Verify emulator is running
adb devices
```

### 5. Start Appium with the Plugin
```bash
appium --use-plugins security-dashboard --allow-insecure uiautomator2:adb_shell
```

### 6. Open the Dashboard
Open your browser and navigate to:
```bash
http://localhost:4724
```

### 7. Run the Test Script (in a new terminal)
```bash
node test-security-plugin.js
```