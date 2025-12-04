/**
 * Utility functions for grammar highlighting
 */

import { VocabularyPoint } from '../../types/grammar';
import { HighlightRegion } from './types';

/**
 * Validate if a position points to valid text within the sentence
 */
export const isValidPosition = (start: number, end: number, sentenceLength: number): boolean => {
  if (start < 0 || end > sentenceLength || start >= end) return false;
  return true;
};

/**
 * Get all regions that overlap with a given position range
 */
export const getOverlappingRegions = (
  start: number,
  end: number,
  regions: HighlightRegion[]
): HighlightRegion[] => {
  return regions.filter(region =>
    !(region.end <= start || region.start >= end) // Overlaps if not completely separate
  );
};

/**
 * Find vocabulary point at a given position
 */
export const getVocabAtPosition = (
  start: number,
  end: number,
  vocabPoints: VocabularyPoint[]
): VocabularyPoint | null => {
  return vocabPoints.find(v => 
    (start >= v.startIndex && start < v.endIndex) ||
    (end > v.startIndex && end <= v.endIndex) ||
    (start <= v.startIndex && end >= v.endIndex)
  ) || null;
};
