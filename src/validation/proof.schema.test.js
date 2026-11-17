import { describe, expect, it } from "vitest";
import { MAX_PROOF_BYTES, proofInputSchema } from "./proof.schema.js";

const valid = () => ({
  proof: new File(["image"], "capture.png"),
  confirmTransfer: "on",
  lang: "fr",
});

describe("proofInputSchema", () => {
  it("accepte un fichier non vide, une confirmation et les deux langues", () => {
    for (const lang of ["fr", "en"])
      expect(proofInputSchema.safeParse({ ...valid(), lang }).success).toBe(true);
  });
  it.each([null, undefined, 5, "capture.png", {}, new File([], "vide.png")])(
    "refuse un faux fichier %j",
    (proof) => {
      expect(proofInputSchema.safeParse({ ...valid(), proof }).success).toBe(false);
    },
  );
  it("accepte exactement 4 Mio et refuse un octet de plus", () => {
    expect(
      proofInputSchema.safeParse({
        ...valid(),
        proof: new File([new Uint8Array(MAX_PROOF_BYTES)], "max"),
      }).success,
    ).toBe(true);
    const result = proofInputSchema.safeParse({
      ...valid(),
      proof: new File([new Uint8Array(MAX_PROOF_BYTES + 1)], "trop"),
    });
    expect(result.error.issues[0].message).toBe("errors.proofTooLarge");
  });
  it.each([null, true, false, "true", new File(["x"], "x")])(
    "refuse une mauvaise confirmation %j",
    (confirmTransfer) => {
      expect(proofInputSchema.safeParse({ ...valid(), confirmTransfer }).success).toBe(false);
    },
  );
  it.each([null, true, 2, "de", new File(["en"], "lang")])(
    "refuse une mauvaise langue %j",
    (lang) => {
      expect(proofInputSchema.safeParse({ ...valid(), lang }).success).toBe(false);
    },
  );
});
