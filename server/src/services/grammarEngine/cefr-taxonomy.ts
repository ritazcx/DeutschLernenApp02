/**
 * CEFR Grammar Taxonomy - A1 to C2
 * Maps German grammar points to CEFR levels with spaCy feature recognition
 */

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type GrammarCategory = 
  | 'tense'
  | 'case'
  | 'voice'
  | 'mood'
  | 'agreement'
  | 'article'
  | 'adjective'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'verb-form'
  | 'word-order'
  | 'separable-verb'
  | 'modal-verb'
  | 'reflexive-verb'
  | 'passive';

export interface GrammarPoint {
  id: string;
  category: GrammarCategory;
  level: CEFRLevel;
  name: string;
  description: string;
  examples: string[];
  explanation: string;
  relatedVocabulary?: string[];
  commonMistakes?: string[];
  spaCyFeatures?: {
    tense?: string[];
    mood?: string[];
    case?: string[];
    posTag?: string[];
    dep?: string[];
    voice?: string[];
  };
}

/**
 * CEFR A1 - Beginner Level
 * Present tense, nominative case, basic verbs, simple sentences
 */
export const A1_GRAMMAR: Record<string, GrammarPoint> = {
  'present-tense': {
    id: 'a1-present-tense',
    category: 'tense',
    level: 'A1',
    name: 'Present Tense (Präsens)',
    description: 'Simple present tense forms of regular and common irregular verbs',
    examples: ['ich bin', 'du bist', 'er ist', 'wir sind', 'ich habe', 'du hast'],
    explanation: 'The present tense is the base tense for beginners. Regular verbs use -e, -st, -t, -en endings.',
    spaCyFeatures: {
      tense: ['Pres'],
      posTag: ['VVFIN'],
    },
  },
  'nominative-case': {
    id: 'a1-nominative-case',
    category: 'case',
    level: 'A1',
    name: 'Nominative Case (Nominativ)',
    description: 'Subject case - articles: der, die, das, ein, eine',
    examples: ['Der Mann ist hier', 'Die Frau heißt Maria', 'Das Kind spielt'],
    explanation: 'Nominative is the subject case. Use it for the person or thing performing the action.',
    spaCyFeatures: {
      case: ['Nom'],
    },
  },
  'accusative-case': {
    id: 'a1-accusative-case',
    category: 'case',
    level: 'A1',
    name: 'Accusative Case (Akkusativ)',
    description: 'Direct object case - articles: den, die, das, einen, eine',
    examples: ['Ich sehe den Mann', 'Du kennst die Frau', 'Er hat ein Buch'],
    explanation: 'Accusative is the direct object case. Use it for the person or thing receiving the action.',
    spaCyFeatures: {
      case: ['Acc'],
    },
  },
  'definite-articles': {
    id: 'a1-definite-articles',
    category: 'article',
    level: 'A1',
    name: 'Definite Articles',
    description: 'The, the, the - der (m), die (f), das (n)',
    examples: ['der Tisch', 'die Lampe', 'das Fenster'],
    explanation: 'Definite articles show the gender and case of nouns. All nouns in German are gendered.',
    relatedVocabulary: ['Geschlecht', 'Genus', 'bestimmter Artikel'],
  },
  'indefinite-articles': {
    id: 'a1-indefinite-articles',
    category: 'article',
    level: 'A1',
    name: 'Indefinite Articles',
    description: 'A, an - ein (m), eine (f), ein (n)',
    examples: ['ein Tisch', 'eine Lampe', 'ein Fenster'],
    explanation: 'Indefinite articles are used for singular nouns you have not mentioned before.',
  },
  'verb-sein': {
    id: 'a1-verb-sein',
    category: 'verb-form',
    level: 'A1',
    name: 'Verb: sein (to be)',
    description: 'Most important irregular verb in German',
    examples: ['ich bin', 'du bist', 'er ist', 'wir sind', 'ihr seid', 'sie sind'],
    explanation: 'Sein is the most basic verb. Memorize all conjugations.',
    commonMistakes: ['*ich bin eine student (use indefinite article)', '*er bin (wrong person)'],
  },
  'verb-haben': {
    id: 'a1-verb-haben',
    category: 'verb-form',
    level: 'A1',
    name: 'Verb: haben (to have)',
    description: 'Essential irregular verb for possession',
    examples: ['ich habe', 'du hast', 'er hat', 'wir haben', 'ihr habt', 'sie haben'],
    explanation: 'Haben is used to express possession. Also used as auxiliary for perfect tense.',
  },
  'imperative-mood': {
    id: 'a1-imperative',
    category: 'mood',
    level: 'A1',
    name: 'Imperative Mood (Imperativ)',
    description: 'Commands: komm!, schreib!, seid ruhig!',
    examples: ['Komm hier!', 'Schreib einen Brief!', 'Seid ruhig!'],
    explanation: 'Use imperative to give commands. Formal: infinitive + Sie. Informal: stem + e/t.',
    spaCyFeatures: {
      mood: ['Imp'],
      posTag: ['VVIMP'],
    },
  },
};

/**
 * CEFR A2 - Elementary Level
 * Past tense (simple past, present perfect), dative case, common adjectives
 */
export const A2_GRAMMAR: Record<string, GrammarPoint> = {
  'simple-past-tense': {
    id: 'a2-simple-past',
    category: 'tense',
    level: 'A2',
    name: 'Simple Past Tense (Präteritum)',
    description: 'Past tense: ich machte, ich ging, ich stand',
    examples: ['Ich machte die Hausaufgaben', 'Er ging nach Hause', 'Sie stand auf'],
    explanation: 'Simple past is used in narratives. Regular verbs use -te, irregular verbs have stem changes.',
    spaCyFeatures: {
      tense: ['Past'],
      posTag: ['VVFIN'],
    },
  },
  'present-perfect-tense': {
    id: 'a2-present-perfect',
    category: 'tense',
    level: 'A2',
    name: 'Present Perfect Tense (Perfekt)',
    description: 'Compound past: ich habe gemacht, ich bin gegangen',
    examples: ['Ich habe die Hausaufgaben gemacht', 'Ich bin nach Hause gegangen'],
    explanation: 'Perfect tense = have + past participle. Use haben for transitive verbs, sein for movement/change.',
    spaCyFeatures: {
      tense: ['Past'],
      posTag: ['VVPP'],
    },
  },
  'past-participle': {
    id: 'a2-past-participle',
    category: 'verb-form',
    level: 'A2',
    name: 'Past Participle (Partizip II)',
    description: 'Forms: ge-mach-t, ge-gang-en, ge-stand-en',
    examples: ['gemacht', 'gegangen', 'gestanden', 'geschrieben'],
    explanation: 'Past participles are used in perfect and passive tenses. Regular: ge-stem-t. Irregular: ge-stem-en.',
    spaCyFeatures: {
      posTag: ['VVPP'],
    },
  },
  'dative-case': {
    id: 'a2-dative-case',
    category: 'case',
    level: 'A2',
    name: 'Dative Case (Dativ)',
    description: 'Indirect object case - articles: dem, der, dem, den; ein: einem, einer, einem, einen',
    examples: ['Ich gebe dem Mann ein Buch', 'Sie hilft der Frau', 'Er antwortet dem Kind'],
    explanation: 'Dative is the indirect object. Answer: to/for whom? Common verbs: geben, helfen, zeigen, antworten.',
    spaCyFeatures: {
      case: ['Dat'],
    },
  },
  'genitive-case': {
    id: 'a2-genitive-case',
    category: 'case',
    level: 'A2',
    name: 'Genitive Case (Genitiv)',
    description: 'Possessive case - articles: des, der, des, der',
    examples: ['Das Buch des Mannes', 'Die Tochter der Frau', 'Das Zimmer des Kindes'],
    explanation: 'Genitive shows possession. Answer: whose? Most common: s-possessive of nouns, genitive articles.',
    spaCyFeatures: {
      case: ['Gen'],
    },
  },
  'dative-prepositions': {
    id: 'a2-dative-prepositions',
    category: 'preposition',
    level: 'A2',
    name: 'Dative Prepositions',
    description: 'Prepositions requiring dative: mit, bei, von, zu, aus, in, auf, unter, über, neben, zwischen',
    examples: ['mit dem Mann', 'bei der Mutter', 'von dem Kind', 'zu Hause'],
    explanation: 'These prepositions always require dative case. Memorize the prepositions and practice.',
    relatedVocabulary: ['mit', 'bei', 'von', 'zu', 'aus'],
  },
  'accusative-prepositions': {
    id: 'a2-accusative-prepositions',
    category: 'preposition',
    level: 'A2',
    name: 'Accusative Prepositions',
    description: 'Prepositions requiring accusative: durch, für, gegen, ohne, um, bis',
    examples: ['durch den Garten', 'für das Kind', 'gegen den Wind', 'ohne einen Grund'],
    explanation: 'These prepositions always require accusative case. Common in daily conversations.',
    relatedVocabulary: ['durch', 'für', 'gegen', 'ohne', 'um'],
  },
  'reflexive-verbs': {
    id: 'a2-reflexive-verbs',
    category: 'reflexive-verb',
    level: 'A2',
    name: 'Reflexive Verbs',
    description: 'Verbs with reflexive pronouns: sich waschen, sich anziehen, sich fühlen',
    examples: ['Ich wasche mich', 'Du ziehst dich an', 'Er fühlt sich gut'],
    explanation: 'Reflexive verbs have a reflexive pronoun (mich, dich, sich) that refers back to the subject.',
    relatedVocabulary: ['sich waschen', 'sich anziehen', 'sich erinnern'],
  },
  'word-order-subject-verb-object': {
    id: 'a2-svo-word-order',
    category: 'word-order',
    level: 'A2',
    name: 'Basic Word Order (SVO)',
    description: 'Subject-Verb-Object: Der Mann kauft ein Buch',
    examples: ['Der Mann kauft ein Buch', 'Das Kind spielt einen Ball'],
    explanation: 'Main clause word order: subject - verb (position 2) - object. Adverbs/time can come first.',
  },
};

/**
 * CEFR B1 - Intermediate Level
 * Subordinate clauses, subjunctive, passive voice, complex sentences
 */
export const B1_GRAMMAR: Record<string, GrammarPoint> = {
  'subordinate-clauses': {
    id: 'b1-subordinate-clauses',
    category: 'word-order',
    level: 'B1',
    name: 'Subordinate Clauses (Nebensätze)',
    description: 'Clauses with verb at end: dass, weil, wenn, obwohl, während',
    examples: [
      'Ich weiß, dass er kommt',
      'Sie geht, weil sie müde ist',
      'Wenn du kommst, wird es schön',
      'Obwohl er alt ist, ist er aktiv',
    ],
    explanation: 'In subordinate clauses, the verb moves to the end. Conjunctions: dass, weil, wenn, obwohl, während.',
    spaCyFeatures: {
      dep: ['mark'],
      posTag: ['SCONJ'],
    },
  },
  'passive-voice-present': {
    id: 'b1-passive-voice-present',
    category: 'passive',
    level: 'B1',
    name: 'Passive Voice (Präsens)',
    description: 'Present passive: wird + past participle',
    examples: [
      'Das Buch wird gelesen',
      'Der Brief wird geschrieben',
      'Das Auto wird repariert',
    ],
    explanation: 'Passive voice: werden + past participle. Focus shifts from doer to action/receiver.',
    spaCyFeatures: {
      voice: ['Pass'],
      posTag: ['VAFIN'],
    },
  },
  'passive-voice-past': {
    id: 'b1-passive-voice-past',
    category: 'passive',
    level: 'B1',
    name: 'Passive Voice (Vergangenheit)',
    description: 'Past passive: wurde + past participle, ist + past participle',
    examples: [
      'Das Buch wurde gelesen',
      'Der Brief war geschrieben worden',
    ],
    explanation: 'Passive in past: wurde (simple past) or ist (perfect perfect passive)',
  },
  'konjunktiv-II-conditional': {
    id: 'b1-konjunktiv-II-conditional',
    category: 'mood',
    level: 'B1',
    name: 'Konjunktiv II - Conditional (würde)',
    description: 'Conditional wishes: würde + infinitive',
    examples: [
      'Ich würde gerne kommen',
      'Du würdest besser schlafen',
      'Wir würden singen',
    ],
    explanation: 'Würde + infinitive expresses polite requests, hypothetical situations, wishes.',
    spaCyFeatures: {
      mood: ['Cond'],
    },
  },
  'konjunktiv-II-subjunctive': {
    id: 'b1-konjunktiv-II-subjunctive',
    category: 'mood',
    level: 'B1',
    name: 'Konjunktiv II - Subjunctive',
    description: 'Indirect speech, hypothetical: könnte, sollte, hätte',
    examples: [
      'Er sagte, er könnte kommen',
      'Wenn ich Zeit hätte, würde ich schlafen',
      'Das sollte funktionieren',
    ],
    explanation: 'Konjunktiv II: stem changes in verbs (können→könnte, haben→hätte). Use in indirect speech.',
    spaCyFeatures: {
      mood: ['Subj'],
    },
  },
  'separable-verbs': {
    id: 'b1-separable-verbs',
    category: 'separable-verb',
    level: 'B1',
    name: 'Separable Verbs (Trennbare Verben)',
    description: 'Verbs with prefix that separate: anrufen→rufe an, aufstehen→stehe auf',
    examples: [
      'Ich rufe dich an',
      'Er steht um 6 Uhr auf',
      'Sie macht die Hausaufgaben auf',
    ],
    explanation: 'Separable verbs split: prefix moves to end in main clauses, stays attached in subordinate clauses.',
    relatedVocabulary: ['anrufen', 'aufstehen', 'ausziehen', 'anfangen', 'aufmachen'],
  },
  'modal-verbs': {
    id: 'b1-modal-verbs',
    category: 'modal-verb',
    level: 'B1',
    name: 'Modal Verbs (Modalverben)',
    description: 'können, müssen, wollen, sollen, dürfen, mögen',
    examples: [
      'Ich kann Deutsch sprechen',
      'Du musst heute arbeiten',
      'Er will nicht kommen',
    ],
    explanation: 'Modal verbs: konjugation + infinitive. Position: modal verb at position 2, infinitive at end.',
  },
  'relative-clauses': {
    id: 'b1-relative-clauses',
    category: 'conjunction',
    level: 'B1',
    name: 'Relative Clauses (Relativsätze)',
    description: 'Clauses with relative pronouns: der, die, das, welcher, welche, welches',
    examples: [
      'Der Mann, der im Garten sitzt, ist alt',
      'Die Frau, die ich sehe, heißt Maria',
      'Das Buch, das auf dem Tisch liegt, ist interessant',
    ],
    explanation: 'Relative clauses modify nouns. Relative pronoun agrees with antecedent (gender, number, case).',
    spaCyFeatures: {
      dep: ['relcl'],
    },
  },
  'adjective-agreement': {
    id: 'b1-adjective-agreement',
    category: 'agreement',
    level: 'B1',
    name: 'Adjective Agreement (Adjektivendungen)',
    description: 'Adjectives agree with article and noun in gender, number, case',
    examples: [
      'der große Mann (nom m)',
      'den großen Mann (acc m)',
      'die großen Männer (nom/acc pl)',
    ],
    explanation: 'Adjective endings depend on: article type (definite/indefinite/none), gender, number, case.',
    relatedVocabulary: ['Geschlecht', 'Numerus', 'Kasus'],
  },
  'present-perfect-with-sein': {
    id: 'b1-present-perfect-sein',
    category: 'tense',
    level: 'B1',
    name: 'Present Perfect with sein',
    description: 'Movement/change verbs use sein: bin gegangen, ist gesprungen',
    examples: [
      'Ich bin nach Hause gegangen',
      'Sie ist schnell gelaufen',
      'Wir sind hierher gereist',
    ],
    explanation: 'Sein vs haben: sein for movement/change, haben for all others. Both used in perfect tense.',
  },
};

/**
 * CEFR B2 - Upper Intermediate Level
 * Konjunktiv I, advanced passive, complex sentence structures
 */
export const B2_GRAMMAR: Record<string, GrammarPoint> = {
  'konjunktiv-I-indirect-speech': {
    id: 'b2-konjunktiv-I',
    category: 'mood',
    level: 'B2',
    name: 'Konjunktiv I - Indirect Speech (Indirekte Rede)',
    description: 'Reported speech: Er sagte, er sei krank',
    examples: [
      'Der Arzt sagte, der Patient sei krank',
      'Sie berichtete, sie habe das Buch gelesen',
      'Er meinte, er könne morgen kommen',
    ],
    explanation: 'Konjunktiv I used in reported speech. Present: -e endings, past: habe/sei + participle.',
    spaCyFeatures: {
      mood: ['Subj'],
    },
  },
  'passive-with-by-phrase': {
    id: 'b2-passive-von-durch',
    category: 'passive',
    level: 'B2',
    name: 'Passive with Agent (Passivsätze mit Agens)',
    description: 'Passive with von/durch: Das Buch wurde von dem Autor geschrieben',
    examples: [
      'Das Buch wird von einem Autor geschrieben',
      'Die Universität wurde durch eine Spende gegründet',
      'Der Brief wurde von der Sekretärin geschrieben',
    ],
    explanation: 'Von (person agent) vs durch (impersonal cause). Dative case with von.',
  },
  'statal-passive': {
    id: 'b2-statal-passive',
    category: 'passive',
    level: 'B2',
    name: 'Statal Passive (Zustandspassiv mit sein)',
    description: 'State of being: sein + past participle (vs processual: werden)',
    examples: [
      'Das Fenster ist geschlossen (state)',
      'Das Fenster wird geschlossen (action)',
      'Das Auto ist repariert (state)',
    ],
    explanation: 'Sein + participle = state; werden + participle = action. Same form, different meaning.',
  },
  'conditional-sentences': {
    id: 'b2-conditional-sentences',
    category: 'conjunction',
    level: 'B2',
    name: 'Conditional Sentences (Konditionalsätze)',
    description: 'If-then structures with present and subjunctive',
    examples: [
      'Wenn ich Zeit habe, komme ich (real)',
      'Wenn ich Zeit hätte, würde ich kommen (unreal)',
      'Wenn ich Zeit gehabt hätte, wäre ich gekommen (impossible)',
    ],
    explanation: 'Real conditions: present indicative. Unreal: Konjunktiv II. Past unreality: Konjunktiv II perfect.',
  },
  'extended-adjective-attribution': {
    id: 'b2-extended-adjectives',
    category: 'adjective',
    level: 'B2',
    name: 'Extended Adjective Attribution (Erweiterte Nominalggruppe)',
    description: 'Adjectives with additional modifiers: der lange, elegante, dunkelblau gefärbte Mantel',
    examples: [
      'Der von dem Künstler handgemalte Tisch',
      'Die in Deutschland hergestellten Autos',
      'Das auf hohem Niveau unterrichtete Fach',
    ],
    explanation: 'Extended adjective phrases can precede nouns. Contains participles, prepositional phrases.',
  },
  'noun-clause-with-infinitive': {
    id: 'b2-infinitive-clauses',
    category: 'verb-form',
    level: 'B2',
    name: 'Infinitive Clauses (Infinitivsätze)',
    description: 'Clauses with zu + infinitive: um...zu, anstatt...zu, statt...zu',
    examples: [
      'Ich gehe in die Schule, um Deutsch zu lernen',
      'Statt zu arbeiten, schlief er',
      'Er kam an, anstatt rechtzeitig zu kommen',
    ],
    explanation: 'Infinitive clauses with zu. Common with purpose (um...zu), alternatives (statt...zu).',
  },
  'causative-construction': {
    id: 'b2-causative-construction',
    category: 'verb-form',
    level: 'B2',
    name: 'Causative Construction (Kausativkonstruktion)',
    description: 'lassen + infinitive: Ich lasse das Auto reparieren',
    examples: [
      'Ich lasse das Auto reparieren',
      'Sie lässt sich die Haare schneiden',
      'Er ließ das Haus renovieren',
    ],
    explanation: 'Causative construction with lassen + infinitive. Subject causes someone else to perform the action.',
  },
};

/**
 * CEFR C1 - Advanced Level
 * Complex passive structures, advanced conjunctions, nuanced meanings
 */
export const C1_GRAMMAR: Record<string, GrammarPoint> = {
  'permissive-passive': {
    id: 'c1-permissive-passive',
    category: 'passive',
    level: 'C1',
    name: 'Permissive Passive (sich lassen construction)',
    description: 'sich lassen + infinitive for passive meaning: Das lässt sich nicht machen',
    examples: [
      'Das Auto lässt sich reparieren',
      'Das Problem lässt sich lösen',
      'Diese Theorie lässt sich nicht beweisen',
    ],
    explanation: 'Sich lassen + infinitive expresses possibility or permission. More nuanced than regular passive.',
  },
  'gerund-nominalization': {
    id: 'c1-gerund',
    category: 'verb-form',
    level: 'C1',
    name: 'Nominalized Infinitive (Gerund)',
    description: 'Infinitive used as noun: Das Lesen ist wichtig, das Schreiben auch',
    examples: [
      'Das Lernen ist wichtig',
      'Das Verstehen kommt mit Zeit',
      'Das Schreiben großer Arbeiten ist schwierig',
    ],
    explanation: 'Capitalize infinitive to make it a noun (neuter). Use in philosophical/abstract contexts.',
  },
  'advanced-conditional': {
    id: 'c1-advanced-conditionals',
    category: 'conjunction',
    level: 'C1',
    name: 'Advanced Conditional Forms',
    description: 'Mixed tenses, implied conditions, counterfactual scenarios',
    examples: [
      'Wäre ich älter gewesen, hätte ich es verstanden',
      'Hätte ich das gewusst, würde es anders sein',
      'Sollte es regnen, werden wir bleiben',
    ],
    explanation: 'C1: Complex conditional logic. Mixture of tenses for counterfactual scenarios.',
  },
};

/**
 * CEFR C2 - Mastery Level
 * Idiomatic expressions, stylistic variations, archaic forms
 */
export const C2_GRAMMAR: Record<string, GrammarPoint> = {
  'subjunctive-in-literature': {
    id: 'c2-subjunctive-literature',
    category: 'mood',
    level: 'C2',
    name: 'Subjunctive in Literature (Konjunktiv in Literatur)',
    description: 'Old-fashioned or poetic uses of subjunctive: Es möge ihm gut gehen',
    examples: [
      'Es möge ihm gut gehen',
      'Gott segne dich',
      'Der Himmel erbarme sich',
    ],
    explanation: 'C2: Archaic subjunctive in poetry and formal wishes. Rarely used in modern German.',
  },
};

/**
 * Get all grammar points organized by CEFR level
 */
export const ALL_GRAMMAR_POINTS: Record<CEFRLevel, Record<string, GrammarPoint>> = {
  A1: A1_GRAMMAR,
  A2: A2_GRAMMAR,
  B1: B1_GRAMMAR,
  B2: B2_GRAMMAR,
  C1: C1_GRAMMAR,
  C2: C2_GRAMMAR,
};

/**
 * Flatten all grammar points into a single lookup object
 */
export function getAllGrammarPointsFlat(): Record<string, GrammarPoint> {
  const flat: Record<string, GrammarPoint> = {};
  Object.values(ALL_GRAMMAR_POINTS).forEach((levelGrammar) => {
    Object.assign(flat, levelGrammar);
  });
  return flat;
}

/**
 * Get grammar points up to a specific CEFR level (inclusive)
 */
export function getGrammarPointsUpToLevel(level: CEFRLevel): Record<string, GrammarPoint> {
  const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const maxIndex = levels.indexOf(level);
  
  const result: Record<string, GrammarPoint> = {};
  for (let i = 0; i <= maxIndex; i++) {
    Object.assign(result, ALL_GRAMMAR_POINTS[levels[i]]);
  }
  return result;
}

/**
 * Get grammar points at a specific CEFR level
 */
export function getGrammarPointsByLevel(level: CEFRLevel): Record<string, GrammarPoint> {
  return ALL_GRAMMAR_POINTS[level];
}

/**
 * Get grammar points by category
 */
export function getGrammarPointsByCategory(category: GrammarCategory): GrammarPoint[] {
  const all = getAllGrammarPointsFlat();
  return Object.values(all).filter((point) => point.category === category);
}
