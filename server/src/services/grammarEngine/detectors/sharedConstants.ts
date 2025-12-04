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
  'hin', 'los', 'mit', 'nach', 'vor', 'weg', 'weiter', 'zu', 'zurück'
];

/**
 * Modal verbs in German
 * Used by: ModalVerbDetector and other detectors checking for modal constructions
 */
export const MODAL_VERBS = [
  'können', 'müssen', 'sollen', 'wollen', 'dürfen', 'mögen', 'möchten'
];
