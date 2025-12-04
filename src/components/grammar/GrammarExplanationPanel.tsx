import React, { useEffect } from 'react';
import { SentenceAnalysis, GrammarPoint, CEFRLevel } from '../../types/grammar';
import { GRAMMAR_TYPE_LABELS, VOCAB_LEVEL_TEXT_COLORS } from './constants';

interface GrammarExplanationPanelProps {
  sentence: SentenceAnalysis;
  selectedGrammarPoint?: number;
  selectedCEFRLevels?: CEFRLevel[];
}

const GrammarExplanationPanel: React.FC<GrammarExplanationPanelProps> = ({ sentence, selectedGrammarPoint, selectedCEFRLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] }) => {
  // Filter grammar points by selected CEFR levels
  const filteredGrammarPoints = sentence.grammarPoints.filter(point => 
    selectedCEFRLevels.includes(point.level)
  );

  // Scroll to selected point when selectedGrammarPoint changes
  useEffect(() => {
    if (selectedGrammarPoint !== undefined) {
      const element = document.querySelector(`[data-grammar-index="${selectedGrammarPoint}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedGrammarPoint]);
  
  if (!sentence || !sentence.grammarPoints) {
    return <div className="p-4 text-slate-500">No grammar analysis available</div>;
  }

  return (
    <div className="space-y-6">
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
          {filteredGrammarPoints.map((point) => {
            const originalIndex = sentence.grammarPoints.indexOf(point);
            const typeInfo = GRAMMAR_TYPE_LABELS[point.type as GrammarPoint['type']] || { label: point.type, color: 'bg-gray-400' };
            const isSelected = selectedGrammarPoint === originalIndex;
            
            return (
              <div
                key={originalIndex}
                data-grammar-index={originalIndex}
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
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${VOCAB_LEVEL_TEXT_COLORS[point.level] || 'bg-gray-200 text-gray-700'}`}>
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
                  <span className={`text-xs font-semibold ${VOCAB_LEVEL_TEXT_COLORS[vocab.level] || 'text-gray-600'}`}>
                    {vocab.level}
                  </span>
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
