/**
 * Subcomponents for GrammarExplanationPanel
 */

import React from 'react';
import { GrammarPoint, VocabularyPoint } from '../../types/grammar';
import { GRAMMAR_TYPE_LABELS, VOCAB_LEVEL_TEXT_COLORS } from './constants';

interface GrammarPointCardProps {
  point: GrammarPoint;
  index: number;
  isSelected: boolean;
}

export const GrammarPointCard: React.FC<GrammarPointCardProps> = ({ point, index, isSelected }) => {
  const typeInfo = GRAMMAR_TYPE_LABELS[point.type as GrammarPoint['type']] || { 
    label: point.type, 
    color: 'bg-gray-400' 
  };

  return (
    <div
      data-grammar-index={index}
      className={`p-3 border rounded-lg transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start gap-2 mb-1">
        <div className={`w-3 h-3 ${typeInfo.color} rounded flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              {typeInfo.label}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              VOCAB_LEVEL_TEXT_COLORS[point.level] || 'bg-gray-200 text-gray-700'
            }`}>
              {point.level}
            </span>
            <span className="text-sm font-semibold text-slate-900">
              "{point.text}"
            </span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            {point.explanation}
          </p>
        </div>
      </div>
    </div>
  );
};

interface VocabularyCardProps {
  vocab: VocabularyPoint;
}

export const VocabularyCard: React.FC<VocabularyCardProps> = ({ vocab }) => {
  return (
    <div className="p-2 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
      <div className="flex items-baseline gap-2">
        <span className="font-semibold text-sm text-slate-900">
          {vocab.article && <span className="text-slate-500 mr-1">{vocab.article}</span>}
          {vocab.word}
        </span>
        <span className={`text-xs font-semibold ${
          VOCAB_LEVEL_TEXT_COLORS[vocab.level] || 'text-gray-600'
        }`}>
          {vocab.level}
        </span>
      </div>
      {vocab.meaning_en && (
        <p className="text-xs text-slate-600 mt-1">{vocab.meaning_en}</p>
      )}
    </div>
  );
};
