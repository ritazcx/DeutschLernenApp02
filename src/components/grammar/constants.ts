/**
 * Shared constants for grammar components
 * Centralizes color mappings and type labels to avoid duplication
 */

import { GrammarPoint } from '../../types/grammar';

// CEFR level color mapping for vocabulary highlighting
export const VOCAB_LEVEL_COLORS: Record<string, string> = {
  'A1': 'decoration-red-500',
  'A2': 'decoration-orange-500',
  'B1': 'decoration-green-500',
  'B2': 'decoration-blue-500',
  'C1': 'decoration-purple-500',
  'C2': 'decoration-pink-500',
};

// Text color variant for vocabulary labels
export const VOCAB_LEVEL_TEXT_COLORS: Record<string, string> = {
  'A1': 'text-red-600',
  'A2': 'text-orange-600',
  'B1': 'text-green-600',
  'B2': 'text-blue-600',
  'C1': 'text-purple-600',
  'C2': 'text-pink-600',
};

// Grammar type color mapping for highlights
export const GRAMMAR_COLOR_MAP: Record<GrammarPoint['type'], string> = {
  // Modern backend categories
  'tense': 'bg-blue-200 hover:bg-blue-300',
  'case': 'bg-green-200 hover:bg-green-300',
  'mood': 'bg-purple-200 hover:bg-purple-300',
  'voice': 'bg-red-200 hover:bg-red-300',
  'verb-form': 'bg-indigo-200 hover:bg-indigo-300',
  'preposition': 'bg-yellow-200 hover:bg-yellow-300',
  'conjunction': 'bg-orange-200 hover:bg-orange-300',
  'agreement': 'bg-pink-200 hover:bg-pink-300',
  'word-order': 'bg-cyan-200 hover:bg-cyan-300',
  'clause': 'bg-purple-200 hover:bg-purple-300',
  'article': 'bg-lime-200 hover:bg-lime-200',
  'reflexive-verb': 'bg-rose-200 hover:bg-rose-300',
  'passive': 'bg-red-200 hover:bg-red-300',
  'article': 'bg-lime-200 hover:bg-lime-300',
  'pronoun': 'bg-emerald-200 hover:bg-emerald-300',
  'adjective': 'bg-teal-200 hover:bg-teal-300',
  'noun': 'bg-violet-200 hover:bg-violet-300',
  'separable-verb': 'bg-rose-200 hover:bg-rose-300',
  'modal-verb': 'bg-amber-200 hover:bg-amber-300',
  'collocation': 'bg-fuchsia-200 hover:bg-fuchsia-300',
  'special-construction': 'bg-slate-200 hover:bg-slate-300',
  'functional-verb': 'bg-lime-200 hover:bg-lime-300',
  'participial-attribute': 'bg-sky-200 hover:bg-sky-300',
  // Legacy types (backward compatibility)
  'verb': 'bg-blue-200 hover:bg-blue-300',
  'clause': 'bg-purple-200 hover:bg-purple-300',
  'special': 'bg-pink-200 hover:bg-pink-300',
  'special_construction': 'bg-slate-200 hover:bg-slate-300',
  'subjunctive': 'bg-rose-200 hover:bg-rose-300',
  'modal': 'bg-amber-200 hover:bg-amber-300',
  'functional_verb': 'bg-lime-200 hover:bg-lime-300',
  'advanced_conjunction': 'bg-fuchsia-200 hover:bg-fuchsia-300',
  'nominalization': 'bg-teal-200 hover:bg-teal-300',
  'passive': 'bg-red-200 hover:bg-red-300',
};

// Grammar type labels and color indicators
export const GRAMMAR_TYPE_LABELS: Record<GrammarPoint['type'], { label: string; color: string }> = {
  // Modern backend categories
  'tense': { label: 'Tense', color: 'bg-blue-200' },
  'case': { label: 'Case', color: 'bg-green-200' },
  'mood': { label: 'Mood', color: 'bg-purple-200' },
  'voice': { label: 'Voice', color: 'bg-red-200' },
  'verb-form': { label: 'Verb Form', color: 'bg-indigo-200' },
  'preposition': { label: 'Preposition', color: 'bg-yellow-200' },
  'conjunction': { label: 'Conjunction', color: 'bg-orange-200' },
  'agreement': { label: 'Agreement', color: 'bg-pink-200' },
  'word-order': { label: 'Word Order', color: 'bg-cyan-200' },
  'clause': { label: 'Subordinate Clause', color: 'bg-purple-200' },
  'article': { label: 'Article', color: 'bg-lime-200' },
  'reflexive-verb': { label: 'Reflexive Verb', color: 'bg-rose-200' },
  'passive': { label: 'Passive Voice', color: 'bg-red-200' },
  'article': { label: 'Article', color: 'bg-lime-200' },
  'pronoun': { label: 'Pronoun', color: 'bg-emerald-200' },
  'adjective': { label: 'Adjective', color: 'bg-teal-200' },
  'noun': { label: 'Noun', color: 'bg-violet-200' },
  'separable-verb': { label: 'Separable Verb', color: 'bg-rose-200' },
  'modal-verb': { label: 'Modal Verb', color: 'bg-amber-200' },
  'collocation': { label: 'Collocation', color: 'bg-fuchsia-200' },
  'special-construction': { label: 'Special Construction', color: 'bg-slate-200' },
  'functional-verb': { label: 'Functional Verb', color: 'bg-lime-200' },
  'participial-attribute': { label: 'Participial Attribute', color: 'bg-sky-200' },
  // Legacy types (backward compatibility)
  'verb': { label: 'Verb', color: 'bg-blue-200' },
  'clause': { label: 'Clause', color: 'bg-purple-200' },
  'special': { label: 'Special', color: 'bg-pink-200' },
  'special_construction': { label: 'Special Construction', color: 'bg-slate-200' },
  'subjunctive': { label: 'Subjunctive', color: 'bg-rose-200' },
  'modal': { label: 'Modal Verb', color: 'bg-amber-200' },
  'functional_verb': { label: 'Functional Verb', color: 'bg-lime-200' },
  'advanced_conjunction': { label: 'Advanced Conjunction', color: 'bg-fuchsia-200' },
  'nominalization': { label: 'Nominalization', color: 'bg-teal-200' },
  'passive': { label: 'Passive Voice', color: 'bg-red-200' },
};

// Default fallback colors
export const DEFAULT_GRAMMAR_COLOR = 'bg-gray-200 hover:bg-gray-300';
export const DEFAULT_TYPE_LABEL = { label: 'Unknown', color: 'bg-gray-200' };
