import { describe, expect, it } from "vitest";
import { translate } from "./translate.js";

const dictionary = { home: { title: "Dîner", seatsLeft: "{count} places restantes" } };

describe("translate", () => {
  it("lit une clé imbriquée", () => {
    expect(translate(dictionary, "home.title")).toBe("Dîner");
  });

  it("insère les valeurs entre accolades", () => {
    expect(translate(dictionary, "home.seatsLeft", { count: 12 })).toBe("12 places restantes");
  });

  it("laisse un repère sans valeur tel quel", () => {
    expect(translate(dictionary, "home.seatsLeft")).toBe("{count} places restantes");
  });

  it("renvoie la clé quand elle n'existe pas", () => {
    expect(translate(dictionary, "home.absent")).toBe("home.absent");
  });

  it("renvoie la clé quand elle désigne un groupe et non un texte", () => {
    expect(translate(dictionary, "home")).toBe("home");
  });
});
