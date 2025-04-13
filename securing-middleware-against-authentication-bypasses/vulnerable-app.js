/**
 * A simple app that uses the vulnerable middleware implementation
 */
const http = require("http");
const NextJsMiddleware = require("./mock-nextjs-middleware");

// Create middleware instance
const middleware = new NextJsMiddleware();

// Create a simple HTTP server
const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  // Path that should be protected by auth middleware
  if (req.url.startsWith("/admin")) {
    const middlewareResult = await middleware.runMiddleware(req, res, {
      name: "middleware", // This would be the path to the middleware file in Next.js
    });

    // If middleware handled the response or was skipped, we're done
    if (middlewareResult.handled) {
      return;
    }

    // If we get here, either:
    // 1. The middleware passed the request through normally (user is authenticated)
    // 2. The middleware was bypassed with the x-middleware-subrequest header (vulnerability!)

    // Sensitive admin content that should be protected
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        message: "Admin area - sensitive content",
        data: {
          users: [
            { id: 1, username: "admin", role: "admin" },
            { id: 2, username: "user", role: "user" },
          ],
        },
      })
    );
    return;
  }

  // Public endpoint
  if (req.url === "/") {
    res.statusCode = 200;
    res.end(JSON.stringify({ message: "Public API" }));
    return;
  }

  // 404 for anything else
  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Not found" }));
});

// Start server if running directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = server;
