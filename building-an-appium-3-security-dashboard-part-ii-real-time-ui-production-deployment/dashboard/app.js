class SecurityDashboard {
  constructor() {
    this.socket = null;
    this.riskChart = null;
    this.events = [];
    this.sessions = new Map();
    this.init();
  }

  init() {
    this.initSocket();
    this.initEventListeners();
    this.initChart();
    this.loadInitialData();
    // Poll for updates every 2 seconds to catch active sessions
    setInterval(() => this.loadInitialData(), 2000);
  }

  initSocket() {
    this.socket = io();

    this.socket.on("connect", () => {
      console.log("Connected to security dashboard");
      this.updateConnectionStatus(true);
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from security dashboard");
      this.updateConnectionStatus(false);
    });

    this.socket.on("security-status", (data) => {
      this.updateDashboard(data);
    });

    this.socket.on("security-event", (event) => {
      this.handleNewEvent(event);
    });
  }

  initEventListeners() {
    // Event filter
    document.getElementById("event-filter").addEventListener("change", (e) => {
      this.filterEvents(e.target.value);
    });

    // Modal close
    document.querySelector(".close").addEventListener("click", () => {
      this.closeModal();
    });

    // Close modal on outside click
    window.addEventListener("click", (e) => {
      const modal = document.getElementById("event-modal");
      if (e.target === modal) {
        this.closeModal();
      }
    });
  }

  initChart() {
    const ctx = document.getElementById("riskChart").getContext("2d");

    // Destroy existing chart if it exists
    if (this.riskChart) {
      this.riskChart.destroy();
    }

    this.riskChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Low Risk", "Medium Risk", "High Risk", "Critical Risk"],
        datasets: [
          {
            data: [1, 1, 1, 1], // Start with small values instead of 0
            backgroundColor: ["#48bb78", "#ed8936", "#f56565", "#e53e3e"],
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 12,
              padding: 15,
            },
          },
        },
        layout: {
          padding: 10,
        },
      },
    });
  }

  async loadInitialData() {
    try {
      const response = await fetch("/api/security-status");
      const data = await response.json();
      this.updateDashboard(data);

      // Load compliance report
      const complianceResponse = await fetch("/api/compliance-report");
      const complianceData = await complianceResponse.json();
      this.updateRecommendations(complianceData.recommendations);
    } catch (error) {
      console.error("Failed to load initial data:", error);
    }
  }

  updateConnectionStatus(connected) {
    const statusDot = document.getElementById("connection-status");
    const statusText = document.getElementById("connection-text");

    if (connected) {
      statusDot.className = "status-dot online";
      statusText.textContent = "Connected";
    } else {
      statusDot.className = "status-dot offline";
      statusText.textContent = "Disconnected";
    }
  }

  updateDashboard(data) {
    this.sessions = new Map(data.sessions);
    this.events = data.events || [];

    this.updateOverviewMetrics();
    this.updateActiveSessions();
    this.updateEventsTimeline();
    this.updateRiskChart();
  }

  updateOverviewMetrics() {
    // Update metrics
    document.getElementById("active-sessions").textContent = this.sessions.size;
    document.getElementById("total-events").textContent = this.events.length;

    const highRiskEvents = this.events.filter(
      (e) => (e.riskLevel || 0) >= 3
    ).length;
    document.getElementById("high-risk-events").textContent = highRiskEvents;

    // Calculate overall risk level
    const maxRisk = Math.max(...this.events.map((e) => e.riskLevel || 0), 0);
    const riskLevels = ["Low", "Low", "Medium", "High", "Critical"];
    document.getElementById("overall-risk-level").textContent =
      riskLevels[maxRisk] || "Low";
  }

  updateActiveSessions() {
    const container = document.getElementById("sessions-list");

    if (this.sessions.size === 0) {
      container.innerHTML = '<p class="no-data">No active sessions</p>';
      return;
    }

    const sessionsHtml = Array.from(this.sessions.entries())
      .map(([sessionId, sessionInfo]) => {
        const riskLevel = this.calculateSessionRisk(sessionInfo);
        const riskClass = this.getRiskClass(riskLevel);
        const riskLabel = this.getRiskLabel(riskLevel);

        return `
                <div class="session-item ${riskClass}">
                    <div class="session-header">
                        <div style="display: flex; flex-direction: column; gap: 0.25rem; flex: 1;">
                            <span class="session-id" style="word-break: break-all;">${sessionId}</span>
                            <span class="session-risk risk-${riskLevel}">Risk level: ${riskLabel}</span>
                        </div>
                    </div>
                    <div class="session-driver">${sessionInfo.driverName}</div>
                    <div class="session-features">
                        ${sessionInfo.securityFeatures.length} security features active
                    </div>
                </div>
            `;
      })
      .join("");

    container.innerHTML = sessionsHtml;
  }

  updateEventsTimeline() {
    const container = document.getElementById("events-timeline");

    if (this.events.length === 0) {
      container.innerHTML = '<p class="no-data">No events</p>';
      return;
    }

    // Sort events by timestamp (newest first)
    const sortedEvents = [...this.events].sort(
      (a, b) => b.timestamp - a.timestamp
    );

    const eventsHtml = sortedEvents
      .slice(0, 20)
      .map((event) => {
        const riskLevel = event.riskLevel || 0;
        const time = new Date(event.timestamp).toLocaleTimeString();

        return `
                <div class="event-item risk-${riskLevel}" data-event='${JSON.stringify(
          event
        )}'>
                    <div class="event-header">
                        <span class="event-command">${
                          event.command || event.type
                        }</span>
                        <span class="event-time">${time}</span>
                    </div>
                    <div class="event-reason">${
                      event.riskReason || "Standard operation"
                    }</div>
                </div>
            `;
      })
      .join("");

    container.innerHTML = eventsHtml;

    // Add click listeners for event details
    container.querySelectorAll(".event-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const eventData = JSON.parse(e.currentTarget.dataset.event);
        this.showEventDetails(eventData);
      });
    });

    // Apply current filter if any
    const currentFilter = document.getElementById("event-filter").value;
    if (currentFilter !== "all") {
      this.filterEvents(currentFilter);
    }
  }

  updateRiskChart() {
    // Calculate risk distribution
    const riskCounts = [0, 0, 0, 0]; // Low, Medium, High, Critical

    this.events.forEach((event) => {
      const risk = event.riskLevel || 0;
      if (risk <= 1) riskCounts[0]++;
      else if (risk === 2) riskCounts[1]++;
      else if (risk === 3) riskCounts[2]++;
      else if (risk >= 4) riskCounts[3]++;
    });

    this.riskChart.data.datasets[0].data = riskCounts;
    this.riskChart.update();
  }

  handleNewEvent(event) {
    this.events.unshift(event);

    // Keep only last 100 events in memory
    if (this.events.length > 100) {
      this.events = this.events.slice(0, 100);
    }

    // Update displays
    this.updateOverviewMetrics();
    this.updateEventsTimeline();
    this.updateRiskChart();

    // Show notification for high-risk events
    if ((event.riskLevel || 0) >= 3) {
      this.showNotification(event);
    }
  }

  filterEvents(filter) {
    const items = document.querySelectorAll(".event-item");

    items.forEach((item) => {
      const eventData = JSON.parse(item.dataset.event);
      const riskLevel = eventData.riskLevel || 0;

      let show = false;
      if (filter === "all") {
        show = true;
      } else if (filter === "high" && riskLevel >= 3) {
        show = true;
      } else if (filter === "medium" && riskLevel === 2) {
        show = true;
      }

      item.style.display = show ? "block" : "none";
    });
  }

  showEventDetails(event) {
    const modal = document.getElementById("event-modal");
    const detailsContainer = document.getElementById("event-details");

    const detailsHtml = `
            <div class="event-detail">
                <h3>Event Information</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Type:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${
                      event.type
                    }</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Command:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${
                      event.command || "N/A"
                    }</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Session ID:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${
                      event.sessionId || "N/A"
                    }</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Risk Level:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${
                      event.riskLevel || 0
                    }</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Risk Reason:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${
                      event.riskReason || "N/A"
                    }</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Timestamp:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${new Date(
                      event.timestamp
                    ).toLocaleString()}</td></tr>
                    ${
                      event.duration
                        ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Duration:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${event.duration}ms</td></tr>`
                        : ""
                    }
                    ${
                      event.args
                        ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Arguments:</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><pre>${JSON.stringify(
                            event.args,
                            null,
                            2
                          )}</pre></td></tr>`
                        : ""
                    }
                </table>
            </div>
        `;

    detailsContainer.innerHTML = detailsHtml;
    modal.style.display = "block";
  }

  closeModal() {
    document.getElementById("event-modal").style.display = "none";
  }

  updateRecommendations(recommendations) {
    const container = document.getElementById("recommendations-list");

    if (!recommendations || recommendations.length === 0) {
      container.innerHTML =
        '<p class="no-data">No recommendations at this time</p>';
      return;
    }

    const recommendationsHtml = recommendations
      .map(
        (rec) => `
            <div class="recommendation-item ${rec.level}">
                <div class="recommendation-message">${rec.message}</div>
                <div class="recommendation-action">${rec.action}</div>
            </div>
        `
      )
      .join("");

    container.innerHTML = recommendationsHtml;
  }

  showNotification(event) {
    // Create a temporary notification
    const notification = document.createElement("div");
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f56565;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1001;
            max-width: 300px;
        `;

    notification.innerHTML = `
            <strong>High Risk Event!</strong><br>
            Command: ${event.command || event.type}<br>
            Risk: ${event.riskReason}
        `;

    document.body.appendChild(notification);

    // Remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  calculateSessionRisk(sessionInfo) {
    const events = sessionInfo.events || [];
    const maxEventRisk = Math.max(...events.map((e) => e.riskLevel || 0), 0);
    const featureRisk = Math.max(
      ...sessionInfo.securityFeatures.map((f) => f.riskLevel || 0),
      0
    );

    return Math.max(maxEventRisk, featureRisk);
  }

  getRiskClass(riskLevel) {
    if (riskLevel <= 1) return "low-risk";
    if (riskLevel === 2) return "medium-risk";
    return "high-risk";
  }

  getRiskLabel(riskLevel) {
    const labels = ["Low", "Low", "Medium", "High", "Critical"];
    return labels[riskLevel] || "Low";
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new SecurityDashboard();
});
