describe("Text Selection Test", () => {
  it("should select text and verify action menu appears", () => {
    // Visit the page
    cy.visit("http://localhost:3000");

    // Wait for the paragraph to be loaded
    cy.get("#demo-text").should("be.visible");

    // Store the text content and find the date
    const dateText = "March 15, 2025";

    cy.get("#demo-text").then(($paragraph) => {
      const paragraphText = $paragraph.text();

      // Verify the date exists in the text
      expect(paragraphText).to.include(dateText);

      // Use Cypress to execute JavaScript to select the text and trigger action menu
      cy.window().then((win) => {
        // Find all text nodes in the document
        const textNodes = [];
        function getTextNodes(node) {
          if (node.nodeType === Node.TEXT_NODE) {
            textNodes.push(node);
          } else {
            for (let i = 0; i < node.childNodes.length; i++) {
              getTextNodes(node.childNodes[i]);
            }
          }
        }
        getTextNodes(win.document.body);

        // Find the text node containing our date
        let targetNode = null;
        let targetOffset = -1;

        for (const node of textNodes) {
          const index = node.textContent.indexOf(dateText);
          if (index >= 0) {
            targetNode = node;
            targetOffset = index;
            break;
          }
        }

        if (targetNode) {
          // Create a new selection
          const range = win.document.createRange();
          range.setStart(targetNode, targetOffset);
          range.setEnd(targetNode, targetOffset + dateText.length);

          const selection = win.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);

          // Dispatch a mouseup event to trigger the selection handler
          const mouseupEvent = new MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
            view: win,
          });
          win.document.dispatchEvent(mouseupEvent);
        } else {
          throw new Error(
            `Could not find the text "${dateText}" in any text node`
          );
        }
      });

      // Wait for and verify the action menu appears
      cy.get("#action-menu")
        .should("be.visible")
        .and("have.css", "display", "block");

      // Verify the action button text
      cy.get("#action-menu button")
        .should("be.visible")
        .and("have.text", "Add to Calendar");
    });
  });
});
