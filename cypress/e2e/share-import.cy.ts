/// <reference types="cypress" />

/**
 * Visit the app while forcing the clipboard fallback for sharing:
 * remove the Web Share API and guarantee a stubbable clipboard.
 */
const visitWithClipboard = (url = "/") => {
  cy.visit(url, {
    onBeforeLoad(win) {
      Object.defineProperty(win.navigator, "share", {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(win.navigator, "clipboard", {
        value: { writeText: () => Promise.resolve() },
        configurable: true,
      });
    },
  });
  cy.window().then((win) => {
    const writeText = cy.stub(win.navigator.clipboard, "writeText").resolves();
    cy.wrap(writeText).as("copy");
  });
};

describe("Share & import", () => {
  it("copies a share link to the clipboard", () => {
    visitWithClipboard();
    cy.getByTestId("add-input").type("Task to share{enter}");
    cy.getByTestId("share-btn").click();

    cy.getByTestId("toast").should("be.visible");
    cy.get("@copy")
      .should("have.been.calledOnce")
      .its("firstCall.args.0")
      .should("contain", "?data=");
  });

  it("imports a shared link directly into an empty list", () => {
    visitWithClipboard();
    cy.getByTestId("add-input").type("Shared task{enter}");
    cy.getByTestId("share-btn").click();

    cy.get("@copy")
      .its("firstCall.args.0")
      .then((sharedUrl: string) => {
        cy.clearLocalStorage();
        cy.visit(sharedUrl);

        cy.getByTestId("import-modal").should("not.exist");
        cy.getByTestId("todo-item").should("have.length", 1);
        cy.getByTestId("todo-text").should("have.text", "Shared task");
      });
  });

  it("prompts to replace when the local list is not empty", () => {
    visitWithClipboard();
    cy.getByTestId("add-input").type("From link{enter}");
    cy.getByTestId("share-btn").click();

    cy.get("@copy")
      .its("firstCall.args.0")
      .then((sharedUrl: string) => {
        // Replace local data with a different item, then open the link.
        cy.clearLocalStorage();
        visitWithClipboard("/");
        cy.getByTestId("add-input").type("Local item{enter}");

        cy.visit(sharedUrl);
        cy.getByTestId("import-modal").should("be.visible");
        cy.getByTestId("import-replace").click();

        cy.getByTestId("todo-item").should("have.length", 1);
        cy.getByTestId("todo-text").should("have.text", "From link");
      });
  });

  it("merges a shared link with the existing list", () => {
    visitWithClipboard();
    cy.getByTestId("add-input").type("From link{enter}");
    cy.getByTestId("share-btn").click();

    cy.get("@copy")
      .its("firstCall.args.0")
      .then((sharedUrl: string) => {
        cy.clearLocalStorage();
        visitWithClipboard("/");
        cy.getByTestId("add-input").type("Local item{enter}");

        cy.visit(sharedUrl);
        cy.getByTestId("import-modal").should("be.visible");
        cy.getByTestId("import-merge").click();

        cy.getByTestId("todo-item").should("have.length", 2);
        cy.getByTestId("todo-text").should("contain", "Local item");
        cy.getByTestId("todo-text").should("contain", "From link");
      });
  });
});
