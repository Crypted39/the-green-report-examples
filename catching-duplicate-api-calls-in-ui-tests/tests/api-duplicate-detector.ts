import { Page } from "@playwright/test";

interface ApiCall {
  url: string;
  method: string;
  testName: string;
  count: number;
}

interface DuplicateInfo {
  testName: string;
  duplicates: Array<{
    endpoint: string;
    count: number;
  }>;
}

class ApiCallTracker {
  private apiCalls: Map<string, ApiCall> = new Map();
  private duplicates: DuplicateInfo[] = [];
  private currentTestName: string = "";
  private isTracking: boolean = false;

  /**
   * Initialize API call tracking for the current test
   * Call this in your beforeEach or test.beforeEach hook
   */
  async startTracking(page: Page, testName: string): Promise<void> {
    this.currentTestName = testName;
    this.isTracking = true;

    // Listen to all network requests (real APIs like /users, /posts)
    page.on("request", (request) => {
      if (!this.isTracking) return;

      const url = request.url();
      const method = request.method();

      // Ignore static assets
      if (url.endsWith(".html") || url.endsWith(".css") || url.endsWith(".js"))
        return;

      const trackedEndpoints = [
        "/users",
        "/posts",
        "/settings",
        "/profile",
        "/notifications",
        "/analytics",
        "/reports",
      ];
      if (!trackedEndpoints.some((endpoint) => url.includes(endpoint))) return;

      const key = `${method}:${url}`;
      this.handleApiCall(key, url, method);
    });

    // Listen for console logs (for mocked API calls like /profile, /analytics, etc.)
    page.on("console", (msg) => {
      if (!this.isTracking) return;

      const text = msg.text();
      if (text.startsWith("[API_CALL]")) {
        const endpoint = text.replace("[API_CALL] ", "");
        const method = "GET"; // all our mock calls are GET
        const key = `${method}:${endpoint}`;

        this.handleApiCall(key, endpoint, method);
      }
    });
  }

  // Factor out your existing duplicate-tracking logic into a helper
  private handleApiCall(key: string, url: string, method: string): void {
    if (this.apiCalls.has(key)) {
      const existingCall = this.apiCalls.get(key)!;
      existingCall.count++;

      if (existingCall.count === 2) {
        this.addDuplicate(
          existingCall.testName,
          url,
          method,
          existingCall.count
        );
      } else if (existingCall.count > 2) {
        this.updateDuplicateCount(
          existingCall.testName,
          url,
          method,
          existingCall.count
        );
      }
    } else {
      this.apiCalls.set(key, {
        url,
        method,
        testName: this.currentTestName,
        count: 1,
      });
    }
  }

  /**
   * Stop tracking for the current test
   * Call this in your afterEach hook
   */
  stopTracking(): void {
    this.isTracking = false;
    this.currentTestName = "";
  }

  /**
   * Check for duplicates and fail the test if any are found
   * Call this in your afterAll hook
   */
  async reportDuplicates(): Promise<void> {
    if (this.duplicates.length > 0) {
      const errorMessage = this.formatDuplicatesReport();
      throw new Error(`Duplicate API calls detected:\n${errorMessage}`);
    }
  }

  /**
   * Get current duplicates without failing the test (for debugging)
   */
  getDuplicates(): DuplicateInfo[] {
    return [...this.duplicates];
  }

  /**
   * Reset all tracking data
   * Useful for cleaning up between test files
   */
  reset(): void {
    this.apiCalls.clear();
    this.duplicates = [];
    this.currentTestName = "";
    this.isTracking = false;
  }

  private addDuplicate(
    testName: string,
    url: string,
    method: string,
    count: number
  ): void {
    const endpoint = `${method} ${url}`;
    let duplicateInfo = this.duplicates.find((d) => d.testName === testName);

    if (!duplicateInfo) {
      duplicateInfo = {
        testName,
        duplicates: [],
      };
      this.duplicates.push(duplicateInfo);
    }

    duplicateInfo.duplicates.push({
      endpoint,
      count,
    });
  }

  private updateDuplicateCount(
    testName: string,
    url: string,
    method: string,
    count: number
  ): void {
    const endpoint = `${method} ${url}`;
    const duplicateInfo = this.duplicates.find((d) => d.testName === testName);

    if (duplicateInfo) {
      const duplicate = duplicateInfo.duplicates.find(
        (d) => d.endpoint === endpoint
      );
      if (duplicate) {
        duplicate.count = count;
      }
    }
  }

  private formatDuplicatesReport(): string {
    let report = "\n🚨 Duplicate API calls detected:\n\n";

    this.duplicates.forEach((duplicateInfo) => {
      report += `❌ Test: "${duplicateInfo.testName}"\n`;
      duplicateInfo.duplicates.forEach((duplicate) => {
        report += `   • ${duplicate.endpoint} (called ${duplicate.count} times)\n`;
      });
      report += "\n";
    });

    report +=
      "💡 Tip: Review your test logic to ensure API calls are not unnecessarily repeated.\n";
    return report;
  }
}

// Export a singleton instance
export const apiCallTracker = new ApiCallTracker();

// Convenience function for easier usage
export function setupApiCallTracking() {
  return {
    /**
     * Start tracking API calls for a test
     * @param page Playwright page object
     * @param testInfo Playwright test info object (optional, will use generic name if not provided)
     */
    async startTracking(page: Page, testInfo?: any): Promise<void> {
      const testName = testInfo?.title || "Unknown Test";
      await apiCallTracker.startTracking(page, testName);
    },

    /**
     * Stop tracking for current test
     */
    stopTracking(): void {
      apiCallTracker.stopTracking();
    },

    /**
     * Report duplicates at the end of the spec
     */
    async reportDuplicates(): Promise<void> {
      await apiCallTracker.reportDuplicates();
    },

    /**
     * Reset tracking data
     */
    reset(): void {
      apiCallTracker.reset();
    },
  };
}
