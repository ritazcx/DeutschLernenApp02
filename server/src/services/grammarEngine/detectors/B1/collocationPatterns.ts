/**
 * Collocation DSL
 * Each entry describes a canonical collocation to detect.
 * Extended to support Fehler machen / aufstehen / anfangen
 */

// Keep this file as the canonical raw pattern list. The loader normalizes
// depSignature and fills in defaults so patterns here can be minimal.


const RAW = [
{
  "id": "sich-freuen-auf",
  "type": "reflexive-prep",
  "verb": {
    "lemma": "freuen",
    "pos": "VERB"
  },
  "reflexive": {
    "required": true,
    "dep": [
      "obj",
      "iobj",
      "refl",
      "oa"
    ]
  },
  "prep": {
    "lemma": "auf",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "iobj",
      "obl",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "refl",
      "dobj",
      "iobj",
      "oa"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=freuen",
    "prep:lemma=auf",
    "reflexive:required"
  ],
  "shouldMatch": [
    "verbDeps include obj or obl",
    "prepDeps include case"
  ],
  "meaning": "to look forward to something",
  "examples": [
    "Ich freue mich auf das Konzert."
  ]
},

{
  "id": "sich-interessieren-fuer",
  "type": "reflexive-prep",
  "verb": {
    "lemma": "interessieren",
    "pos": "VERB"
  },
  "reflexive": {
    "required": true,
    "dep": [
      "obj",
      "iobj",
      "refl",
      "oa"
    ]
  },
  "prep": {
    "lemma": "für",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "iobj",
      "obl",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "refl",
      "dobj",
      "oa",
      "iobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=interessieren",
    "prep:lemma=für",
    "reflexive:required"
  ],
  "shouldMatch": [
    "verbDeps include obj or obl",
    "prepDeps include case"
  ],
  "meaning": "to be interested in something",
  "examples": [
    "Ich interessiere mich für Kunst."
  ]
},

{
  "id": "sich-kümmern-um",
  "type": "reflexive-prep",
  "verb": {
    "lemma": "kümmern",
    "pos": "VERB"
  },
  "reflexive": {
    "required": true,
    "dep": [
      "obj",
      "iobj",
      "refl"
    ]
  },
  "prep": {
    "lemma": "um",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "iobj",
      "obl",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "refl",
      "dobj",
      "oa",
      "iobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=kümmern",
    "prep:lemma=um",
    "reflexive:required"
  ],
  "shouldMatch": [
    "verbDeps include obj or obl",
    "prepDeps include case"
  ],
  "meaning": "to take care of something",
  "examples": [
    "Ich kümmere mich um das Problem."
  ]
},

{
  "id": "sich-erinnern-an",
  "type": "reflexive-prep",
  "verb": {
    "lemma": "erinnern",
    "pos": "VERB"
  },
  "reflexive": {
    "required": true,
    "dep": [
      "obj",
      "iobj",
      "refl"
    ]
  },
  "prep": {
    "lemma": "an",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 5,
    "verbDeps": [
      "obj",
      "iobj",
      "obl",
      "advmod",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "refl",
      "dobj",
      "iobj",
      "oa"
    ],
    "prepDeps": [
      "case",
      "obl",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "mustMatchDeps": [
      "refl",
      "obj"
    ],
    "shouldMatchDeps": [
      "case",
      "obl",
      "nmod"
    ],
    "headRelation": "prep->noun",
    "normalizeVerbForms": true,
    "collapseAux": true,
    "allowParticiple": true
  },
  "mustMatch": [
    "verb:lemma=erinnern",
    "prep:lemma=an",
    "reflexive:required"
  ],
  "shouldMatch": [
    "verbDeps include obj or obl",
    "prepDeps include case or obl",
    "reflexiveDeps include refl"
  ],
  "meaning": "to remember something",
  "examples": [
    "Ich erinnere mich an das Gespräch."
  ]
},

{
  "id": "warten-auf",
  "type": "verb-prep",
  "verb": {
    "lemma": "warten",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": {
    "lemma": "auf",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obl",
      "obj",
      "advmod",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=warten",
    "prep:lemma=auf"
  ],
  "shouldMatch": [
    "verbDeps include obl or obj",
    "prepDeps include case"
  ],
  "meaning": "to wait for something",
  "examples": [
    "Ich warte auf dich."
  ]
},

{
  "id": "denken-an",
  "type": "verb-prep",
  "verb": {
    "lemma": "denken",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": {
    "lemma": "an",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obl",
      "obj",
      "advmod",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=denken",
    "prep:lemma=an"
  ],
  "shouldMatch": [
    "verbDeps include obl or obj",
    "prepDeps include case"
  ],
  "meaning": "to think of someone or something",
  "examples": [
    "Ich denke an dich."
  ]
},

{
  "id": "halten-von",
  "type": "verb-prep",
  "verb": {
    "lemma": "halten",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": {
    "lemma": "von",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obl",
      "obj",
      "advmod",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=halten",
    "prep:lemma=von"
  ],
  "shouldMatch": [
    "verbDeps include obl or obj",
    "prepDeps include case"
  ],
  "meaning": "to have an opinion about something",
  "examples": [
    "Was hältst du von dem Plan?"
  ]
},

{
  "id": "angst-haben",
  "type": "verb-noun",
  "verb": {
    "lemma": "haben",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": {
    "lemma": "Angst",
    "pos": "NOUN"
  },
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "dobj",
      "obl",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "noun->verb"
  },
  "mustMatch": [
    "verb:lemma=haben",
    "noun:lemma=Angst"
  ],
  "shouldMatch": [
    "nounDeps include obj",
    "verbDeps include obj"
  ],
  "meaning": "to be afraid",
  "examples": [
    "Ich habe Angst."
  ]
},

{
  "id": "hunger-haben",
  "type": "verb-noun",
  "verb": {
    "lemma": "haben",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": {
    "lemma": "Hunger",
    "pos": "NOUN"
  },
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "dobj",
      "obl",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "noun->verb"
  },
  "mustMatch": [
    "verb:lemma=haben",
    "noun:lemma=Hunger"
  ],
  "shouldMatch": [
    "nounDeps include obj",
    "verbDeps include obj"
  ],
  "meaning": "to be hungry",
  "examples": [
    "Ich habe Hunger."
  ]
},

{
  "id": "urlaub-machen",
  "type": "verb-noun",
  "verb": {
    "lemma": "machen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": {
    "lemma": "Urlaub",
    "pos": "NOUN"
  },
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "dobj",
      "obl",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "noun->verb"
  },
  "mustMatch": [
    "verb:lemma=machen",
    "noun:lemma=Urlaub"
  ],
  "shouldMatch": [
    "nounDeps include obj",
    "verbDeps include obj"
  ],
  "meaning": "to take a vacation",
  "examples": [
    "Wir machen Urlaub."
  ]
},

{
  "id": "vorbereiten-auf",
  "type": "reflexive-prep",
  "verb": {
    "lemma": "vorbereiten",
    "pos": "VERB"
  },
  "reflexive": {
    "required": true,
    "dep": [
      "obj",
      "iobj",
      "refl"
    ]
  },
  "prep": {
    "lemma": "auf",
    "dep": "case"
  },
  "noun": null,
  "separable": {
    "particle": "vor"
  },
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "iobj",
      "obl",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "refl",
      "dobj",
      "oa",
      "iobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=vorbereiten",
    "prep:lemma=auf",
    "reflexive:required",
    "separable:particle=vor"
  ],
  "shouldMatch": [
    "verbDeps include obj or obl",
    "prepDeps include case"
  ],
  "meaning": "to prepare oneself for something",
  "examples": [
    "Sie bereitet sich auf die Prüfung vor."
  ]
},

{
  "id": "fehler-machen",
  "type": "verb-noun",
  "verb": {
    "lemma": "machen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": {
    "lemma": "Fehler",
    "pos": "NOUN"
  },
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "dobj",
      "obl",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "noun->verb"
  },
  "mustMatch": [
    "verb:lemma=machen",
    "noun:lemma=Fehler"
  ],
  "shouldMatch": [
    "nounDeps include obj",
    "verbDeps include obj"
  ],
  "meaning": "to make a mistake",
  "examples": [
    "Du machst einen Fehler.",
    "Ich habe einen Fehler gemacht."
  ]
},

{
  "id": "aufstehen",
  "type": "separable",
  "verb": {
    "lemma": "stehen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": null,
  "separable": {
    "particle": "auf"
  },
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "aux",
      "advmod",
      "obj",
      "obl",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "particle->verb"
  },
  "mustMatch": [
    "verb:lemma=stehen",
    "separable:particle=auf"
  ],
  "shouldMatch": [
    "particle separated in surface order"
  ],
  "meaning": "to get up",
  "examples": [
    "Ich stehe früh auf.",
    "Er steht jeden Tag um sechs auf."
  ]
},

{
  "id": "anfangen",
  "type": "separable",
  "verb": {
    "lemma": "fangen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": null,
  "separable": {
    "particle": "an"
  },
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "aux",
      "advmod",
      "obj",
      "obl",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "particle->verb"
  },
  "mustMatch": [
    "verb:lemma=fangen",
    "separable:particle=an"
  ],
  "shouldMatch": [
    "particle separated in surface order"
  ],
  "meaning": "to begin or start",
  "examples": [
    "Ich muss mit der Arbeit anfangen.",
    "Wir fangen sofort an."
  ]
},

{
  "id": "sich-bewerben-um",
  "type": "reflexive-prep",
  "verb": {
    "lemma": "bewerben",
    "pos": "VERB"
  },
  "reflexive": {
    "required": true,
    "dep": [
      "obj",
      "iobj",
      "refl",
      "oa"
    ]
  },
  "prep": {
    "lemma": "um",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "iobj",
      "obl",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "refl",
      "dobj",
      "oa",
      "iobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=bewerben",
    "prep:lemma=um",
    "reflexive:required"
  ],
  "shouldMatch": [
    "verbDeps include obj or obl",
    "prepDeps include case"
  ],
  "meaning": "to apply for something",
  "examples": [
    "Ich bewerbe mich um den Job."
  ]
},

{
  "id": "sich-beschäftigen-mit",
  "type": "reflexive-prep",
  "verb": {
    "lemma": "beschäftigen",
    "pos": "VERB"
  },
  "reflexive": {
    "required": true,
    "dep": [
      "obj",
      "iobj",
      "refl",
      "oa"
    ]
  },
  "prep": {
    "lemma": "mit",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "iobj",
      "obl",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "refl",
      "dobj",
      "oa",
      "iobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=beschäftigen",
    "prep:lemma=mit",
    "reflexive:required"
  ],
  "shouldMatch": [
    "verbDeps include obj or obl",
    "prepDeps include case"
  ],
  "meaning": "to occupy oneself with something",
  "examples": [
    "Ich beschäftige mich mit dem Thema."
  ]
},

{
  "id": "sich-verlieben-in",
  "type": "reflexive-prep",
  "verb": {
    "lemma": "verlieben",
    "pos": "VERB"
  },
  "reflexive": {
    "required": true,
    "dep": [
      "obj",
      "iobj",
      "refl",
      "oa"
    ]
  },
  "prep": {
    "lemma": "in",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "iobj",
      "obl",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "refl",
      "dobj",
      "oa",
      "iobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=verlieben",
    "prep:lemma=in",
    "reflexive:required"
  ],
  "shouldMatch": [
    "verbDeps include obj or obl",
    "prepDeps include case"
  ],
  "meaning": "to fall in love with someone",
  "examples": [
    "Er hat sich in sie verliebt."
  ]
},

{
  "id": "sich-melden-bei",
  "type": "reflexive-prep",
  "verb": {
    "lemma": "melden",
    "pos": "VERB"
  },
  "reflexive": {
    "required": true,
    "dep": [
      "obj",
      "iobj",
      "refl",
      "oa"
    ]
  },
  "prep": {
    "lemma": "bei",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "iobj",
      "obl",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "refl",
      "dobj",
      "oa",
      "iobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=melden",
    "prep:lemma=bei",
    "reflexive:required"
  ],
  "shouldMatch": [
    "verbDeps include obj or obl",
    "prepDeps include case"
  ],
  "meaning": "to contact someone",
  "examples": [
    "Meldest du dich bei mir?"
  ]
},

{
  "id": "sich-sehnen-nach",
  "type": "reflexive-prep",
  "verb": {
    "lemma": "sehnen",
    "pos": "VERB"
  },
  "reflexive": {
    "required": true,
    "dep": [
      "obj",
      "iobj",
      "refl",
      "oa"
    ]
  },
  "prep": {
    "lemma": "nach",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "iobj",
      "obl",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "refl",
      "dobj",
      "iobj",
      "oa"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=sehnen",
    "prep:lemma=nach",
    "reflexive:required"
  ],
  "shouldMatch": [
    "verbDeps include obj or obl",
    "prepDeps include case"
  ],
  "meaning": "to long for something",
  "examples": [
    "Ich sehne mich nach Ruhe."
  ]
},

{
  "id": "sich-trennen-von",
  "type": "reflexive-prep",
  "verb": {
    "lemma": "trennen",
    "pos": "VERB"
  },
  "reflexive": {
    "required": true,
    "dep": [
      "obj",
      "iobj",
      "refl",
      "oa"
    ]
  },
  "prep": {
    "lemma": "von",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "iobj",
      "obl",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "refl",
      "dobj",
      "iobj",
      "oa"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=trennen",
    "prep:lemma=von",
    "reflexive:required"
  ],
  "shouldMatch": [
    "verbDeps include obj or obl",
    "prepDeps include case"
  ],
  "meaning": "to separate from someone",
  "examples": [
    "Sie trennt sich von ihrem Mann."
  ]
},

{
  "id": "sich-ärgern-über",
  "type": "reflexive-prep",
  "verb": {
    "lemma": "ärgern",
    "pos": "VERB"
  },
  "reflexive": {
    "required": true,
    "dep": [
      "obj",
      "iobj",
      "refl",
      "oa"
    ]
  },
  "prep": {
    "lemma": "über",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "iobj",
      "obl",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "refl",
      "dobj",
      "iobj",
      "oa"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=ärgern",
    "prep:lemma=über",
    "reflexive:required"
  ],
  "shouldMatch": [
    "verbDeps include obj or obl",
    "prepDeps include case"
  ],
  "meaning": "to be annoyed about something",
  "examples": [
    "Ich ärgere mich über das Wetter."
  ]
},

{
  "id": "sprechen-über",
  "type": "verb-prep",
  "verb": {
    "lemma": "sprechen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": {
    "lemma": "über",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obl",
      "obj",
      "advmod",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=sprechen",
    "prep:lemma=über"
  ],
  "shouldMatch": [
    "verbDeps include obl or obj",
    "prepDeps include case"
  ],
  "meaning": "to talk about something",
  "examples": [
    "Wir sprechen über das Problem."
  ]
},

{
  "id": "sprechen-mit",
  "type": "verb-prep",
  "verb": {
    "lemma": "sprechen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": {
    "lemma": "mit",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obl",
      "obj",
      "advmod",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=sprechen",
    "prep:lemma=mit"
  ],
  "shouldMatch": [
    "verbDeps include obl or obj",
    "prepDeps include case"
  ],
  "meaning": "to speak with someone",
  "examples": [
    "Ich spreche mit ihm."
  ]
},

{
  "id": "hoffen-auf",
  "type": "verb-prep",
  "verb": {
    "lemma": "hoffen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": {
    "lemma": "auf",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obl",
      "obj",
      "advmod",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=hoffen",
    "prep:lemma=auf"
  ],
  "shouldMatch": [
    "verbDeps include obl or obj",
    "prepDeps include case"
  ],
  "meaning": "to hope for something",
  "examples": [
    "Ich hoffe auf gutes Wetter."
  ]
},

{
  "id": "verzichten-auf",
  "type": "verb-prep",
  "verb": {
    "lemma": "verzichten",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": {
    "lemma": "auf",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obl",
      "obj",
      "advmod",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=verzichten",
    "prep:lemma=auf"
  ],
  "shouldMatch": [
    "verbDeps include obl or obj",
    "prepDeps include case"
  ],
  "meaning": "to give up something",
  "examples": [
    "Ich verzichte auf Fleisch."
  ]
},

{
  "id": "abhängen-von",
  "type": "verb-prep",
  "verb": {
    "lemma": "abhängen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": {
    "lemma": "von",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obl",
      "obj",
      "advmod",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=abhängen",
    "prep:lemma=von"
  ],
  "shouldMatch": [
    "verbDeps include obl or obj",
    "prepDeps include case"
  ],
  "meaning": "to depend on something",
  "examples": [
    "Es hängt von dir ab."
  ]
},

{
  "id": "bestehen-aus",
  "type": "verb-prep",
  "verb": {
    "lemma": "bestehen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": {
    "lemma": "aus",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obl",
      "obj",
      "advmod",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=bestehen",
    "prep:lemma=aus"
  ],
  "shouldMatch": [
    "verbDeps include obl or obj",
    "prepDeps include case"
  ],
  "meaning": "to consist of something",
  "examples": [
    "Das Team besteht aus fünf Personen."
  ]
},

{
  "id": "gelten-als",
  "type": "verb-prep",
  "verb": {
    "lemma": "gelten",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": {
    "lemma": "als",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obl",
      "obj",
      "advmod",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=gelten",
    "prep:lemma=als"
  ],
  "shouldMatch": [
    "verbDeps include obl or obj",
    "prepDeps include case"
  ],
  "meaning": "to be regarded as something",
  "examples": [
    "Er gilt als Experte."
  ]
},

{
  "id": "leiden-an",
  "type": "verb-prep",
  "verb": {
    "lemma": "leiden",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": {
    "lemma": "an",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obl",
      "obj",
      "advmod",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=leiden",
    "prep:lemma=an"
  ],
  "shouldMatch": [
    "verbDeps include obl or obj",
    "prepDeps include case"
  ],
  "meaning": "to suffer from something",
  "examples": [
    "Er leidet an einer Krankheit."
  ]
},

{
  "id": "teilnehmen-an",
  "type": "verb-prep",
  "verb": {
    "lemma": "teilnehmen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": {
    "lemma": "an",
    "dep": "case"
  },
  "noun": null,
  "separable": {
    "particle": "teil"
  },
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obl",
      "obj",
      "advmod",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=teilnehmen",
    "prep:lemma=an",
    "separable:particle=teil"
  ],
  "shouldMatch": [
    "verbDeps include obl or obj",
    "prepDeps include case"
  ],
  "meaning": "to participate in something",
  "examples": [
    "Ich nehme an der Sitzung teil."
  ]
},

{
  "id": "sich-verlassen-auf",
  "type": "reflexive-prep",
  "verb": {
    "lemma": "verlassen",
    "pos": "VERB"
  },
  "reflexive": {
    "required": true,
    "dep": [
      "obj",
      "iobj",
      "refl",
      "oa"
    ]
  },
  "prep": {
    "lemma": "auf",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "iobj",
      "obl",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "refl",
      "dobj",
      "oa",
      "iobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=verlassen",
    "prep:lemma=auf",
    "reflexive:required"
  ],
  "shouldMatch": [
    "verbDeps include obj or obl",
    "prepDeps include case"
  ],
  "meaning": "to rely on someone/something",
  "examples": [
    "Ich verlasse mich auf dich."
  ]
},

{
  "id": "gehören-zu",
  "type": "verb-prep",
  "verb": {
    "lemma": "gehören",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": {
    "lemma": "zu",
    "dep": "case"
  },
  "noun": null,
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obl",
      "obj",
      "advmod",
      "dobj",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "prep->noun"
  },
  "mustMatch": [
    "verb:lemma=gehören",
    "prep:lemma=zu"
  ],
  "shouldMatch": [
    "verbDeps include obl or obj",
    "prepDeps include case"
  ],
  "meaning": "to belong to something",
  "examples": [
    "Das gehört zu meinen Aufgaben."
  ]
},

{
  "id": "eine-entscheidung-treffen",
  "type": "verb-noun",
  "verb": {
    "lemma": "treffen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": {
    "lemma": "Entscheidung",
    "pos": "NOUN"
  },
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "dobj",
      "obl",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "noun->verb"
  },
  "mustMatch": [
    "verb:lemma=treffen",
    "noun:lemma=Entscheidung"
  ],
  "shouldMatch": [
    "nounDeps include obj",
    "verbDeps include obj"
  ],
  "meaning": "to make a decision",
  "examples": [
    "Ich treffe eine Entscheidung."
  ]
},

{
  "id": "ein-gespraech-fuehren",
  "type": "verb-noun",
  "verb": {
    "lemma": "führen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": {
    "lemma": "Gespräch",
    "pos": "NOUN"
  },
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "dobj",
      "obl",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "noun->verb"
  },
  "mustMatch": [
    "verb:lemma=führen",
    "noun:lemma=Gespräch"
  ],
  "shouldMatch": [
    "nounDeps include obj",
    "verbDeps include obj"
  ],
  "meaning": "to have a conversation",
  "examples": [
    "Wir führen ein Gespräch."
  ]
},

{
  "id": "in-frage-stellen",
  "type": "verb-noun",
  "verb": {
    "lemma": "stellen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": {
    "lemma": "Frage",
    "pos": "NOUN"
  },
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "dobj",
      "obl",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "noun->verb"
  },
  "mustMatch": [
    "verb:lemma=stellen",
    "noun:lemma=Frage"
  ],
  "shouldMatch": [
    "nounDeps include obj",
    "verbDeps include obj"
  ],
  "meaning": "to call something into question",
  "examples": [
    "Das stellt die Theorie in Frage."
  ]
},

{
  "id": "umbedankt-nehmen",
  "type": "verb-noun",
  "verb": {
    "lemma": "nehmen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": {
    "lemma": "Annahme",
    "pos": "NOUN"
  },
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "dobj",
      "obl",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "noun->verb"
  },
  "mustMatch": [
    "verb:lemma=nehmen",
    "noun:lemma=Annahme"
  ],
  "shouldMatch": [
    "nounDeps include obj",
    "verbDeps include obj"
  ],
  "meaning": "to accept something",
  "examples": [
    "Er nimmt die Einladung an."
  ]
},

{
  "id": "eine-rolle-spielen",
  "type": "verb-noun",
  "verb": {
    "lemma": "spielen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": {
    "lemma": "Rolle",
    "pos": "NOUN"
  },
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "dobj",
      "obl",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "noun->verb"
  },
  "mustMatch": [
    "verb:lemma=spielen",
    "noun:lemma=Rolle"
  ],
  "shouldMatch": [
    "nounDeps include obj",
    "verbDeps include obj"
  ],
  "meaning": "to play a role",
  "examples": [
    "Das spielt eine große Rolle."
  ]
},

{
  "id": "aufmerksamkeit-schenken",
  "type": "verb-noun",
  "verb": {
    "lemma": "schenken",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": {
    "lemma": "Aufmerksamkeit",
    "pos": "NOUN"
  },
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "dobj",
      "obl",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "noun->verb"
  },
  "mustMatch": [
    "verb:lemma=schenken",
    "noun:lemma=Aufmerksamkeit"
  ],
  "shouldMatch": [
    "nounDeps include obj",
    "verbDeps include obj"
  ],
  "meaning": "to give attention to someone",
  "examples": [
    "Er schenkt ihr viel Aufmerksamkeit."
  ]
},

{
  "id": "ueberblick-behalten",
  "type": "verb-noun",
  "verb": {
    "lemma": "behalten",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": {
    "lemma": "Überblick",
    "pos": "NOUN"
  },
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "dobj",
      "oa",
      "obl",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl",
      "nk"
    ],
    "mustMatchDeps": [
      "obj",
      "dobj",
      "oa"
    ],
    "shouldMatchDeps": [
      "det",
      "amod",
      "adj",
      "adv",
      "case"
    ],
    "headRelation": "noun->verb",
    "normalizeVerbForms": true,
    "collapseAux": true,
    "allowParticiple": true
  },
  "mustMatch": [
    "verb:lemma=behalten",
    "noun:lemma=Überblick"
  ],
  "shouldMatch": [
    "nounDeps include obj",
    "verbDeps include obj"
  ],
  "meaning": "to keep an overview",
  "examples": [
    "Er behält den Überblick."
  ]
},

{
  "id": "massnahmen-ergreifen",
  "type": "verb-noun",
  "verb": {
    "lemma": "ergreifen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": {
    "lemma": "Maßnahme",
    "pos": "NOUN"
  },
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "dobj",
      "oa",
      "obl",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl",
      "nk"
    ],
    "mustMatchDeps": [
      "obj",
      "dobj",
      "oa"
    ],
    "shouldMatchDeps": [
      "det",
      "num",
      "adj",
      "amod"
    ],
    "headRelation": "noun->verb",
    "normalizeVerbForms": true,
    "collapseAux": true,
    "allowParticiple": true
  },
  "mustMatch": [
    "verb:lemma=ergreifen",
    "noun:lemma=Maßnahme"
  ],
  "shouldMatch": [
    "nounDeps include obj",
    "verbDeps include obj"
  ],
  "meaning": "to take measures",
  "examples": [
    "Die Regierung ergreift Maßnahmen."
  ]
},

{
  "id": "erfahrungen-sammeln",
  "type": "verb-noun",
  "verb": {
    "lemma": "sammeln",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": {
    "lemma": "Erfahrung",
    "pos": "NOUN"
  },
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "dobj",
      "oa",
      "obl",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl",
      "nk"
    ],
    "mustMatchDeps": [
      "obj",
      "dobj",
      "oa"
    ],
    "shouldMatchDeps": [
      "det",
      "adj",
      "num",
      "adv"
    ],
    "headRelation": "noun->verb",
    "normalizeVerbForms": true,
    "collapseAux": true,
    "allowParticiple": true
  },
  "mustMatch": [
    "verb:lemma=sammeln",
    "noun:lemma=Erfahrung"
  ],
  "shouldMatch": [
    "nounDeps include obj",
    "verbDeps include obj"
  ],
  "meaning": "to gain experience",
  "examples": [
    "Sie sammelt Erfahrungen im Praktikum."
  ]
},

{
  "id": "eindruck-hinterlassen",
  "type": "verb-noun",
  "verb": {
    "lemma": "hinterlassen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": {
    "lemma": "Eindruck",
    "pos": "NOUN"
  },
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "dobj",
      "oa",
      "obl",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl",
      "nk"
    ],
    "mustMatchDeps": [
      "obj",
      "dobj",
      "oa"
    ],
    "shouldMatchDeps": [
      "det",
      "amod",
      "adj",
      "adv"
    ],
    "headRelation": "noun->verb",
    "normalizeVerbForms": true,
    "collapseAux": true,
    "allowParticiple": true,
    "allowSeparableParticle": true
  },
  "mustMatch": [
    "verb:lemma=hinterlassen",
    "noun:lemma=Eindruck"
  ],
  "shouldMatch": [
    "nounDeps include obj",
    "verbDeps include obj"
  ],
  "meaning": "to leave an impression",
  "examples": [
    "Er hinterlässt einen guten Eindruck."
  ]
},

{
  "id": "aufmerksamkeit-erregen",
  "type": "verb-noun",
  "verb": {
    "lemma": "erregen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": {
    "lemma": "Aufmerksamkeit",
    "pos": "NOUN"
  },
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "dobj",
      "oa",
      "obl",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "mustMatchDeps": [
      "obj",
      "dobj",
      "oa"
    ],
    "shouldMatchDeps": [
      "det",
      "adj",
      "adv"
    ],
    "headRelation": "noun->verb",
    "normalizeVerbForms": true,
    "collapseAux": true,
    "allowParticiple": true
  },
  "mustMatch": [
    "verb:lemma=erregen",
    "noun:lemma=Aufmerksamkeit"
  ],
  "shouldMatch": [
    "nounDeps include obj",
    "verbDeps include obj"
  ],
  "meaning": "to attract attention",
  "examples": [
    "Das Video erregte viel Aufmerksamkeit."
  ]
},

{
  "id": "verantwortung-uebernehmen",
  "type": "verb-noun",
  "verb": {
    "lemma": "übernehmen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": {
    "lemma": "Verantwortung",
    "pos": "NOUN"
  },
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "dobj",
      "oa",
      "obl",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "mustMatchDeps": [
      "obj",
      "dobj",
      "oa"
    ],
    "shouldMatchDeps": [
      "det",
      "adj",
      "adv"
    ],
    "headRelation": "noun->verb",
    "normalizeVerbForms": true,
    "collapseAux": true,
    "allowParticiple": true
  },
  "mustMatch": [
    "verb:lemma=übernehmen",
    "noun:lemma=Verantwortung"
  ],
  "shouldMatch": [
    "nounDeps include obj",
    "verbDeps include obj"
  ],
  "meaning": "to take responsibility",
  "examples": [
    "Sie übernimmt die Verantwortung."
  ]
},

{
  "id": "schritte-einleiten",
  "type": "verb-noun",
  "verb": {
    "lemma": "einleiten",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": {
    "lemma": "Schritt",
    "pos": "NOUN"
  },
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "dobj",
      "oa",
      "obl",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl",
      "nk"
    ],
    "mustMatchDeps": [
      "obj",
      "dobj",
      "oa"
    ],
    "shouldMatchDeps": [
      "det",
      "num",
      "adj"
    ],
    "headRelation": "noun->verb",
    "normalizeVerbForms": true,
    "collapseAux": true,
    "allowParticiple": true
  },
  "mustMatch": [
    "verb:lemma=einleiten",
    "noun:lemma=Schritt"
  ],
  "shouldMatch": [
    "nounDeps include obj",
    "verbDeps include obj"
  ],
  "meaning": "to initiate steps",
  "examples": [
    "Wir leiten erste Schritte ein."
  ]
},

{
  "id": "auf-details-achten",
  "type": "verb-prep",
  "verb": {
    "lemma": "achten",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": {
    "lemma": "auf",
    "dep": "case"
  },
  "noun": {
    "lemma": "Detail",
    "pos": "NOUN"
  },
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "dobj",
      "obl",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "prep",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "mustMatchDeps": [
      "prep",
      "case",
      "pobj",
      "obl"
    ],
    "shouldMatchDeps": [
      "det",
      "adj",
      "num",
      "amod"
    ],
    "headRelation": "prep->noun",
    "normalizeVerbForms": true,
    "collapseAux": true,
    "allowParticiple": true,
    "allowPrepOnNoun": true
  },
  "mustMatch": [
    "verb:lemma=achten",
    "prep:lemma=auf",
    "noun:lemma=Detail"
  ],
  "shouldMatch": [
    "prepDeps include case",
    "nounDeps include obj"
  ],
  "meaning": "to pay attention to details",
  "examples": [
    "Achte auf die Details."
  ]
},

{
  "id": "einigung-erzielen",
  "type": "verb-noun",
  "verb": {
    "lemma": "erzielen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": {
    "lemma": "Einigung",
    "pos": "NOUN"
  },
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "dobj",
      "oa",
      "obl",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "mustMatchDeps": [
      "obj",
      "dobj",
      "oa",
      "obl"
    ],
    "shouldMatchDeps": [
      "det",
      "adj",
      "adv"
    ],
    "headRelation": "noun->verb",
    "normalizeVerbForms": true,
    "collapseAux": true,
    "allowParticiple": true,
    "allowZuInfinitive": true
  },
  "mustMatch": [
    "verb:lemma=erzielen",
    "noun:lemma=Einigung"
  ],
  "shouldMatch": [
    "nounDeps include obj",
    "verbDeps include obj"
  ],
  "meaning": "to reach an agreement",
  "examples": [
    "Die Parteien erzielten eine Einigung."
  ]
},

{
  "id": "vertrauen-schenken",
  "type": "verb-noun",
  "verb": {
    "lemma": "schenken",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": {
    "lemma": "Vertrauen",
    "pos": "NOUN"
  },
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "dobj",
      "obl",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "noun->verb"
  },
  "mustMatch": [
    "verb:lemma=schenken",
    "noun:lemma=Vertrauen"
  ],
  "shouldMatch": [
    "nounDeps include obj",
    "verbDeps include obj"
  ],
  "meaning": "to give someone trust",
  "examples": [
    "Ich schenke dir mein Vertrauen."
  ]
},

{
  "id": "einen-vorschlag-machen",
  "type": "verb-noun",
  "verb": {
    "lemma": "machen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": {
    "lemma": "Vorschlag",
    "pos": "NOUN"
  },
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "dobj",
      "obl",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "noun->verb"
  },
  "mustMatch": [
    "verb:lemma=machen",
    "noun:lemma=Vorschlag"
  ],
  "shouldMatch": [
    "nounDeps include obj",
    "verbDeps include obj"
  ],
  "meaning": "to make a suggestion",
  "examples": [
    "Ich mache einen Vorschlag."
  ]
},

{
  "id": "in-kauf-nehmen",
  "type": "verb-noun",
  "verb": {
    "lemma": "nehmen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": {
    "lemma": "Kauf",
    "pos": "NOUN"
  },
  "separable": null,
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "dobj",
      "obl",
      "oa",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "noun->verb"
  },
  "mustMatch": [
    "verb:lemma=nehmen",
    "noun:lemma=Kauf"
  ],
  "shouldMatch": [
    "nounDeps include obj",
    "verbDeps include obj"
  ],
  "meaning": "to accept something as consequence",
  "examples": [
    "Das nehme ich in Kauf."
  ]
},

{
  "id": "ausgehen",
  "type": "separable",
  "verb": {
    "lemma": "gehen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": null,
  "separable": {
    "particle": "aus"
  },
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "aux",
      "advmod",
      "obj",
      "dobj",
      "oa",
      "obl",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "particle->verb"
  },
  "mustMatch": [
    "verb:lemma=gehen",
    "separable:particle=aus"
  ],
  "shouldMatch": [
    "particle separated in surface order"
  ],
  "meaning": "to go out (socially)",
  "examples": [
    "Wir gehen heute Abend aus."
  ]
},

{
  "id": "einladen",
  "type": "separable",
  "verb": {
    "lemma": "laden",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": null,
  "separable": {
    "particle": "ein"
  },
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "dobj",
      "aux",
      "advmod",
      "oa",
      "obl",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "particle->verb"
  },
  "mustMatch": [
    "verb:lemma=laden",
    "separable:particle=ein"
  ],
  "shouldMatch": [
    "particle separated in surface order"
  ],
  "meaning": "to invite someone",
  "examples": [
    "Ich lade dich ein."
  ]
},

{
  "id": "zurueckkommen",
  "type": "separable",
  "verb": {
    "lemma": "kommen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": null,
  "separable": {
    "particle": "zurück"
  },
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "aux",
      "advmod",
      "obj",
      "dobj",
      "oa",
      "obl",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "particle->verb"
  },
  "mustMatch": [
    "verb:lemma=kommen",
    "separable:particle=zurück"
  ],
  "shouldMatch": [
    "particle separated in surface order"
  ],
  "meaning": "to come back",
  "examples": [
    "Er kommt später zurück."
  ]
},

{
  "id": "wegfahren",
  "type": "separable",
  "verb": {
    "lemma": "fahren",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": null,
  "separable": {
    "particle": "weg"
  },
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "aux",
      "advmod",
      "obj",
      "dobj",
      "oa",
      "obl",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "particle->verb"
  },
  "mustMatch": [
    "verb:lemma=fahren",
    "separable:particle=weg"
  ],
  "shouldMatch": [
    "particle separated in surface order"
  ],
  "meaning": "to leave (by vehicle)",
  "examples": [
    "Sie fährt morgen weg."
  ]
},

{
  "id": "weitergehen",
  "type": "separable",
  "verb": {
    "lemma": "gehen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": null,
  "separable": {
    "particle": "weiter"
  },
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "aux",
      "advmod",
      "obj",
      "dobj",
      "oa",
      "obl",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "particle->verb"
  },
  "mustMatch": [
    "verb:lemma=gehen",
    "separable:particle=weiter"
  ],
  "shouldMatch": [
    "particle separated in surface order"
  ],
  "meaning": "to continue",
  "examples": [
    "Wir gehen weiter."
  ]
},

{
  "id": "fortsetzen",
  "type": "separable",
  "verb": {
    "lemma": "setzen",
    "pos": "VERB"
  },
  "reflexive": null,
  "prep": null,
  "noun": null,
  "separable": {
    "particle": "fort"
  },
  "depSignature": {
    "maxDepth": 3,
    "verbDeps": [
      "obj",
      "aux",
      "advmod",
      "dobj",
      "oa",
      "obl",
      "nk"
    ],
    "reflexiveDeps": [
      "obj",
      "iobj",
      "refl",
      "oa",
      "dobj"
    ],
    "prepDeps": [
      "case",
      "op",
      "mnr"
    ],
    "nounDeps": [
      "obj",
      "nmod",
      "obl"
    ],
    "headRelation": "particle->verb"
  },
  "mustMatch": [
    "verb:lemma=setzen",
    "separable:particle=fort"
  ],
  "shouldMatch": [
    "particle separated in surface order"
  ],
  "meaning": "to continue something",
  "examples": [
    "Wir setzen die Arbeit fort."
  ]
}
];


function orderedDef(def: any) { return def; }
const patterns = RAW.map(orderedDef);
export default patterns;
