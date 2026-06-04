/// <reference types="cypress" />

describe("Language switch", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("defaults to Ukrainian", () => {
    cy.getByTestId("lang-ua").should("have.class", "lang-switch__btn--active");
    cy.getByTestId("add-submit").should("contain", "Додати");
    cy.contains(".app__subtitle", "Організуй свій день");
  });

  it("switches the interface to English", () => {
    cy.getByTestId("lang-en").click();

    cy.getByTestId("lang-en").should("have.class", "lang-switch__btn--active");
    cy.getByTestId("lang-ua").should(
      "not.have.class",
      "lang-switch__btn--active",
    );
    cy.getByTestId("add-submit").should("contain", "Add");
    cy.contains(".app__subtitle", "Organize your day");
  });

  it("remembers the selected language across reloads", () => {
    cy.getByTestId("lang-en").click();
    cy.reload();

    cy.getByTestId("lang-en").should("have.class", "lang-switch__btn--active");
    cy.getByTestId("add-submit").should("contain", "Add");
  });
});
