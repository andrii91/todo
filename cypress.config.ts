import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    // Vite serves the app under its configured base ("/todo/dist/").
    baseUrl: "http://localhost:4173/todo/dist/",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.ts",
    video: false,
  },
});
