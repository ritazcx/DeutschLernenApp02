import React, { useEffect } from 'react';
import { SentenceAnalysis, GrammarPoint, CEFRLevel } from '../../types/grammar';
import { GrammarPointCard, VocabularyCard } from './GrammarCards';
import { CEFR_LEVELS } from '../../types/grammar/cefrConfig';

interface GrammarExplanationPanelProps {
  sentence: SentenceAnalysis;
  selectedGrammarPoint?: number;
  selectedCEFRLevels?: CEFRLevel[];
}

const GrammarExplanationPanel: React.FC<GrammarExplanationPanelProps> = ({ 
  sentence, 
  selectedGrammarPoint, 
  selectedCEFRLevels = CEFR_LEVELS 
}) => {
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
            const isSelected = selectedGrammarPoint === originalIndex;
            
            return (
              <GrammarPointCard
                key={originalIndex}
                point={point}
                index={originalIndex}
                isSelected={isSelected}
              />
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
              <VocabularyCard key={index} vocab={vocab} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GrammarExplanationPanel;
