/**
 * Pre-computed morphological analysis for testing
 * This file contains real SpaCy morphological analysis results
 * to avoid async issues in unit tests
 */

export const realMorphologicalData = {
  // Simple sentence: "Der Hund läuft."
  simple: {
    sentence: "Der Hund läuft.",
    tokens: [
      {
        id: 0,
        word: "Der",
        lemma: "der",
        pos: "DET",
        morph: {
          case: "nominative" as const,
          gender: "masculine" as const,
          number: "singular" as const,
          pronounType: "art" as const
        },
        position: { start: 0, end: 3 }
      },
      {
        id: 1,
        word: "Hund",
        lemma: "Hund",
        pos: "NOUN",
        morph: {
          case: "nominative" as const,
          gender: "masculine" as const,
          number: "singular" as const
        },
        position: { start: 4, end: 8 }
      },
      {
        id: 2,
        word: "läuft",
        lemma: "laufen",
        pos: "VERB",
        morph: {
          mood: "indicative" as const,
          number: "singular" as const,
          person: "3sg" as const,
          tense: "present" as const,
          verbForm: "fin" as const
        },
        position: { start: 9, end: 14 }
      },
      {
        id: 3,
        word: ".",
        lemma: ".",
        pos: "PUNCT",
        morph: {},
        position: { start: 14, end: 15 }
      }
    ]
  },

  // Complex sentence: "Die offiziellen Vertreter erklärten ihre Position."
  complex: {
    sentence: "Die offiziellen Vertreter erklärten ihre Position.",
    tokens: [
      {
        id: 0,
        word: "Die",
        lemma: "der",
        pos: "DET",
        morph: {
          case: "nominative" as const,
          gender: "feminine" as const,
          number: "plural" as const,
          pronounType: "art" as const
        },
        position: { start: 0, end: 3 }
      },
      {
        id: 1,
        word: "offiziellen",
        lemma: "offiziell",
        pos: "ADJ",
        morph: {
          case: "nominative" as const,
          gender: "feminine" as const,
          number: "plural" as const
        },
        position: { start: 4, end: 15 }
      },
      {
        id: 2,
        word: "Vertreter",
        lemma: "Vertreter",
        pos: "NOUN",
        morph: {
          case: "nominative" as const,
          gender: "masculine" as const,
          number: "plural" as const
        },
        position: { start: 16, end: 25 }
      },
      {
        id: 3,
        word: "erklärten",
        lemma: "erklären",
        pos: "VERB",
        morph: {
          mood: "indicative" as const,
          number: "plural" as const,
          person: "3pl" as const,
          tense: "past" as const,
          verbForm: "fin" as const
        },
        position: { start: 26, end: 35 }
      },
      {
        id: 4,
        word: "ihre",
        lemma: "ihr",
        pos: "DET",
        morph: {
          case: "accusative" as const,
          gender: "feminine" as const,
          number: "singular" as const,
          person: "3pl" as const,
          pronounType: "prs" as const
        },
        position: { start: 36, end: 40 }
      },
      {
        id: 5,
        word: "Position",
        lemma: "Position",
        pos: "NOUN",
        morph: {
          case: "accusative" as const,
          gender: "feminine" as const,
          number: "singular" as const
        },
        position: { start: 41, end: 49 }
      },
      {
        id: 6,
        word: ".",
        lemma: ".",
        pos: "PUNCT",
        morph: {},
        position: { start: 49, end: 50 }
      }
    ]
  },

  // Sentence with missing morphological features (simulating SpaCy failure)
  broken: {
    sentence: "Die offiziellen Vertreter erklärten ihre Position.",
    tokens: [
      {
        id: 0,
        word: "Die",
        lemma: "der",
        pos: "DET",
        morph: {}, // Missing morphological features
        position: { start: 0, end: 3 }
      },
      {
        id: 1,
        word: "offiziellen",
        lemma: "offiziell",
        pos: "ADJ",
        morph: {}, // Missing morphological features
        position: { start: 4, end: 15 }
      },
      {
        id: 2,
        word: "Vertreter",
        lemma: "Vertreter",
        pos: "NOUN",
        morph: {}, // Missing morphological features
        position: { start: 16, end: 25 }
      },
      {
        id: 3,
        word: "erklärten",
        lemma: "erklären",
        pos: "VERB",
        morph: {}, // Missing morphological features
        position: { start: 26, end: 35 }
      },
      {
        id: 4,
        word: "ihre",
        lemma: "ihr",
        pos: "DET",
        morph: {}, // Missing morphological features
        position: { start: 36, end: 40 }
      },
      {
        id: 5,
        word: "Position",
        lemma: "Position",
        pos: "NOUN",
        morph: {}, // Missing morphological features
        position: { start: 41, end: 49 }
      },
      {
        id: 6,
        word: ".",
        lemma: ".",
        pos: "PUNCT",
        morph: {},
        position: { start: 49, end: 50 }
      }
    ]
  },

  // Modal verb sentence: "Ich kann Deutsch sprechen."
  modalVerb: {
    sentence: "Ich kann Deutsch sprechen.",
    tokens: [
      {
        id: 0,
        word: "Ich",
        lemma: "ich",
        pos: "PRON",
        morph: {
          case: "nominative" as const,
          number: "singular" as const,
          person: "1sg" as const,
          pronounType: "prs" as const
        },
        position: { start: 0, end: 3 }
      },
      {
        id: 1,
        word: "kann",
        lemma: "können",
        pos: "AUX",
        morph: {
          mood: "indicative" as const,
          number: "singular" as const,
          person: "1sg" as const,
          tense: "present" as const,
          verbForm: "fin" as const
        },
        position: { start: 4, end: 8 }
      },
      {
        id: 2,
        word: "Deutsch",
        lemma: "Deutsch",
        pos: "NOUN",
        morph: {
          case: "accusative" as const,
          gender: "neuter" as const,
          number: "singular" as const
        },
        position: { start: 9, end: 16 }
      },
      {
        id: 3,
        word: "sprechen",
        lemma: "sprechen",
        pos: "VERB",
        morph: {
          verbForm: "inf" as const
        },
        position: { start: 17, end: 25 }
      },
      {
        id: 4,
        word: ".",
        lemma: ".",
        pos: "PUNCT",
        morph: {},
        position: { start: 25, end: 26 }
      }
    ]
  },

  // Passive voice sentence: "Das Buch wird gelesen."
  passiveVoice: {
    sentence: "Das Buch wird gelesen.",
    tokens: [
      {
        id: 0,
        word: "Das",
        lemma: "der",
        pos: "DET",
        morph: {
          case: "nominative" as const,
          gender: "neuter" as const,
          number: "singular" as const,
          pronounType: "art" as const
        },
        position: { start: 0, end: 3 }
      },
      {
        id: 1,
        word: "Buch",
        lemma: "Buch",
        pos: "NOUN",
        morph: {
          case: "nominative" as const,
          gender: "neuter" as const,
          number: "singular" as const
        },
        position: { start: 4, end: 8 }
      },
      {
        id: 2,
        word: "wird",
        lemma: "werden",
        pos: "AUX",
        morph: {
          mood: "indicative" as const,
          number: "singular" as const,
          person: "3sg" as const,
          tense: "present" as const,
          verbForm: "fin" as const
        },
        position: { start: 9, end: 13 }
      },
      {
        id: 3,
        word: "gelesen",
        lemma: "lesen",
        pos: "VERB",
        morph: {
          verbForm: "part" as const
        },
        position: { start: 14, end: 21 }
      },
      {
        id: 4,
        word: ".",
        lemma: ".",
        pos: "PUNCT",
        morph: {},
        position: { start: 21, end: 22 }
      }
    ]
  },

  // Subjunctive sentence: "Ich würde gerne kommen."
  subjunctive: {
    sentence: "Ich würde gerne kommen.",
    tokens: [
      {
        id: 0,
        word: "Ich",
        lemma: "ich",
        pos: "PRON",
        morph: {
          case: "nominative" as const,
          number: "singular" as const,
          person: "1sg" as const,
          pronounType: "prs" as const
        },
        position: { start: 0, end: 3 }
      },
      {
        id: 1,
        word: "würde",
        lemma: "werden",
        pos: "AUX",
        morph: {
          mood: "conditional" as const,
          number: "singular" as const,
          person: "1sg" as const,
          verbForm: "fin" as const
        },
        position: { start: 4, end: 9 }
      },
      {
        id: 2,
        word: "gerne",
        lemma: "gerne",
        pos: "ADV",
        morph: {},
        position: { start: 10, end: 15 }
      },
      {
        id: 3,
        word: "kommen",
        lemma: "kommen",
        pos: "VERB",
        morph: {
          verbForm: "inf" as const
        },
        position: { start: 16, end: 22 }
      },
      {
        id: 4,
        word: ".",
        lemma: ".",
        pos: "PUNCT",
        morph: {},
        position: { start: 22, end: 23 }
      }
    ]
  },

  // Preposition sentence: "Ich gehe mit dem Hund in den Park."
  preposition: {
    sentence: "Ich gehe mit dem Hund in den Park.",
    tokens: [
      {
        id: 0,
        word: "Ich",
        lemma: "ich",
        pos: "PRON",
        morph: {
          case: "nominative" as const,
          number: "singular" as const,
          person: "1sg" as const,
          pronounType: "prs" as const
        },
        position: { start: 0, end: 3 }
      },
      {
        id: 1,
        word: "gehe",
        lemma: "gehen",
        pos: "VERB",
        morph: {
          mood: "indicative" as const,
          number: "singular" as const,
          person: "1sg" as const,
          tense: "present" as const,
          verbForm: "fin" as const
        },
        position: { start: 4, end: 8 }
      },
      {
        id: 2,
        word: "mit",
        lemma: "mit",
        pos: "ADP",
        morph: {},
        position: { start: 9, end: 12 }
      },
      {
        id: 3,
        word: "dem",
        lemma: "der",
        pos: "DET",
        morph: {
          case: "dative" as const,
          gender: "masculine" as const,
          number: "singular" as const,
          pronounType: "art" as const
        },
        position: { start: 13, end: 16 }
      },
      {
        id: 4,
        word: "Hund",
        lemma: "Hund",
        pos: "NOUN",
        morph: {
          case: "dative" as const,
          gender: "masculine" as const,
          number: "singular" as const
        },
        position: { start: 17, end: 21 }
      },
      {
        id: 5,
        word: "in",
        lemma: "in",
        pos: "ADP",
        morph: {},
        position: { start: 22, end: 24 }
      },
      {
        id: 6,
        word: "den",
        lemma: "der",
        pos: "DET",
        morph: {
          case: "accusative" as const,
          gender: "masculine" as const,
          number: "singular" as const,
          pronounType: "art" as const
        },
        position: { start: 25, end: 28 }
      },
      {
        id: 7,
        word: "Park",
        lemma: "Park",
        pos: "NOUN",
        morph: {
          case: "accusative" as const,
          gender: "masculine" as const,
          number: "singular" as const
        },
        position: { start: 29, end: 33 }
      },
      {
        id: 8,
        word: ".",
        lemma: ".",
        pos: "PUNCT",
        morph: {},
        position: { start: 33, end: 34 }
      }
    ]
  },

  // Word order sentence: "Heute geht er ins Kino."
  wordOrder: {
    sentence: "Heute geht er ins Kino.",
    tokens: [
      {
        id: 0,
        word: "Heute",
        lemma: "heute",
        pos: "ADV",
        morph: {},
        position: { start: 0, end: 5 }
      },
      {
        id: 1,
        word: "geht",
        lemma: "gehen",
        pos: "VERB",
        morph: {
          mood: "indicative" as const,
          number: "singular" as const,
          person: "3sg" as const,
          tense: "present" as const,
          verbForm: "fin" as const
        },
        position: { start: 6, end: 10 }
      },
      {
        id: 2,
        word: "er",
        lemma: "er",
        pos: "PRON",
        morph: {
          case: "nominative" as const,
          gender: "masculine" as const,
          number: "singular" as const,
          person: "3sg" as const,
          pronounType: "prs" as const
        },
        position: { start: 11, end: 13 }
      },
      {
        id: 3,
        word: "ins",
        lemma: "in",
        pos: "ADP",
        morph: {},
        position: { start: 14, end: 17 }
      },
      {
        id: 4,
        word: "Kino",
        lemma: "Kino",
        pos: "NOUN",
        morph: {
          case: "accusative" as const,
          gender: "neuter" as const,
          number: "singular" as const
        },
        position: { start: 18, end: 22 }
      },
      {
        id: 5,
        word: ".",
        lemma: ".",
        pos: "PUNCT",
        morph: {},
        position: { start: 22, end: 23 }
      }
    ]
  }
};