/**
 * Unit Tests for AgreementDetector (Final Production Version)
 */

import { AgreementDetector } from "../../src/services/grammarEngine/detectors/B1/agreementDetector";
import { createMockSentence, createMockToken } from "../testUtils";

describe("AgreementDetector", () => {
  let detector: AgreementDetector;

  beforeEach(() => {
    detector = new AgreementDetector();
  });

  // -------------------------------------------------------------
  // BASIC: correct NP agreement
  // -------------------------------------------------------------
  it("detects correct Masc-Nom-Sing agreement (Der große Mann)", () => {
    const tokens = [
      createMockToken("Der", "der", "DET", {
        dep: "det",
        head: "Mann",
        morph: { Case: "Nom", Gender: "Masc", Number: "Sing" },
      }),
      createMockToken("große", "groß", "ADJ", {
        dep: "amod",
        head: "Mann",
        morph: { Case: "Nom", Gender: "Masc", Number: "Sing" },
      }),
      createMockToken("Mann", "Mann", "NOUN", {
        dep: "nsubj",
        head: "ist",
        morph: { Case: "Nom", Gender: "Masc", Number: "Sing" },
      }),
      createMockToken("ist", "sein", "VERB"),
      createMockToken(".", ".", "PUNCT"),
    ];

    const sentence = createMockSentence("Der große Mann ist.", tokens);
    const results = detector.detect(sentence);

    expect(results.length).toBe(0); // no errors
  });

  it("detects correct Fem-Nom-Sing agreement (Die schöne Frau)", () => {
    const tokens = [
      createMockToken("Die", "die", "DET", {
        dep: "det",
        head: "Frau",
        morph: { Case: "Nom", Gender: "Fem", Number: "Sing" },
      }),
      createMockToken("schöne", "schön", "ADJ", {
        dep: "amod",
        head: "Frau",
        morph: { Case: "Nom", Gender: "Fem", Number: "Sing" },
      }),
      createMockToken("Frau", "Frau", "NOUN", {
        dep: "nsubj",
        head: "liest",
        morph: { Case: "Nom", Gender: "Fem", Number: "Sing" },
      }),
      createMockToken("liest", "lesen", "VERB"),
    ];

    const sentence = createMockSentence("Die schöne Frau liest.", tokens);
    const results = detector.detect(sentence);

    expect(results.length).toBe(0);
  });

  it("detects correct Neut-Nom-Sing agreement (Das kleine Kind)", () => {
    const tokens = [
      createMockToken("Das", "das", "DET", {
        dep: "det",
        head: "Kind",
        morph: { Case: "Nom", Gender: "Neut", Number: "Sing" },
      }),
      createMockToken("kleine", "klein", "ADJ", {
        dep: "amod",
        head: "Kind",
        morph: { Case: "Nom", Gender: "Neut", Number: "Sing" },
      }),
      createMockToken("Kind", "Kind", "NOUN", {
        dep: "nsubj",
        head: "spielt",
        morph: { Case: "Nom", Gender: "Neut", Number: "Sing" },
      }),
      createMockToken("spielt", "spielen", "VERB"),
    ];

    const sentence = createMockSentence("Das kleine Kind spielt.", tokens);
    const results = detector.detect(sentence);

    expect(results.length).toBe(0);
  });

  // -------------------------------------------------------------
  // DATIVE / ACC / PLURAL
  // -------------------------------------------------------------
  it("detects correct agreement in Dative NP (dem großen Mann)", () => {
    const tokens = [
      createMockToken("dem", "der", "DET", {
        dep: "det",
        head: "Mann",
        morph: { Case: "Dat", Gender: "Masc", Number: "Sing" },
      }),
      createMockToken("großen", "groß", "ADJ", {
        dep: "amod",
        head: "Mann",
        morph: { Case: "Dat", Gender: "Masc", Number: "Sing" },
      }),
      createMockToken("Mann", "Mann", "NOUN", {
        dep: "obl",
        head: "gebe",
        morph: { Case: "Dat", Gender: "Masc", Number: "Sing" },
      }),
      createMockToken("gebe", "geben", "VERB"),
    ];

    const sentence = createMockSentence("Ich gebe dem großen Mann.", tokens);
    const results = detector.detect(sentence);

    expect(results.length).toBe(0);
  });

  it("detects correct plural agreement (Die großen Männer)", () => {
    const tokens = [
      createMockToken("Die", "die", "DET", {
        dep: "det",
        head: "Männer",
        morph: { Case: "Nom", Number: "Plur" }, // plural → no gender
      }),
      createMockToken("großen", "groß", "ADJ", {
        dep: "amod",
        head: "Männer",
        morph: { Case: "Nom", Number: "Plur" },
      }),
      createMockToken("Männer", "Mann", "NOUN", {
        dep: "nsubj",
        head: "sind",
        morph: { Case: "Nom", Number: "Plur" },
      }),
      createMockToken("sind", "sein", "AUX"),
    ];

    const sentence = createMockSentence("Die großen Männer sind hier.", tokens);
    const results = detector.detect(sentence);

    expect(results.length).toBe(0);
  });

  // -------------------------------------------------------------
  // ERROR AGREEMENT
  // -------------------------------------------------------------
  it("detects incorrect gender (Der große Frau → error)", () => {
    const tokens = [
      createMockToken("Der", "der", "DET", {
        dep: "det",
        head: "Frau",
        morph: { Case: "Nom", Gender: "Masc", Number: "Sing" },
      }),
      createMockToken("große", "groß", "ADJ", {
        dep: "amod",
        head: "Frau",
        morph: { Case: "Nom", Gender: "Masc", Number: "Sing" },
      }),
      createMockToken("Frau", "Frau", "NOUN", {
        dep: "nsubj",
        head: "kommt",
        morph: { Case: "Nom", Gender: "Fem", Number: "Sing" },
      }),
      createMockToken("kommt", "kommen", "VERB"),
    ];

    const sentence = createMockSentence("Der große Frau kommt.", tokens);
    const results = detector.detect(sentence);

    expect(results.length).toBe(1);
    expect(results[0].details.state).toBe("error");
  });

  // -------------------------------------------------------------
  // UNCERTAIN (missing morph)
  // -------------------------------------------------------------
  it("detects uncertain when morph is missing (die alte Mann)", () => {
    const tokens = [
      createMockToken("die", "die", "DET", {
        dep: "det",
        head: "Mann",
        morph: { Case: "Nom", Gender: "Fem", Number: "Sing" },
      }),
      createMockToken("alte", "alt", "ADJ", {
        dep: "amod",
        head: "Mann",
        morph: {}, // missing all features
      }),
      createMockToken("Mann", "Mann", "NOUN", {
        dep: "nsubj",
        head: "ist",
        morph: { Case: "Nom", Gender: "Masc", Number: "Sing" },
      }),
      createMockToken("ist", "sein", "VERB"),
    ];

    const sentence = createMockSentence("die alte Mann ist.", tokens);
    const results = detector.detect(sentence);

    expect(results.length).toBe(1);
    expect(results[0].details.state).toBe("uncertain");
    expect(results[0].details.missing.length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------
  // SKIP PROPER NOUN & NAMED ENTITIES
  // -------------------------------------------------------------
  it("skips NP with PROPN", () => {
    const tokens = [
      createMockToken("die", "die", "DET", {
        dep: "det",
        head: "Polizei",
        morph: { Case: "Nom", Gender: "Fem", Number: "Sing" },
      }),
      createMockToken("berliner", "berliner", "ADJ", {
        dep: "amod",
        head: "Polizei",
        morph: { Case: "Nom", Gender: "Fem", Number: "Sing" },
      }),
      createMockToken("Polizei", "Polizei", "PROPN", {
        dep: "nsubj",
        head: "kommt",
        entity_type: "ORG",
      }),
      createMockToken("kommt", "kommen", "VERB"),
    ];

    const sentence = createMockSentence("Die berliner Polizei kommt.", tokens);
    const results = detector.detect(sentence);

    expect(results.length).toBe(0);
  });

  // -------------------------------------------------------------
  // AMOD CHAIN (große, alte, schöne Männer)
  // -------------------------------------------------------------
  it("handles amod chains correctly", () => {
    const tokens = [
      createMockToken("die", "die", "DET", {
        dep: "det",
        head: "Männer",
        morph: { Case: "Nom", Number: "Plur" },
      }),
      createMockToken("großen", "groß", "ADJ", {
        dep: "amod",
        head: "Männer",
        morph: { Case: "Nom", Number: "Plur" },
      }),
      createMockToken("alten", "alt", "ADJ", {
        dep: "amod",
        head: "Männer",
        morph: { Case: "Nom", Number: "Plur" },
      }),
      createMockToken("Männer", "Mann", "NOUN", {
        dep: "nsubj",
        head: "singen",
        morph: { Case: "Nom", Number: "Plur" },
      }),
      createMockToken("singen", "singen", "VERB"),
    ];

    const sentence = createMockSentence("Die großen alten Männer singen.", tokens);
    const results = detector.detect(sentence);

    expect(results.length).toBe(0);
  });

  // -------------------------------------------------------------
  // CONJ (große und alte Männer)
  // -------------------------------------------------------------
  it("handles conj modifiers correctly", () => {
    const tokens = [
      createMockToken("die", "die", "DET", {
        dep: "det",
        head: "Männer",
        morph: { Case: "Nom", Number: "Plur" },
      }),
      createMockToken("großen", "groß", "ADJ", {
        dep: "amod",
        head: "Männer",
        morph: { Case: "Nom", Number: "Plur" },
      }),
      createMockToken("und", "und", "CONJ", { dep: "conj", head: "großen" }),
      createMockToken("alten", "alt", "ADJ", {
        dep: "amod",
        head: "Männer",
        morph: { Case: "Nom", Number: "Plur" },
      }),
      createMockToken("Männer", "Mann", "NOUN", {
        dep: "nsubj",
        head: "kommen",
        morph: { Case: "Nom", Number: "Plur" },
      }),
      createMockToken("kommen", "kommen", "VERB"),
    ];

    const sentence = createMockSentence("Die großen und alten Männer kommen.", tokens);
    const results = detector.detect(sentence);

    expect(results.length).toBe(0);
  });

  // -------------------------------------------------------------
  // NESTED NP (appos, nmod)
  // -------------------------------------------------------------
  it("handles nested NP (Der Mann, der Arzt)", () => {
    const tokens = [
      createMockToken("Der", "der", "DET", {
        dep: "det",
        head: "Mann",
        morph: { Case: "Nom", Gender: "Masc", Number: "Sing" },
      }),
      createMockToken("Mann", "Mann", "NOUN", {
        dep: "nsubj",
        head: "ist",
        morph: { Case: "Nom", Gender: "Masc", Number: "Sing" },
      }),

      // nested NP: "der Arzt"
      createMockToken("der", "der", "DET", {
        dep: "det",
        head: "Arzt",
        morph: { Case: "Nom", Gender: "Masc", Number: "Sing" },
      }),
      createMockToken("Arzt", "Arzt", "NOUN", {
        dep: "appos",
        head: "Mann",
        morph: { Case: "Nom", Gender: "Masc", Number: "Sing" },
      }),

      createMockToken("ist", "sein", "VERB"),
    ];

    const sentence = createMockSentence("Der Mann, der Arzt, ist.", tokens);
    const results = detector.detect(sentence);

    expect(results.length).toBe(0);
  });
});
