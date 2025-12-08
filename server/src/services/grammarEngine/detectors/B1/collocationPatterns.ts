/**
 * Collocation DSL
 * Each entry describes a canonical collocation to detect.
 * Extended to support Fehler machen / aufstehen / anfangen
 */

const patterns = [
  {
    id: 'sich-freuen-auf',
    type: 'reflexive-prep',
    verb: { lemma: 'freuen', pos: 'VERB' },
    reflexive: { required: true, dep: ['obj', 'iobj', 'refl', 'oa'] },
    prep: { lemma: 'auf', dep: 'case' },
    meaning: 'to look forward to something',
    examples: ['Ich freue mich auf das Konzert.'],
  },
  {
    id: 'sich-interessieren-fuer',
    type: 'reflexive-prep',
    verb: { lemma: 'interessieren', pos: 'VERB' },
    reflexive: { required: true, dep: ['obj', 'iobj', 'refl'] },
    prep: { lemma: 'für', dep: 'case' },
    meaning: 'to be interested in something',
    examples: ['Ich interessiere mich für Kunst.'],
  },
  {
    id: 'sich-kümmern-um',
    type: 'reflexive-prep',
    verb: { lemma: 'kümmern', pos: 'VERB' },
    reflexive: { required: true, dep: ['obj', 'iobj', 'refl'] },
    prep: { lemma: 'um', dep: 'case' },
    meaning: 'to take care of something',
    examples: ['Ich kümmere mich um das Problem.'],
  },
  {
    id: 'sich-erinnern-an',
    type: 'reflexive-prep',
    verb: { lemma: 'erinnern', pos: 'VERB' },
    reflexive: { required: true, dep: ['obj', 'iobj', 'refl'] },
    prep: { lemma: 'an', dep: 'case' },
    meaning: 'to remember something',
    examples: ['Ich erinnere mich an das Gespräch.'],
  },
  {
    id: 'warten-auf',
    type: 'verb-prep',
    verb: { lemma: 'warten', pos: 'VERB' },
    prep: { lemma: 'auf', dep: 'case' },
    meaning: 'to wait for something',
    examples: ['Ich warte auf dich.'],
  },
  {
    id: 'denken-an',
    type: 'verb-prep',
    verb: { lemma: 'denken', pos: 'VERB' },
    prep: { lemma: 'an', dep: 'case' },
    meaning: 'to think of someone or something',
    examples: ['Ich denke an dich.'],
  },
  {
    id: 'halten-von',
    type: 'verb-prep',
    verb: { lemma: 'halten', pos: 'VERB' },
    prep: { lemma: 'von', dep: 'case' },
    meaning: 'to have an opinion about something',
    examples: ['Was hältst du von dem Plan?'],
  },
  {
    id: 'angst-haben',
    type: 'verb-noun',
    verb: { lemma: 'haben', pos: 'VERB' },
    noun: { lemma: 'Angst', pos: 'NOUN' },
    meaning: 'to be afraid',
    examples: ['Ich habe Angst.'],
  },
  {
    id: 'hunger-haben',
    type: 'verb-noun',
    verb: { lemma: 'haben', pos: 'VERB' },
    noun: { lemma: 'Hunger', pos: 'NOUN' },
    meaning: 'to be hungry',
    examples: ['Ich habe Hunger.'],
  },
  {
    id: 'urlaub-machen',
    type: 'verb-noun',
    verb: { lemma: 'machen', pos: 'VERB' },
    noun: { lemma: 'Urlaub', pos: 'NOUN' },
    meaning: 'to take a vacation',
    examples: ['Wir machen Urlaub.'],
  },
  {
    id: 'vorbereiten-auf',
    type: 'reflexive-prep',
    verb: { lemma: 'vorbereiten', pos: 'VERB' },
    reflexive: { required: true, dep: ['obj', 'iobj', 'refl'] },
    prep: { lemma: 'auf', dep: 'case' },
    separable: { particle: 'vor' },
    meaning: 'to prepare oneself for something',
    examples: ['Sie bereitet sich auf die Prüfung vor.'],
  },
  // ============================================
  // NEW: Fehler machen  (for Test 12)
  // ============================================
  {
    id: 'fehler-machen',
    type: 'verb-noun',
    verb: { lemma: 'machen', pos: 'VERB' },
    noun: { lemma: 'Fehler', pos: 'NOUN' },
    meaning: 'to make a mistake',
    examples: [
      'Du machst einen Fehler.',
      'Ich habe einen Fehler gemacht.',
    ],
  },

  // ============================================
  // NEW: aufstehen — separable verb (Test 5)
  // ============================================
  {
    id: 'aufstehen',
    type: 'separable',
    verb: { lemma: 'stehen', pos: 'VERB' },
    separable: { particle: 'auf' },
    meaning: 'to get up',
    examples: [
      'Ich stehe früh auf.',
      'Er steht jeden Tag um sechs auf.',
    ],
  },

  // ============================================
  // NEW: anfangen — separable verb (Test 10)
  // ============================================
  {
    id: 'anfangen',
    type: 'separable',
    verb: { lemma: 'fangen', pos: 'VERB' },
    separable: { particle: 'an' },
    meaning: 'to begin or start',
    examples: [
      'Ich muss mit der Arbeit anfangen.',
      'Wir fangen sofort an.',
    ],
  }

  // ======================================================
  // Additional collocations (A2/B1/B2)
  // ======================================================

  // ---------------------------
  // Reflexive + Preposition
  // ---------------------------
  {
    id: 'sich-bewerben-um',
    type: 'reflexive-prep',
    verb: { lemma: 'bewerben', pos: 'VERB' },
    reflexive: { required: true, dep: ['obj','iobj','refl'] },
    prep: { lemma: 'um', dep: 'case' },
    meaning: 'to apply for something',
    examples: ['Ich bewerbe mich um den Job.'],
  },
  {
    id: 'sich-beschäftigen-mit',
    type: 'reflexive-prep',
    verb: { lemma: 'beschäftigen', pos: 'VERB' },
    reflexive: { required: true, dep: ['obj','iobj','refl'] },
    prep: { lemma: 'mit', dep: 'case' },
    meaning: 'to occupy oneself with something',
    examples: ['Ich beschäftige mich mit dem Thema.'],
  },
  {
    id: 'sich-verlieben-in',
    type: 'reflexive-prep',
    verb: { lemma: 'verlieben', pos: 'VERB' },
    reflexive: { required: true, dep: ['obj','iobj','refl'] },
    prep: { lemma: 'in', dep: 'case' },
    meaning: 'to fall in love with someone',
    examples: ['Er hat sich in sie verliebt.'],
  },
  {
    id: 'sich-melden-bei',
    type: 'reflexive-prep',
    verb: { lemma: 'melden', pos: 'VERB' },
    reflexive: { required: true, dep: ['obj','iobj','refl'] },
    prep: { lemma: 'bei', dep: 'case' },
    meaning: 'to contact someone',
    examples: ['Meldest du dich bei mir?'],
  },
  {
    id: 'sich-sehnen-nach',
    type: 'reflexive-prep',
    verb: { lemma: 'sehnen', pos: 'VERB' },
    reflexive: { required: true, dep: ['obj','iobj','refl'] },
    prep: { lemma: 'nach', dep: 'case' },
    meaning: 'to long for something',
    examples: ['Ich sehne mich nach Ruhe.'],
  },
  {
    id: 'sich-trennen-von',
    type: 'reflexive-prep',
    verb: { lemma: 'trennen', pos: 'VERB' },
    reflexive: { required: true, dep: ['obj','iobj','refl'] },
    prep: { lemma: 'von', dep: 'case' },
    meaning: 'to separate from someone',
    examples: ['Sie trennt sich von ihrem Mann.'],
  },
  {
    id: 'sich-ärgern-über',
    type: 'reflexive-prep',
    verb: { lemma: 'ärgern', pos: 'VERB' },
    reflexive: { required: true, dep: ['obj','iobj','refl'] },
    prep: { lemma: 'über', dep: 'case' },
    meaning: 'to be annoyed about something',
    examples: ['Ich ärgere mich über das Wetter.'],
  },

  // ---------------------------
  // Verb + Preposition
  // ---------------------------
  {
    id: 'sprechen-über',
    type: 'verb-prep',
    verb: { lemma: 'sprechen', pos: 'VERB' },
    prep: { lemma: 'über', dep: 'case' },
    meaning: 'to talk about something',
    examples: ['Wir sprechen über das Problem.'],
  },
  {
    id: 'sprechen-mit',
    type: 'verb-prep',
    verb: { lemma: 'sprechen', pos: 'VERB' },
    prep: { lemma: 'mit', dep: 'case' },
    meaning: 'to speak with someone',
    examples: ['Ich spreche mit ihm.'],
  },
  {
    id: 'hoffen-auf',
    type: 'verb-prep',
    verb: { lemma: 'hoffen', pos: 'VERB' },
    prep: { lemma: 'auf', dep: 'case' },
    meaning: 'to hope for something',
    examples: ['Ich hoffe auf gutes Wetter.'],
  },
  {
    id: 'verzichten-auf',
    type: 'verb-prep',
    verb: { lemma: 'verzichten', pos: 'VERB' },
    prep: { lemma: 'auf', dep: 'case' },
    meaning: 'to give up something',
    examples: ['Ich verzichte auf Fleisch.'],
  },
  {
    id: 'abhängen-von',
    type: 'verb-prep',
    verb: { lemma: 'abhängen', pos: 'VERB' },
    prep: { lemma: 'von', dep: 'case' },
    meaning: 'to depend on something',
    examples: ['Es hängt von dir ab.'],
  },
  {
    id: 'bestehen-aus',
    type: 'verb-prep',
    verb: { lemma: 'bestehen', pos: 'VERB' },
    prep: { lemma: 'aus', dep: 'case' },
    meaning: 'to consist of something',
    examples: ['Das Team besteht aus fünf Personen.'],
  },
  {
    id: 'gelten-als',
    type: 'verb-prep',
    verb: { lemma: 'gelten', pos: 'VERB' },
    prep: { lemma: 'als', dep: 'case' },
    meaning: 'to be regarded as something',
    examples: ['Er gilt als Experte.'],
  },
  {
    id: 'leiden-an',
    type: 'verb-prep',
    verb: { lemma: 'leiden', pos: 'VERB' },
    prep: { lemma: 'an', dep: 'case' },
    meaning: 'to suffer from something',
    examples: ['Er leidet an einer Krankheit.'],
  },
  {
    id: 'teilnehmen-an',
    type: 'verb-prep',
    verb: { lemma: 'teilnehmen', pos: 'VERB' },
    prep: { lemma: 'an', dep: 'case' },
    separable: { particle: 'teil' },
    meaning: 'to participate in something',
    examples: ['Ich nehme an der Sitzung teil.'],
  },
  {
    id: 'gehören-zu',
    type: 'verb-prep',
    verb: { lemma: 'gehören', pos: 'VERB' },
    prep: { lemma: 'zu', dep: 'case' },
    meaning: 'to belong to something',
    examples: ['Das gehört zu meinen Aufgaben.'],
  },

  // ---------------------------
  // Verb + Noun collocations
  // ---------------------------
  {
    id: 'eine-entscheidung-treffen',
    type: 'verb-noun',
    verb: { lemma: 'treffen', pos: 'VERB' },
    noun: { lemma: 'Entscheidung', pos: 'NOUN' },
    meaning: 'to make a decision',
    examples: ['Ich treffe eine Entscheidung.'],
  },
  {
    id: 'ein-gespraech-fuehren',
    type: 'verb-noun',
    verb: { lemma: 'führen', pos: 'VERB' },
    noun: { lemma: 'Gespräch', pos: 'NOUN' },
    meaning: 'to have a conversation',
    examples: ['Wir führen ein Gespräch.'],
  },
  {
    id: 'in-frage-stellen',
    type: 'verb-noun',
    verb: { lemma: 'stellen', pos: 'VERB' },
    noun: { lemma: 'Frage', pos: 'NOUN' },
    meaning: 'to call something into question',
    examples: ['Das stellt die Theorie in Frage.'],
  },
  {
    id: 'umbedankt-nehmen',
    type: 'verb-noun',
    verb: { lemma: 'nehmen', pos: 'VERB' },
    noun: { lemma: 'Annahme', pos: 'NOUN' },
    meaning: 'to accept something',
    examples: ['Er nimmt die Einladung an.'],
  },
  {
    id: 'eine-rolle-spielen',
    type: 'verb-noun',
    verb: { lemma: 'spielen', pos: 'VERB' },
    noun: { lemma: 'Rolle', pos: 'NOUN' },
    meaning: 'to play a role',
    examples: ['Das spielt eine große Rolle.'],
  },
  {
    id: 'aufmerksamkeit-schenken',
    type: 'verb-noun',
    verb: { lemma: 'schenken', pos: 'VERB' },
    noun: { lemma: 'Aufmerksamkeit', pos: 'NOUN' },
    meaning: 'to give attention to someone',
    examples: ['Er schenkt ihr viel Aufmerksamkeit.'],
  },
  {
    id: 'vertrauen-schenken',
    type: 'verb-noun',
    verb: { lemma: 'schenken', pos: 'VERB' },
    noun: { lemma: 'Vertrauen', pos: 'NOUN' },
    meaning: 'to give someone trust',
    examples: ['Ich schenke dir mein Vertrauen.'],
  },
  {
    id: 'einen-vorschlag-machen',
    type: 'verb-noun',
    verb: { lemma: 'machen', pos: 'VERB' },
    noun: { lemma: 'Vorschlag', pos: 'NOUN' },
    meaning: 'to make a suggestion',
    examples: ['Ich mache einen Vorschlag.'],
  },
  {
    id: 'in-kauf-nehmen',
    type: 'verb-noun',
    verb: { lemma: 'nehmen', pos: 'VERB' },
    noun: { lemma: 'Kauf', pos: 'NOUN' },
    meaning: 'to accept something as consequence',
    examples: ['Das nehme ich in Kauf.'],
  },

  // ---------------------------
  // More separable verbs
  // ---------------------------
  {
    id: 'ausgehen',
    type: 'separable',
    verb: { lemma: 'gehen', pos: 'VERB' },
    separable: { particle: 'aus' },
    meaning: 'to go out (socially)',
    examples: ['Wir gehen heute Abend aus.'],
  },
  {
    id: 'einladen',
    type: 'separable',
    verb: { lemma: 'laden', pos: 'VERB' },
    separable: { particle: 'ein' },
    meaning: 'to invite someone',
    examples: ['Ich lade dich ein.'],
  },
  {
    id: 'zurueckkommen',
    type: 'separable',
    verb: { lemma: 'kommen', pos: 'VERB' },
    separable: { particle: 'zurück' },
    meaning: 'to come back',
    examples: ['Er kommt später zurück.'],
  },
  {
    id: 'wegfahren',
    type: 'separable',
    verb: { lemma: 'fahren', pos: 'VERB' },
    separable: { particle: 'weg' },
    meaning: 'to leave (by vehicle)',
    examples: ['Sie fährt morgen weg.'],
  },
  {
    id: 'weitergehen',
    type: 'separable',
    verb: { lemma: 'gehen', pos: 'VERB' },
    separable: { particle: 'weiter' },
    meaning: 'to continue',
    examples: ['Wir gehen weiter.'],
  },
  {
    id: 'fortsetzen',
    type: 'separable',
    verb: { lemma: 'setzen', pos: 'VERB' },
    separable: { particle: 'fort' },
    meaning: 'to continue something',
    examples: ['Wir setzen die Arbeit fort.'],
  }
];

export default patterns;
