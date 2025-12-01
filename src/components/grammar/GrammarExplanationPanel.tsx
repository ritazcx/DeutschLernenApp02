import React, { useEffect, useRef } from 'react';
import { SentenceAnalysis, GrammarPoint } from '../../types/grammar';

interface GrammarExplanationPanelProps {
  sentence: SentenceAnalysis;
  selectedGrammarPoint?: number;
}

// CEFR level color mapping for vocabulary display
const vocabLevelColors: Record<string, string> = {
  'A1': 'text-red-600',
  'A2': 'text-orange-600',
  'B1': 'text-green-600',
  'B2': 'text-blue-600',
  'C1': 'text-purple-600',
  'C2': 'text-pink-600',
};

const typeLabels: Record<GrammarPoint['type'], { label: string; color: string }> = {
  // Backend categories with descriptive labels
  tense: { label: 'Tense', color: 'bg-blue-200' },
  case: { label: 'Case', color: 'bg-green-200' },
  mood: { label: 'Mood', color: 'bg-purple-200' },
  voice: { label: 'Voice', color: 'bg-red-200' },
  'verb-form': { label: 'Verb Form', color: 'bg-indigo-200' },
  preposition: { label: 'Preposition', color: 'bg-yellow-200' },
  conjunction: { label: 'Conjunction', color: 'bg-orange-200' },
  agreement: { label: 'Agreement', color: 'bg-pink-200' },
  'word-order': { label: 'Word Order', color: 'bg-cyan-200' },
  article: { label: 'Article', color: 'bg-lime-200' },
  pronoun: { label: 'Pronoun', color: 'bg-emerald-200' },
  adjective: { label: 'Adjective', color: 'bg-teal-200' },
  noun: { label: 'Noun', color: 'bg-violet-200' },
  'separable-verb': { label: 'Separable Verb', color: 'bg-rose-200' },
  'modal-verb': { label: 'Modal Verb', color: 'bg-amber-200' },
  collocation: { label: 'Collocation', color: 'bg-fuchsia-200' },
  'special-construction': { label: 'Special Construction', color: 'bg-slate-200' },
  // Legacy types (backward compatibility)
  verb: { label: 'Verb', color: 'bg-blue-200' },
  clause: { label: 'Clause', color: 'bg-purple-200' },
  special: { label: 'Special', color: 'bg-pink-200' },
  special_construction: { label: 'Special Construction', color: 'bg-slate-200' },
  subjunctive: { label: 'Subjunctive', color: 'bg-rose-200' },
  modal: { label: 'Modal Verb', color: 'bg-amber-200' },
  functional_verb: { label: 'Functional Verb', color: 'bg-lime-200' },
  advanced_conjunction: { label: 'Advanced Conjunction', color: 'bg-fuchsia-200' },
  nominalization: { label: 'Nominalization', color: 'bg-teal-200' },
  passive: { label: 'Passive Voice', color: 'bg-red-200' },
};

const GrammarExplanationPanel: React.FC<GrammarExplanationPanelProps> = ({ sentence, selectedGrammarPoint }) => {
  const grammarPointRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (selectedGrammarPoint !== undefined && grammarPointRefs.current[selectedGrammarPoint]) {
      grammarPointRefs.current[selectedGrammarPoint]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [selectedGrammarPoint]);
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
                ref={(el) => grammarPointRefs.current[index] = el}
                className={`p-3 border rounded-lg transition-colors ${
                  selectedGrammarPoint === index
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
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${vocabLevelColors[point.level] || 'bg-gray-200 text-gray-700'}`}>
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
                  <span className={`text-xs font-semibold ${vocabLevelColors[vocab.level] || 'text-gray-600'}`}>
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
