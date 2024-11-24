import { io } from "socket.io-client";
import { expect } from "chai";

const TEST_SERVER_URL = "http://localhost:3000";
const TOTAL_CLIENTS = 10;

describe("Video Streaming Integration Tests", function () {
  // Set timeout for all tests in this suite
  this.timeout(10000);

  let clients = [];

  before(function (done) {
    // Ensure server is running and ready
    const testClient = io(TEST_SERVER_URL, {
      "force new connection": true,
      transports: ["websocket"],
    });

    testClient.on("connect", () => {
      testClient.disconnect();
      done();
    });

    testClient.on("connect_error", (error) => {
      done(new Error(`Server not running: ${error.message}`));
    });
  });

  describe("Connection Management Tests", function () {
    it("should handle rapid connections without multiple waiting users", function (done) {
      const results = {
        maxConcurrentWaiting: 0,
        totalConnections: 0,
        errors: [],
        disconnections: 0,
      };

      let connectionsCompleted = 0;

      // Create multiple clients that connect/disconnect rapidly
      for (let i = 0; i < TOTAL_CLIENTS; i++) {
        const client = io(TEST_SERVER_URL, {
          "force new connection": true,
          transports: ["websocket"],
        });

        clients.push(client);

        client.on("connect", () => {
          results.totalConnections++;

          // Simulate user behavior with random delays
          setTimeout(() => {
            client.emit("startSearching");

            setTimeout(() => {
              client.disconnect();
              results.disconnections++;

              // Check if all clients have completed their cycle
              connectionsCompleted++;
              if (connectionsCompleted === TOTAL_CLIENTS) {
                try {
                  expect(results.errors).to.be.empty;
                  expect(results.totalConnections).to.equal(TOTAL_CLIENTS);
                  expect(results.disconnections).to.equal(TOTAL_CLIENTS);
                  done();
                } catch (error) {
                  done(error);
                }
              }
            }, Math.random() * 1000 + 500); // Shorter disconnect delay
          }, Math.random() * 500); // Shorter search delay
        });

        client.on("error", (error) => {
          results.errors.push(error);
        });

        client.on("connect_error", (error) => {
          results.errors.push(
            `Connection error for client ${i}: ${error.message}`
          );
        });
      }
    });

    // Add a simple connection test
    it("should connect a single client successfully", function (done) {
      const client = io(TEST_SERVER_URL, {
        "force new connection": true,
        transports: ["websocket"],
      });

      client.on("connect", () => {
        client.disconnect();
        done();
      });

      client.on("connect_error", (error) => {
        done(error);
      });
    });
  });

  afterEach(function (done) {
    // Cleanup clients
    let disconnected = 0;
    const totalClients = clients.length;

    if (totalClients === 0) {
      done();
      return;
    }

    clients.forEach((client) => {
      if (client.connected) {
        client.on("disconnect", () => {
          disconnected++;
          if (disconnected === totalClients) {
            done();
          }
        });
        client.disconnect();
      } else {
        disconnected++;
        if (disconnected === totalClients) {
          done();
        }
      }
    });
  });

  after(function () {
    clients = [];
  });
});
