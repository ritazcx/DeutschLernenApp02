/**
 * Morphology Analyzer
 * Extracts grammatical features from spaCy morphology data
 */

export interface MorphFeatures {
  animacy?: string;
  aspect?: string;
  case?: string;
  definite?: string;
  degree?: string;
  gender?: string;
  mood?: string;
  number?: string;
  numType?: string;
  person?: string;
  poss?: string;
  pronType?: string;
  reflex?: string;
  tense?: string;
  verbForm?: string;
  voice?: string;
}

/**
 * Parse morphological features from spaCy morphology dict
 * spaCy returns features like: "Case=Nom|Gender=Masc|Number=Sing"
 */
export function parseMorphFeatures(morphDict: Record<string, string>): MorphFeatures {
  return {
    animacy: morphDict['Animacy'],
    aspect: morphDict['Aspect'],
    case: morphDict['Case'],
    definite: morphDict['Definite'],
    degree: morphDict['Degree'],
    gender: morphDict['Gender'],
    mood: morphDict['Mood'],
    number: morphDict['Number'],
    numType: morphDict['NumType'],
    person: morphDict['Person'],
    poss: morphDict['Poss'],
    pronType: morphDict['PronType'],
    reflex: morphDict['Reflex'],
    tense: morphDict['Tense'],
    verbForm: morphDict['VerbForm'],
    voice: morphDict['Voice'],
  };
}

/**
 * Extract case from morphology
 * Returns: Nom, Acc, Dat, Gen or 'unknown'
 */
export function extractCase(morph: MorphFeatures | Record<string, string>): string {
  const features = isMorphFeatures(morph) ? morph : parseMorphFeatures(morph);
  return features.case || 'unknown';
}

/**
 * Extract tense from morphology
 * Returns: Pres, Past, Fut, or 'unknown'
 */
export function extractTense(morph: MorphFeatures | Record<string, string>): string {
  const features = isMorphFeatures(morph) ? morph : parseMorphFeatures(morph);
  return features.tense || 'unknown';
}

/**
 * Extract mood from morphology
 * Returns: Ind (indicative), Cond (conditional), Imp (imperative), Subj (subjunctive)
 */
export function extractMood(morph: MorphFeatures | Record<string, string>): string {
  const features = isMorphFeatures(morph) ? morph : parseMorphFeatures(morph);
  return features.mood || 'unknown';
}

/**
 * Extract gender from morphology
 * Returns: Masc (masculine), Fem (feminine), Neut (neuter)
 */
export function extractGender(morph: MorphFeatures | Record<string, string>): string {
  const features = isMorphFeatures(morph) ? morph : parseMorphFeatures(morph);
  return features.gender || 'unknown';
}

/**
 * Extract number from morphology
 * Returns: Sing (singular), Plur (plural)
 */
export function extractNumber(morph: MorphFeatures | Record<string, string>): string {
  const features = isMorphFeatures(morph) ? morph : parseMorphFeatures(morph);
  return features.number || 'unknown';
}

/**
 * Extract person from morphology
 * Returns: 1, 2, 3 (person), or 'unknown'
 */
export function extractPerson(morph: MorphFeatures | Record<string, string>): string {
  const features = isMorphFeatures(morph) ? morph : parseMorphFeatures(morph);
  return features.person || 'unknown';
}

/**
 * Extract verb form from morphology
 * Returns: Fin (finite), Inf (infinitive), Part (participle), Ger (gerund), Conv (converb)
 */
export function extractVerbForm(morph: MorphFeatures | Record<string, string>): string {
  const features = isMorphFeatures(morph) ? morph : parseMorphFeatures(morph);
  return features.verbForm || 'unknown';
}

/**
 * Extract voice from morphology
 * Returns: Act (active), Pass (passive), Cau (causative), Mid (middle), Refl (reflexive)
 */
export function extractVoice(morph: MorphFeatures | Record<string, string>): string {
  const features = isMorphFeatures(morph) ? morph : parseMorphFeatures(morph);
  return features.voice || 'unknown';
}

/**
 * Check if morph is MorphFeatures object
 */
function isMorphFeatures(morph: MorphFeatures | Record<string, string>): morph is MorphFeatures {
  return typeof morph === 'object' && ('case' in morph || 'tense' in morph);
}

/**
 * Format morphological features for display
 * Example: "Nominative, Singular, Present Indicative"
 */
export function formatMorphForDisplay(morph: MorphFeatures | Record<string, string>): string {
  const features = isMorphFeatures(morph) ? morph : parseMorphFeatures(morph);
  const parts: string[] = [];

  // Case
  if (features.case) {
    const caseNames: Record<string, string> = {
      Nom: 'Nominative',
      Acc: 'Accusative',
      Dat: 'Dative',
      Gen: 'Genitive',
    };
    parts.push(caseNames[features.case] || features.case);
  }

  // Gender
  if (features.gender) {
    const genderNames: Record<string, string> = {
      Masc: 'Masculine',
      Fem: 'Feminine',
      Neut: 'Neuter',
    };
    parts.push(genderNames[features.gender] || features.gender);
  }

  // Number
  if (features.number) {
    const numberNames: Record<string, string> = {
      Sing: 'Singular',
      Plur: 'Plural',
    };
    parts.push(numberNames[features.number] || features.number);
  }

  // Tense
  if (features.tense) {
    const tenseNames: Record<string, string> = {
      Pres: 'Present',
      Past: 'Past',
      Fut: 'Future',
    };
    parts.push(tenseNames[features.tense] || features.tense);
  }

  // Mood
  if (features.mood) {
    const moodNames: Record<string, string> = {
      Ind: 'Indicative',
      Cond: 'Conditional',
      Imp: 'Imperative',
      Subj: 'Subjunctive',
    };
    parts.push(moodNames[features.mood] || features.mood);
  }

  return parts.join(', ');
}

/**
 * Get detailed morphological description
 */
export function getMorphDescription(morph: MorphFeatures | Record<string, string>): string {
  const features = isMorphFeatures(morph) ? morph : parseMorphFeatures(morph);
  const formatted = formatMorphForDisplay(features);
  return formatted || 'Unknown morphology';
}

/**
 * Check if a token has a specific morphological feature
 */
export function hasMorphFeature(
  morph: MorphFeatures | Record<string, string>,
  featureName: keyof MorphFeatures,
  value: string,
): boolean {
  const features = isMorphFeatures(morph) ? morph : parseMorphFeatures(morph);
  return features[featureName] === value;
}

/**
 * Get human-readable case name
 */
export function getCaseName(caseCode: string): string {
  const names: Record<string, string> = {
    Nom: 'Nominative',
    Acc: 'Accusative',
    Dat: 'Dative',
    Gen: 'Genitive',
  };
  return names[caseCode] || caseCode;
}

/**
 * Get human-readable tense name
 */
export function getTenseName(tenseCode: string): string {
  const names: Record<string, string> = {
    Pres: 'Present',
    Past: 'Past',
    Fut: 'Future',
  };
  return names[tenseCode] || tenseCode;
}

/**
 * Get human-readable mood name
 */
export function getMoodName(moodCode: string): string {
  const names: Record<string, string> = {
    Ind: 'Indicative',
    Cond: 'Conditional',
    Imp: 'Imperative',
    Subj: 'Subjunctive',
  };
  return names[moodCode] || moodCode;
}

/**
 * Get human-readable gender name
 */
export function getGenderName(genderCode: string): string {
  const names: Record<string, string> = {
    Masc: 'Masculine',
    Fem: 'Feminine',
    Neut: 'Neuter',
  };
  return names[genderCode] || genderCode;
}

/**
 * Get human-readable number name
 */
export function getNumberName(numberCode: string): string {
  const names: Record<string, string> = {
    Sing: 'Singular',
    Plur: 'Plural',
  };
  return names[numberCode] || numberCode;
}

/**
 * Get article based on case, gender, number
 */
export function getArticle(
  caseCode: string,
  genderCode: string,
  numberCode: string,
  indefinite: boolean = false,
): string {
  // Definite articles
  const definiteArticles: Record<string, Record<string, Record<string, string>>> = {
    Nom: {
      Masc: { Sing: 'der', Plur: 'die' },
      Fem: { Sing: 'die', Plur: 'die' },
      Neut: { Sing: 'das', Plur: 'die' },
    },
    Acc: {
      Masc: { Sing: 'den', Plur: 'die' },
      Fem: { Sing: 'die', Plur: 'die' },
      Neut: { Sing: 'das', Plur: 'die' },
    },
    Dat: {
      Masc: { Sing: 'dem', Plur: 'den' },
      Fem: { Sing: 'der', Plur: 'den' },
      Neut: { Sing: 'dem', Plur: 'den' },
    },
    Gen: {
      Masc: { Sing: 'des', Plur: 'der' },
      Fem: { Sing: 'der', Plur: 'der' },
      Neut: { Sing: 'des', Plur: 'der' },
    },
  };

  // Indefinite articles
  const indefiniteArticles: Record<string, Record<string, Record<string, string>>> = {
    Nom: {
      Masc: { Sing: 'ein', Plur: 'ein' },
      Fem: { Sing: 'eine', Plur: 'ein' },
      Neut: { Sing: 'ein', Plur: 'ein' },
    },
    Acc: {
      Masc: { Sing: 'einen', Plur: 'ein' },
      Fem: { Sing: 'eine', Plur: 'ein' },
      Neut: { Sing: 'ein', Plur: 'ein' },
    },
    Dat: {
      Masc: { Sing: 'einem', Plur: 'einen' },
      Fem: { Sing: 'einer', Plur: 'einen' },
      Neut: { Sing: 'einem', Plur: 'einen' },
    },
    Gen: {
      Masc: { Sing: 'eines', Plur: 'einer' },
      Fem: { Sing: 'einer', Plur: 'einer' },
      Neut: { Sing: 'eines', Plur: 'einer' },
    },
  };

  const articles = indefinite ? indefiniteArticles : definiteArticles;
  return (
    articles[caseCode]?.[genderCode]?.[numberCode] ||
    'unknown'
  );
}
