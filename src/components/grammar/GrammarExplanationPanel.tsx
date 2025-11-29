import React from 'react';
import { SentenceAnalysis, GrammarPoint } from '../../types/grammar';

interface GrammarExplanationPanelProps {
  sentence: SentenceAnalysis;
}

const typeLabels: Record<GrammarPoint['type'], { label: string; icon: string }> = {
  // Legacy types
  verb: { label: 'Verb', icon: '🔵' },
  case: { label: 'Case', icon: '🟢' },
  clause: { label: 'Clause', icon: '🟣' },
  conjunction: { label: 'Conjunction', icon: '🟠' },
  special: { label: 'Special', icon: '🩷' },
  // New B2/C1 types - matched to HighlightedSentence colors
  collocation: { label: 'Collocation', icon: '🟡' },
  special_construction: { label: 'Special Construction', icon: '🔵' },
  subjunctive: { label: 'Subjunctive', icon: '🌹' },
  modal: { label: 'Modal Verb', icon: '🔷' },
  functional_verb: { label: 'Functional Verb', icon: '💚' },
  advanced_conjunction: { label: 'Advanced Conjunction', icon: '💜' },
  nominalization: { label: 'Nominalization', icon: '💎' },
  passive: { label: 'Passive Voice', icon: '🟢' },
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
            const typeInfo = typeLabels[point.type as GrammarPoint['type']] || { label: point.type, icon: '⚪' };
            return (
              <div
                key={index}
                className="p-3 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-lg">{typeInfo.icon}</span>
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
