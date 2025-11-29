import React from 'react';
import { SentenceAnalysis, GrammarPoint } from '../../types/grammar';

interface GrammarExplanationPanelProps {
  sentence: SentenceAnalysis;
}

const typeLabels: Record<GrammarPoint['type'], { label: string; color: string }> = {
  // Legacy types
  verb: { label: 'Verb', color: 'bg-blue-400' },
  case: { label: 'Case', color: 'bg-green-400' },
  clause: { label: 'Clause', color: 'bg-purple-400' },
  conjunction: { label: 'Conjunction', color: 'bg-orange-400' },
  special: { label: 'Special', color: 'bg-pink-400' },
  // New B2/C1 types - matched to HighlightedSentence colors
  collocation: { label: 'Collocation', color: 'bg-amber-400' },
  special_construction: { label: 'Special Construction', color: 'bg-indigo-400' },
  subjunctive: { label: 'Subjunctive', color: 'bg-rose-400' },
  modal: { label: 'Modal Verb', color: 'bg-cyan-400' },
  functional_verb: { label: 'Functional Verb', color: 'bg-lime-400' },
  advanced_conjunction: { label: 'Advanced Conjunction', color: 'bg-fuchsia-400' },
  nominalization: { label: 'Nominalization', color: 'bg-teal-400' },
  passive: { label: 'Passive Voice', color: 'bg-emerald-400' },
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
                  <div className={`w-[18px] h-[18px] rounded-full ${typeInfo.color} flex-shrink-0 shadow-sm`} />
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
    </div>
  );
};

export default GrammarExplanationPanel;
