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
    examples: ['Ich freue mich auf das Konzert.'],
  },
  {
    id: 'sich-interessieren-fuer',
    type: 'reflexive-prep',
    verb: { lemma: 'interessieren', pos: 'VERB' },
    reflexive: { required: true, dep: ['obj', 'iobj', 'refl'] },
    prep: { lemma: 'für', dep: 'case' },
    examples: ['Ich interessiere mich für Kunst.'],
  },
  {
    id: 'sich-kümmern-um',
    type: 'reflexive-prep',
    verb: { lemma: 'kümmern', pos: 'VERB' },
    reflexive: { required: true, dep: ['obj', 'iobj', 'refl'] },
    prep: { lemma: 'um', dep: 'case' },
    examples: ['Ich kümmere mich um das Problem.'],
  },
  {
    id: 'sich-erinnern-an',
    type: 'reflexive-prep',
    verb: { lemma: 'erinnern', pos: 'VERB' },
    reflexive: { required: true, dep: ['obj', 'iobj', 'refl'] },
    prep: { lemma: 'an', dep: 'case' },
    examples: ['Ich erinnere mich an das Gespräch.'],
  },
  {
    id: 'warten-auf',
    type: 'verb-prep',
    verb: { lemma: 'warten', pos: 'VERB' },
    prep: { lemma: 'auf', dep: 'case' },
    examples: ['Ich warte auf dich.'],
  },
  {
    id: 'denken-an',
    type: 'verb-prep',
    verb: { lemma: 'denken', pos: 'VERB' },
    prep: { lemma: 'an', dep: 'case' },
    examples: ['Ich denke an dich.'],
  },
  {
    id: 'halten-von',
    type: 'verb-prep',
    verb: { lemma: 'halten', pos: 'VERB' },
    prep: { lemma: 'von', dep: 'case' },
    examples: ['Was hältst du von dem Plan?'],
  },
  {
    id: 'angst-haben',
    type: 'verb-noun',
    verb: { lemma: 'haben', pos: 'VERB' },
    noun: { lemma: 'Angst', pos: 'NOUN' },
    examples: ['Ich habe Angst.'],
  },
  {
    id: 'hunger-haben',
    type: 'verb-noun',
    verb: { lemma: 'haben', pos: 'VERB' },
    noun: { lemma: 'Hunger', pos: 'NOUN' },
    examples: ['Ich habe Hunger.'],
  },
  {
    id: 'urlaub-machen',
    type: 'verb-noun',
    verb: { lemma: 'machen', pos: 'VERB' },
    noun: { lemma: 'Urlaub', pos: 'NOUN' },
    examples: ['Wir machen Urlaub.'],
  },
  {
    id: 'vorbereiten-auf',
    type: 'reflexive-prep',
    verb: { lemma: 'vorbereiten', pos: 'VERB' },
    reflexive: { required: true, dep: ['obj', 'iobj', 'refl'] },
    prep: { lemma: 'auf', dep: 'case' },
    separable: { particle: 'vor' },
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
    examples: [
      'Ich muss mit der Arbeit anfangen.',
      'Wir fangen sofort an.',
    ],
  }
];

export default patterns;
