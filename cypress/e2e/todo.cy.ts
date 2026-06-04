/// <reference types="cypress" />

describe("Todo — core flows", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("shows the empty state on first load", () => {
    cy.getByTestId("empty-state").should("be.visible");
    cy.getByTestId("todo-item").should("not.exist");
  });

  it("adds a todo and updates the counter", () => {
    cy.getByTestId("add-input").type("Buy milk{enter}");

    cy.getByTestId("todo-item").should("have.length", 1);
    cy.getByTestId("todo-text").should("have.text", "Buy milk");
    cy.getByTestId("counter").should("contain", "0 / 1");
    cy.getByTestId("empty-state").should("not.exist");
  });

  it("adds multiple todos", () => {
    cy.getByTestId("add-input").type("First{enter}");
    cy.getByTestId("add-input").type("Second{enter}");
    cy.getByTestId("add-input").type("Third{enter}");

    cy.getByTestId("todo-item").should("have.length", 3);
    cy.getByTestId("counter").should("contain", "0 / 3");
  });

  it("does not add empty or whitespace-only input", () => {
    cy.getByTestId("add-input").type("   {enter}");
    cy.getByTestId("todo-item").should("not.exist");
    cy.getByTestId("add-submit").should("be.disabled");
  });

  it("toggles a todo as completed", () => {
    cy.getByTestId("add-input").type("Walk the dog{enter}");
    cy.getByTestId("todo-toggle").check();

    cy.getByTestId("todo-item").should("have.class", "todo-item--completed");
    cy.getByTestId("counter").should("contain", "1 / 1");

    cy.getByTestId("todo-toggle").uncheck();
    cy.getByTestId("todo-item").should(
      "not.have.class",
      "todo-item--completed",
    );
    cy.getByTestId("counter").should("contain", "0 / 1");
  });

  it("edits a todo via double click", () => {
    cy.getByTestId("add-input").type("Old text{enter}");
    cy.getByTestId("todo-text").dblclick();

    cy.getByTestId("todo-edit-input")
      .should("be.visible")
      .clear()
      .type("New text{enter}");

    cy.getByTestId("todo-text").should("have.text", "New text");
  });

  it("cancels an edit with Escape", () => {
    cy.getByTestId("add-input").type("Keep me{enter}");
    cy.getByTestId("todo-text").dblclick();
    cy.getByTestId("todo-edit-input").clear().type("Discarded{esc}");

    cy.getByTestId("todo-text").should("have.text", "Keep me");
  });

  it("deletes a todo", () => {
    cy.getByTestId("add-input").type("Delete me{enter}");
    cy.getByTestId("todo-delete").click();

    cy.getByTestId("todo-item").should("not.exist");
    cy.getByTestId("empty-state").should("be.visible");
  });

  it("clears all todos through the confirm modal", () => {
    cy.getByTestId("add-input").type("A{enter}");
    cy.getByTestId("add-input").type("B{enter}");

    cy.getByTestId("clear-btn").click();
    cy.getByTestId("confirm-clear-modal").should("be.visible");
    cy.getByTestId("confirm-clear-confirm").click();

    cy.getByTestId("todo-item").should("not.exist");
    cy.getByTestId("empty-state").should("be.visible");
  });

  it("keeps the list open when clear is cancelled", () => {
    cy.getByTestId("add-input").type("Survivor{enter}");

    cy.getByTestId("clear-btn").click();
    cy.getByTestId("confirm-clear-cancel").click();

    cy.getByTestId("confirm-clear-modal").should("not.exist");
    cy.getByTestId("todo-item").should("have.length", 1);
  });

  it("persists todos across reloads", () => {
    cy.getByTestId("add-input").type("Persisted{enter}");
    cy.reload();

    cy.getByTestId("todo-item").should("have.length", 1);
    cy.getByTestId("todo-text").should("have.text", "Persisted");
  });
});
