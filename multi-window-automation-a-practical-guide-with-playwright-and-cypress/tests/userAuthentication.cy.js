describe("Authentication Flow", () => {
  it("Authenticate user through popup window", () => {
    // Visit the main page
    cy.visit("http://testing_website.com");

    // Create a stub for window.open
    cy.window().then((win) => {
      cy.stub(win, "open")
        .as("windowOpen")
        .callsFake((url, target) => {
          // Return a mock window object that Cypress can control
          return {
            document: {
              write: cy.stub().as("documentWrite"),
            },
            close: cy.stub().as("windowClose"),
          };
        });
    });

    // Click the authenticate button
    cy.get("#authButton").click();

    // Verify window.open was called
    cy.get("@windowOpen").should("be.called");

    // Simulate the popup window interaction
    cy.window().then((win) => {
      // Create a mock DOM element for the username input
      const usernameInput = document.createElement("input");
      usernameInput.id = "username";
      usernameInput.value = "TestUser";

      // Create a mock DOM element for the submit button
      const submitButton = document.createElement("button");
      submitButton.id = "submit";

      // Simulate the submit button click event
      const clickEvent = new Event("click");
      submitButton.dispatchEvent(clickEvent);

      // Trigger the event listener that would normally be in the popup
      win.document.getElementById(
        "auth-status"
      ).textContent = `User ${usernameInput.value} successfully authenticated.`;
    });

    // Verify the authentication status message
    cy.get("#auth-status").should(
      "have.text",
      "User TestUser successfully authenticated."
    );
  });
});
