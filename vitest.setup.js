// Ajoute les vérifications de Testing Library (toBeInTheDocument…) à Vitest,
// et vide la page après chaque test (sans `globals`, ce n'est pas automatique).
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
