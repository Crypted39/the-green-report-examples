const { BasePlugin } = require("appium/plugin");
const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const path = require("path");
const cors = require("cors");

class SecurityDashboardPlugin extends BasePlugin {
  constructor(pluginName, cliArgs = {}) {
    super(pluginName, cliArgs);

    console.log("🔧 SecurityDashboardPlugin constructor called");
    console.log("📝 CLI Args received:", cliArgs);

    // Use shared state across all instances
    if (!SecurityDashboardPlugin.sharedState) {
      SecurityDashboardPlugin.sharedState = {
        securityFeatures: new Map(),
        sessions: new Map(),
        securityEvents: [],
      };
    }

    this.securityFeatures =
      SecurityDashboardPlugin.sharedState.securityFeatures;
    this.sessions = SecurityDashboardPlugin.sharedState.sessions;
    this.securityEvents = SecurityDashboardPlugin.sharedState.securityEvents;
    this.dashboardPort = cliArgs.securityDashboardPort || 4724;

    console.log(`📊 Dashboard will start on port: ${this.dashboardPort}`);

    // Initialize dashboard server
    try {
      this.initializeDashboard();
      console.log("✅ Dashboard initialization completed");
    } catch (error) {
      console.error("❌ Dashboard initialization failed:", error);
    }

    this.log.info("Security Dashboard Plugin initialized");
  }

  static async updateServer(expressApp, httpServer, cliArgs) {
    console.log("🚀 SecurityDashboardPlugin.updateServer called!");
    console.log("📝 Server CLI Args:", cliArgs);

    // Initialize shared state
    if (!SecurityDashboardPlugin.sharedState) {
      SecurityDashboardPlugin.sharedState = {
        securityFeatures: new Map(),
        sessions: new Map(),
        securityEvents: [],
      };
    }

    const dashboardPort = cliArgs.securityDashboardPort || 4724;

    try {
      const dashboardApp = express();
      const dashboardServer = http.createServer(dashboardApp);
      const io = new Server(dashboardServer, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
        },
      });

      console.log("✅ Dashboard server components created");

      dashboardApp.use(cors());
      dashboardApp.use(express.static(path.join(__dirname, "../dashboard")));
      dashboardApp.use(express.json());

      console.log("✅ Dashboard middleware configured");

      // API routes with shared state
      dashboardApp.get("/api/security-status", (req, res) => {
        const sharedState = SecurityDashboardPlugin.sharedState || {
          securityFeatures: new Map(),
          sessions: new Map(),
          securityEvents: [],
        };

        res.json({
          status: "active",
          timestamp: Date.now(),
          features: Array.from(sharedState.securityFeatures.entries()),
          sessions: Array.from(sharedState.sessions.entries()),
          events: sharedState.securityEvents.slice(-50),
        });
      });

      dashboardApp.get("/api/compliance-report", (req, res) => {
        const now = Date.now();
        const last24h = now - 24 * 60 * 60 * 1000;
        const sharedState = SecurityDashboardPlugin.sharedState;

        const recentEvents = sharedState.securityEvents.filter(
          (e) => e.timestamp > last24h
        );

        const riskDistribution = recentEvents.reduce((acc, event) => {
          const level = event.riskLevel || 0;
          acc[level] = (acc[level] || 0) + 1;
          return acc;
        }, {});

        const highRiskCount = recentEvents.filter(
          (e) => e.riskLevel >= 3
        ).length;

        // Generate recommendations
        const recommendations = [];

        if (highRiskCount > 0) {
          recommendations.push({
            level: "critical",
            message: `${highRiskCount} high-risk security events detected in the last 24 hours`,
            action:
              "Review shell commands, file operations, and permission changes. Consider restricting these capabilities.",
          });
        }

        const shellCommands = recentEvents.filter(
          (e) => e.command === "mobile: shell" || e.command === "execute"
        );
        if (shellCommands.length > 5) {
          recommendations.push({
            level: "warning",
            message: `Frequent use of execute/shell commands detected (${shellCommands.length} times)`,
            action:
              "Use native WebDriver commands when possible. If shell access is needed, ensure proper sandboxing.",
          });
        }

        const fileOps = recentEvents.filter(
          (e) => e.command === "pushFile" || e.command === "pullFile"
        );
        if (fileOps.length > 0) {
          recommendations.push({
            level: "warning",
            message: `File system operations detected (${fileOps.length} operations)`,
            action:
              "Verify that file operations are necessary and paths are validated to prevent unauthorized access.",
          });
        }

        const clipboardOps = recentEvents.filter(
          (e) => e.command === "setClipboard" || e.command === "getClipboard"
        );
        if (clipboardOps.length > 0) {
          recommendations.push({
            level: "warning",
            message: `Clipboard access detected (${clipboardOps.length} operations)`,
            action:
              "Ensure clipboard data does not contain sensitive information like passwords or tokens.",
          });
        }

        const riskySessions = Array.from(sharedState.sessions.values()).filter(
          (session) => session.securityFeatures.some((f) => f.riskLevel >= 3)
        );
        if (riskySessions.length > 0) {
          recommendations.push({
            level: "warning",
            message: `${riskySessions.length} session(s) with high-risk capabilities active`,
            action:
              "Review capabilities like autoGrantPermissions and allowTestPackages. Disable if not needed.",
          });
        }

        if (recommendations.length === 0) {
          recommendations.push({
            level: "info",
            message: "No significant security concerns detected",
            action:
              "Continue monitoring security events and maintain current security practices.",
          });
        }

        res.json({
          timestamp: now,
          period: "24h",
          totalEvents: recentEvents.length,
          activeSessions: sharedState.sessions.size,
          riskDistribution,
          highRiskEvents: highRiskCount,
          recommendations,
        });
      });

      dashboardApp.get("/api/test", (req, res) => {
        res.json({ message: "Dashboard API is working!" });
      });

      console.log("✅ Dashboard API routes configured");

      io.on("connection", (socket) => {
        console.log("📱 Dashboard client connected");
        socket.emit("welcome", { message: "Connected to Security Dashboard" });

        const sharedState = SecurityDashboardPlugin.sharedState;
        socket.emit("security-status", {
          features: Array.from(sharedState.securityFeatures.entries()),
          sessions: Array.from(sharedState.sessions.entries()),
          events: sharedState.securityEvents.slice(-10),
        });
      });

      console.log("✅ Socket.IO configured");

      dashboardServer.listen(dashboardPort, (err) => {
        if (err) {
          console.error("❌ Failed to start dashboard server:", err);
          return;
        }
        console.log(`🎉 Security Dashboard server started successfully!`);
        console.log(
          `📊 Dashboard available at: http://localhost:${dashboardPort}`
        );
        console.log(
          `📂 Serving files from: ${path.join(__dirname, "../dashboard")}`
        );
      });

      SecurityDashboardPlugin.dashboardServer = dashboardServer;
      SecurityDashboardPlugin.dashboardApp = dashboardApp;
      SecurityDashboardPlugin.dashboardIO = io;
    } catch (error) {
      console.error("❌ Error in updateServer:", error);
    }
  }

  initializeDashboard() {
    console.log("🚀 Starting dashboard server initialization...");

    if (SecurityDashboardPlugin.dashboardServer) {
      console.log("ℹ️  Dashboard server already running from updateServer");
      this.app = SecurityDashboardPlugin.dashboardApp;
      this.server = SecurityDashboardPlugin.dashboardServer;
      this.io = SecurityDashboardPlugin.dashboardIO;
      return;
    }

    try {
      this.app = express();
      console.log("✅ Express app created");

      this.server = http.createServer(this.app);
      console.log("✅ HTTP server created");

      this.io = new Server(this.server, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
        },
      });
      console.log("✅ Socket.IO server created");

      this.app.use(cors());
      this.app.use(express.static(path.join(__dirname, "../dashboard")));
      this.app.use(express.json());
      console.log("✅ Express middleware configured");

      this.setupAPIRoutes();
      console.log("✅ API routes configured");

      this.setupSocketHandlers();
      console.log("✅ Socket handlers configured");

      this.server.listen(this.dashboardPort, (err) => {
        if (err) {
          console.error("❌ Failed to start dashboard server:", err);
          return;
        }
        console.log(`🎉 Security Dashboard server started successfully!`);
        console.log(
          `📊 Dashboard available at: http://localhost:${this.dashboardPort}`
        );
        console.log(
          `📂 Serving static files from: ${path.join(
            __dirname,
            "../dashboard"
          )}`
        );

        if (this.log) {
          this.log.info(
            `Security Dashboard available at http://localhost:${this.dashboardPort}`
          );
        }
      });
    } catch (error) {
      console.error("❌ Error during dashboard initialization:", error);
      throw error;
    }
  }

  setupAPIRoutes() {
    this.app.get("/api/security-status", (req, res) => {
      const sharedState = SecurityDashboardPlugin.sharedState || {
        securityFeatures: new Map(),
        sessions: new Map(),
        securityEvents: [],
      };

      res.json({
        features: Array.from(sharedState.securityFeatures.entries()),
        sessions: Array.from(sharedState.sessions.entries()),
        events: sharedState.securityEvents.slice(-50),
      });
    });

    this.app.get("/api/compliance-report", (req, res) => {
      const report = this.generateComplianceReport();
      res.json(report);
    });
  }

  setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      console.log("📱 Dashboard client connected");

      const sharedState = SecurityDashboardPlugin.sharedState;
      socket.emit("security-status", {
        features: Array.from(sharedState.securityFeatures.entries()),
        sessions: Array.from(sharedState.sessions.entries()),
        events: sharedState.securityEvents.slice(-10),
      });
    });
  }

  async createSession(
    next,
    driver,
    w3cCapabilities1,
    w3cCapabilities2,
    w3cCapabilities3,
    driverData
  ) {
    console.log("🔍 Session creation intercepted by security plugin");
    console.log("🔍 Shared state before:", SecurityDashboardPlugin.sharedState);
    console.log("🔍 this.sessions before:", this.sessions);

    const result = await next();

    console.log("🔍 Session creation result:", result);

    // Handle both array format and object format
    let sessionId, capabilities;

    if (
      result &&
      result.value &&
      Array.isArray(result.value) &&
      result.value.length >= 2
    ) {
      // W3C format: {protocol: 'W3C', value: [sessionId, capabilities, ...]}
      sessionId = result.value[0];
      capabilities = result.value[1];
      console.log("🔍 Detected W3C format response");
    } else if (result && result.length >= 2) {
      // Direct array format: [sessionId, capabilities]
      sessionId = result[0];
      capabilities = result[1];
      console.log("🔍 Detected direct array format response");
    } else {
      console.log("❌ Session creation result format unexpected:", result);
      return result;
    }

    console.log(`🔍 Analyzing session ${sessionId} for security features`);
    console.log(`🔍 Sessions Map size before add: ${this.sessions.size}`);

    const sessionInfo = {
      sessionId,
      driverName: driver.constructor.name,
      capabilities,
      securityFeatures: this.extractSecurityFeatures(capabilities),
      startTime: Date.now(),
      events: [],
    };

    this.sessions.set(sessionId, sessionInfo);

    console.log(`🔍 Sessions Map size after add: ${this.sessions.size}`);
    console.log(
      `🔍 SharedState sessions size: ${SecurityDashboardPlugin.sharedState.sessions.size}`
    );
    console.log(
      `🔍 Are they the same object?`,
      this.sessions === SecurityDashboardPlugin.sharedState.sessions
    );

    const event = {
      type: "session_started",
      sessionId,
      timestamp: Date.now(),
      driverName: sessionInfo.driverName,
      securityFeatures: sessionInfo.securityFeatures,
      riskLevel: Math.max(
        ...sessionInfo.securityFeatures.map((f) => f.riskLevel || 0),
        1
      ),
    };

    this.logSecurityEvent(event);
    console.log(
      `✅ Session ${sessionId} registered with ${sessionInfo.securityFeatures.length} security features`
    );
    console.log(
      `📊 Security features found:`,
      sessionInfo.securityFeatures.map((f) => f.name)
    );
    console.log(
      `🔍 FINAL CHECK - Sessions in shared state:`,
      Array.from(SecurityDashboardPlugin.sharedState.sessions.keys())
    );

    return result;
  }

  async deleteSession(next, driver) {
    const sessionId = driver.sessionId;
    console.log(`🗑️ Session deletion intercepted: ${sessionId}`);

    if (this.sessions.has(sessionId)) {
      const sessionInfo = this.sessions.get(sessionId);
      sessionInfo.endTime = Date.now();
      sessionInfo.duration = sessionInfo.endTime - sessionInfo.startTime;

      const event = {
        type: "session_ended",
        sessionId,
        timestamp: Date.now(),
        duration: sessionInfo.duration,
        eventsCount: sessionInfo.events.length,
        riskLevel: 1,
      };

      this.logSecurityEvent(event);
      console.log(
        `✅ Session ${sessionId} ended after ${sessionInfo.duration}ms with ${sessionInfo.events.length} events`
      );

      this.sessions.delete(sessionId);
    }

    const result = await next();
    return result;
  }

  async handle(next, driver, cmdName, ...args) {
    const sessionId = driver.sessionId;
    const start = Date.now();

    console.log(`🔍 Command intercepted: ${cmdName} for session ${sessionId}`);

    try {
      const result = await next();
      const duration = Date.now() - start;

      const securityRisk = this.assessCommandSecurity(cmdName, args);

      if (
        securityRisk.level > 0 ||
        cmdName.startsWith("mobile:") ||
        cmdName === "execute"
      ) {
        const event = {
          type: "security_command",
          sessionId,
          command: cmdName,
          args: this.sanitizeArgs(args),
          riskLevel: securityRisk.level,
          riskReason: securityRisk.reason,
          timestamp: Date.now(),
          duration,
        };

        this.logSecurityEvent(event);
        console.log(
          `🔒 Security event logged: ${cmdName} (risk level: ${securityRisk.level})`
        );

        if (this.sessions.has(sessionId)) {
          this.sessions.get(sessionId).events.push(event);
        }
      }

      return result;
    } catch (error) {
      const event = {
        type: "security_error",
        sessionId,
        command: cmdName,
        error: error.message,
        timestamp: Date.now(),
        riskLevel: 2,
      };

      this.logSecurityEvent(event);
      console.log(`❌ Security error logged: ${cmdName} - ${error.message}`);
      throw error;
    }
  }

  sanitizeArgs(args) {
    if (!args || args.length === 0) return [];

    return args.map((arg) => {
      if (typeof arg === "string" && arg.length > 100) {
        return arg.substring(0, 100) + "... (truncated)";
      }
      if (typeof arg === "object" && arg !== null) {
        return { type: "object", keys: Object.keys(arg) };
      }
      return arg;
    });
  }

  assessCommandSecurity(cmdName, args) {
    const highRiskCommands = {
      execute: { level: 3, reason: "Arbitrary code execution" },
      executeAsync: { level: 3, reason: "Arbitrary async code execution" },
      "mobile: shell": { level: 4, reason: "Direct shell access" },
      "mobile: startLogsBroadcast": { level: 2, reason: "Log access" },
      "mobile: changePermissions": {
        level: 3,
        reason: "Permission modification",
      },
      installApp: { level: 3, reason: "App installation" },
      removeApp: { level: 2, reason: "App removal" },
      pushFile: { level: 2, reason: "File system write" },
      pullFile: { level: 1, reason: "File system read" },
    };

    const mediumRiskCommands = {
      setClipboard: { level: 2, reason: "Clipboard access" },
      getClipboard: { level: 1, reason: "Clipboard read" },
      takeScreenshot: { level: 1, reason: "Screen capture" },
      getPageSource: { level: 1, reason: "UI structure access" },
      getCurrentActivity: { level: 1, reason: "App state access" },
    };

    if (highRiskCommands[cmdName]) {
      return highRiskCommands[cmdName];
    } else if (mediumRiskCommands[cmdName]) {
      return mediumRiskCommands[cmdName];
    } else if (cmdName.startsWith("mobile:")) {
      return { level: 1, reason: "Mobile-specific command" };
    }

    return { level: 0, reason: "Standard WebDriver command" };
  }

  logSecurityEvent(event) {
    this.securityEvents.push(event);

    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    if (this.io) {
      this.io.emit("security-event", event);
      console.log(`📡 Event broadcasted to dashboard: ${event.type}`);
    }

    if (SecurityDashboardPlugin.dashboardIO) {
      SecurityDashboardPlugin.dashboardIO.emit("security-event", event);
      console.log(`📡 Event broadcasted via server IO: ${event.type}`);
    }

    console.log(
      `🔒 Security event stored: ${event.type} (${event.sessionId}) - Total events: ${this.securityEvents.length}`
    );

    if (event.riskLevel && event.riskLevel >= 3) {
      console.log(
        `🚨 HIGH RISK SECURITY EVENT: ${event.type} - ${event.riskReason}`
      );
    }
  }

  extractSecurityFeatures(capabilities) {
    const securityFeatures = [];

    const securityCapabilities = [
      "autoGrantPermissions",
      "autoAcceptAlerts",
      "allowTestPackages",
      "ignoreUnimportantViews",
      "disableWindowAnimation",
      "skipServerInstallation",
      "systemPort",
      "mjpegServerPort",
      "adbPort",
    ];

    securityCapabilities.forEach((cap) => {
      if (capabilities[cap] !== undefined) {
        securityFeatures.push({
          name: cap,
          value: capabilities[cap],
          riskLevel: this.getCapabilityRiskLevel(cap, capabilities[cap]),
        });
      }
    });

    return securityFeatures;
  }

  getCapabilityRiskLevel(capName, value) {
    const riskLevels = {
      autoGrantPermissions: value ? 3 : 1,
      autoAcceptAlerts: value ? 2 : 1,
      allowTestPackages: value ? 3 : 1,
      skipServerInstallation: value ? 4 : 1,
      systemPort: 2,
      adbPort: 3,
    };

    return riskLevels[capName] || 1;
  }

  generateComplianceReport() {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;

    const recentEvents = this.securityEvents.filter(
      (e) => e.timestamp > last24h
    );

    const riskDistribution = recentEvents.reduce((acc, event) => {
      const level = event.riskLevel || 0;
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});

    const recommendations = [];

    const highRiskCount = recentEvents.filter((e) => e.riskLevel >= 3).length;
    if (highRiskCount > 0) {
      recommendations.push({
        level: "critical",
        message: `${highRiskCount} high-risk security events detected in the last 24 hours`,
        action:
          "Review shell commands, file operations, and permission changes. Consider restricting these capabilities.",
      });
    }

    const shellCommands = recentEvents.filter(
      (e) => e.command === "mobile: shell" || e.command === "execute"
    );
    if (shellCommands.length > 5) {
      recommendations.push({
        level: "warning",
        message: `Frequent use of execute/shell commands detected (${shellCommands.length} times)`,
        action:
          "Use native WebDriver commands when possible. If shell access is needed, ensure proper sandboxing.",
      });
    }

    const fileOps = recentEvents.filter(
      (e) => e.command === "pushFile" || e.command === "pullFile"
    );
    if (fileOps.length > 0) {
      recommendations.push({
        level: "warning",
        message: `File system operations detected (${fileOps.length} operations)`,
        action:
          "Verify that file operations are necessary and paths are validated to prevent unauthorized access.",
      });
    }

    const clipboardOps = recentEvents.filter(
      (e) => e.command === "setClipboard" || e.command === "getClipboard"
    );
    if (clipboardOps.length > 0) {
      recommendations.push({
        level: "warning",
        message: `Clipboard access detected (${clipboardOps.length} operations)`,
        action:
          "Ensure clipboard data does not contain sensitive information like passwords or tokens.",
      });
    }

    const riskySessions = Array.from(this.sessions.values()).filter((session) =>
      session.securityFeatures.some((f) => f.riskLevel >= 3)
    );
    if (riskySessions.length > 0) {
      recommendations.push({
        level: "warning",
        message: `${riskySessions.length} session(s) with high-risk capabilities active`,
        action:
          "Review capabilities like autoGrantPermissions and allowTestPackages. Disable if not needed.",
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        level: "info",
        message: "No significant security concerns detected",
        action:
          "Continue monitoring security events and maintain current security practices.",
      });
    }

    return {
      timestamp: now,
      period: "24h",
      totalEvents: recentEvents.length,
      activeSessions: this.sessions.size,
      riskDistribution,
      highRiskEvents: highRiskCount,
      recommendations,
    };
  }

  static get cliArgsExtensionDesc() {
    return {
      "security-dashboard-port": {
        dest: "securityDashboardPort",
        defaultValue: 4724,
        type: "int",
        help: "Port for the security dashboard web interface",
      },
    };
  }
}

module.exports = { SecurityDashboardPlugin };
