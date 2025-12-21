/**
 * CEFR Level Configuration
 */

import { CEFRLevel } from '../grammar';

export const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const CEFR_LEVEL_PAIRS: Array<[CEFRLevel, CEFRLevel]> = [
  ['A1', 'A2'],
  ['B1', 'B2'],
  ['C1', 'C2']
];

export const CEFR_LEVEL_DESCRIPTIONS: Record<CEFRLevel, string> = {
  'A1': 'Beginner',
  'A2': 'Elementary',
  'B1': 'Intermediate',
  'B2': 'Upper Intermediate',
  'C1': 'Advanced',
  'C2': 'Proficiency'
};

