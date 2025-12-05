/**
 * Shared constants used across multiple grammar detectors
 * Extracted to avoid duplication and improve maintainability
 */

/**
 * Common separable prefixes in German
 * Used by: SeparableVerbDetector, ModalVerbDetector
 */
export const SEPARABLE_PREFIXES = [
  'ab', 'an', 'auf', 'aus', 'bei', 'durch', 'ein', 'fort', 'her',
  'hin', 'los', 'mit', 'nach', 'statt', 'vor', 'weg', 'weiter', 'zu', 'zurück'
];

/**
 * Modal verbs in German (infinitive forms and common lemmas)
 * Used by: ModalVerbDetector and other detectors checking for modal constructions
 * Note: Includes both infinitive forms and common present-tense forms that spaCy may return as lemmas
 */
export const MODAL_VERBS = [
  // Infinitive forms (primary lemmas)
  'können', 'müssen', 'sollen', 'wollen', 'dürfen', 'mögen', 'möchten',
  // Common present-tense forms (fallback for edge cases where spaCy doesn't lemmatize)
  'kann', 'muss', 'soll', 'will', 'darf', 'mag'
];
