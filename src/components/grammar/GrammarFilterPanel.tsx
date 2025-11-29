import React from 'react';
import { GrammarType, CEFRLevel, GRAMMAR_CATEGORIES, GRAMMAR_TYPE_LABELS } from '../../types/grammar';

interface GrammarFilterPanelProps {
  selectedTypes: GrammarType[];
  onTypeToggle: (type: GrammarType) => void;
  onLevelToggle: (level: CEFRLevel, selectAll: boolean) => void;
  selectedVocabularyLevels: string[];
  onVocabularyLevelToggle: (level: string) => void;
}

const GrammarFilterPanel: React.FC<GrammarFilterPanelProps> = ({
  selectedTypes,
  onTypeToggle,
  onLevelToggle,
  selectedVocabularyLevels,
  onVocabularyLevelToggle
}) => {
  const isLevelFullySelected = (level: CEFRLevel): boolean => {
    const category = GRAMMAR_CATEGORIES.find(cat => cat.level === level);
    if (!category) return false;
    return category.types.every(type => selectedTypes.includes(type));
  };

  const isLevelPartiallySelected = (level: CEFRLevel): boolean => {
    const category = GRAMMAR_CATEGORIES.find(cat => cat.level === level);
    if (!category) return false;
    const selectedCount = category.types.filter(type => selectedTypes.includes(type)).length;
    return selectedCount > 0 && selectedCount < category.types.length;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 h-fit sticky top-4">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Grammar Filters</h3>
      <p className="text-sm text-slate-600 mb-4">
        Select which grammar points to highlight
      </p>

      <div className="space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
        {GRAMMAR_CATEGORIES.map((category) => {
          const fullySelected = isLevelFullySelected(category.level);
          const partiallySelected = isLevelPartiallySelected(category.level);

          return (
            <div key={category.level} className="border-b border-slate-200 pb-4 last:border-b-0">
              {/* Level header with select all/none */}
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={fullySelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = partiallySelected && !fullySelected;
                      }
                    }}
                    onChange={(e) => onLevelToggle(category.level, e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
                    {category.label}
                  </span>
                </label>
              </div>

              {/* Grammar types */}
              <div className="ml-6 space-y-2">
                {category.types.map((type) => (
                  <label key={type} className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type)}
                      onChange={() => onTypeToggle(type)}
                      className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-slate-700 group-hover:text-indigo-600">
                      {GRAMMAR_TYPE_LABELS[type]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        {/* Vocabulary Annotation Section */}
        <div className="border-t border-slate-300 pt-4 mt-6">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Vocabulary Annotation</h4>
          <p className="text-xs text-slate-600 mb-3">
            Underline words by CEFR level
          </p>
          <div className="space-y-2">
            {['B1', 'B2', 'C1'].map((level) => (
              <label key={level} className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedVocabularyLevels.includes(level)}
                  onChange={() => onVocabularyLevelToggle(level)}
                  className="w-3.5 h-3.5 text-green-600 border-slate-300 rounded focus:ring-2 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-slate-700 group-hover:text-green-600">
                  {level} Vocabulary
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrammarFilterPanel;
