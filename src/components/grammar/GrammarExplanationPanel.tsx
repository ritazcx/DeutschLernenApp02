import React from 'react';
import { SentenceAnalysis, GrammarPoint } from '../../types/grammar';

interface GrammarExplanationPanelProps {
  sentence: SentenceAnalysis;
}

const typeLabels: Record<GrammarPoint['type'], { label: string; color: string }> = {
  // Legacy types
  verb: { label: 'Verb', color: 'bg-blue-200' },
  case: { label: 'Case', color: 'bg-green-200' },
  clause: { label: 'Clause', color: 'bg-purple-200' },
  conjunction: { label: 'Conjunction', color: 'bg-orange-200' },
  special: { label: 'Special', color: 'bg-pink-200' },
  // New B2/C1 types - matched to HighlightedSentence colors
  collocation: { label: 'Collocation', color: 'bg-amber-200' },
  special_construction: { label: 'Special Construction', color: 'bg-indigo-200' },
  subjunctive: { label: 'Subjunctive', color: 'bg-rose-200' },
  modal: { label: 'Modal Verb', color: 'bg-cyan-200' },
  functional_verb: { label: 'Functional Verb', color: 'bg-lime-200' },
  advanced_conjunction: { label: 'Advanced Conjunction', color: 'bg-fuchsia-200' },
  nominalization: { label: 'Nominalization', color: 'bg-teal-200' },
  passive: { label: 'Passive Voice', color: 'bg-emerald-200' },
};

const GrammarExplanationPanel: React.FC<GrammarExplanationPanelProps> = ({ sentence }) => {
  if (!sentence || !sentence.grammarPoints) {
    return <div className="p-4 text-slate-500">No grammar analysis available</div>;
  }

  return (
    <div className="max-h-[70vh] overflow-y-auto space-y-6">
      {/* Translation */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Translation:</h3>
        <p className="text-base text-slate-900 italic border-l-4 border-blue-300 pl-3">
          {sentence.translation || 'No translation available'}
        </p>
      </div>

      {/* Grammar Points */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Grammar Points:</h3>
        <div className="space-y-3">
          {sentence.grammarPoints.map((point, index) => {
            const typeInfo = typeLabels[point.type as GrammarPoint['type']] || { label: point.type, color: 'bg-gray-400' };
            return (
              <div
                key={index}
                className="p-3 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start gap-2 mb-1">
                  <div className={`w-3 h-3 ${typeInfo.color} rounded flex-shrink-0 mt-0.5`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        {typeInfo.label}
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
          })}
        </div>
      </div>

      {/* Vocabulary */}
      {sentence.vocabularyPoints && sentence.vocabularyPoints.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Vocabulary:</h3>
          <div className="space-y-2">
            {sentence.vocabularyPoints.map((vocab, index) => (
              <div
                key={index}
                className="p-2 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm text-slate-900">
                    {vocab.article && <span className="text-slate-500 mr-1">{vocab.article}</span>}
                    {vocab.word}
                  </span>
                  <span className="text-xs text-green-600">{vocab.level}</span>
                </div>
                {vocab.meaning_en && (
                  <p className="text-xs text-slate-600 mt-1">{vocab.meaning_en}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GrammarExplanationPanel;
