import React from 'react';
import { CEFRLevel } from '../../types/grammar';
import { CEFR_LEVEL_PAIRS } from '../../types/grammar/cefrConfig';

interface CEFRLevelFilterProps {
  selectedLevels: CEFRLevel[];
  onLevelChange: (level: CEFRLevel) => void;
}

const CEFRLevelFilter: React.FC<CEFRLevelFilterProps> = ({ selectedLevels, onLevelChange }) => {

  return (
    <div className="flex gap-6">
      {CEFR_LEVEL_PAIRS.map(([level1, level2]) => (
        <div key={`${level1}-${level2}`} className="flex flex-col gap-2">
          {[level1, level2].map((level) => (
            <label key={level} className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={selectedLevels.includes(level)}
                onChange={() => onLevelChange(level)}
                className="w-4 h-4 rounded border-slate-300 text-slate-900 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700">
                {level}
              </span>
            </label>
          ))}
        </div>
      ))}
    </div>
  );
};

export default CEFRLevelFilter;
