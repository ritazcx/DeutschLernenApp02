import React from 'react';
import { SentenceAnalysis, GrammarPoint } from '../../types/grammar';

interface GrammarExplanationPanelProps {
  sentence: SentenceAnalysis;
}

const typeLabels: Record<GrammarPoint['type'], { label: string; icon: string }> = {
  verb: { label: 'Verb', icon: '🔵' },
  case: { label: 'Case', icon: '🟢' },
  clause: { label: 'Clause', icon: '🟣' },
  conjunction: { label: 'Conjunction', icon: '🟠' },
  special: { label: 'Special', icon: '🔴' },
};

const GrammarExplanationPanel: React.FC<GrammarExplanationPanelProps> = ({ sentence }) => {
  return (
    <div className="max-h-[70vh] overflow-y-auto space-y-6">
      {/* Sentence */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Sentence:</h3>
        <p className="text-base text-slate-900 italic border-l-4 border-slate-300 pl-3">
          {sentence.sentence}
        </p>
      </div>

      {/* Structure */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Structure:</h3>
        <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg font-mono">
          {sentence.structure}
        </p>
      </div>

      {/* Overall Explanation */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Explanation:</h3>
        <p className="text-sm text-slate-700 leading-relaxed">
          {sentence.explanation}
        </p>
      </div>

      {/* Grammar Points */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Grammar Points:</h3>
        <div className="space-y-3">
          {sentence.grammarPoints.map((point, index) => (
            <div
              key={index}
              className="p-3 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start gap-2 mb-1">
                <span className="text-lg">{typeLabels[point.type].icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      {typeLabels[point.type].label}
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default GrammarExplanationPanel;
