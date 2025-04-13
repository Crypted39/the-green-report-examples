/**
 * A simplified version of the vulnerable Next.js middleware implementation
 * This mimics the actual vulnerability described in the security report
 */
class NextJsMiddleware {
  constructor() {
    this.MAX_RECURSION_DEPTH = 5;
  }

  /**
   * Process a request through the middleware
   * This contains the same vulnerability as described in the Next.js security report
   */
  async runMiddleware(req, res, middlewareInfo) {
    console.log("Running middleware for:", req.url);

    // The vulnerable check from Next.js (simplified)
    if (req.headers["x-middleware-subrequest"]) {
      const subrequests = req.headers["x-middleware-subrequest"].split(":");

      // Implementation from older versions (v11.1.4 through v12.1.x)
      if (
        subrequests.includes("pages/_middleware") ||
        subrequests.includes("middleware")
      ) {
        console.log("⚠️ Middleware execution skipped due to subrequest header");
        return { handled: false, skipped: true };
      }

      // Implementation from newer versions (recursion depth check)
      let depth = 0;
      for (const subrequest of subrequests) {
        if (subrequest === "middleware" || subrequest === "src/middleware") {
          depth++;
        }
      }

      if (depth >= this.MAX_RECURSION_DEPTH) {
        console.log(
          "⚠️ Middleware execution skipped due to max recursion depth"
        );
        return { handled: false, skipped: true };
      }
    }

    // Authorization check (would be bypassed if middleware is skipped)
    if (!req.headers.authorization) {
      console.log("🔒 Access denied - no authorization token");
      res.statusCode = 401;
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return { handled: true, skipped: false };
    }

    // Middleware executed normally
    console.log("✅ Middleware executed normally");
    return { handled: false, skipped: false };
  }
}

module.exports = NextJsMiddleware;
