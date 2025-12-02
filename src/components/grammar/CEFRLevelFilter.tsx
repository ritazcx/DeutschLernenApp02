import React from 'react';
import { CEFRLevel } from '../../types/grammar';

interface CEFRLevelFilterProps {
  selectedLevels: CEFRLevel[];
  onLevelChange: (level: CEFRLevel) => void;
}

const CEFRLevelFilter: React.FC<CEFRLevelFilterProps> = ({ selectedLevels, onLevelChange }) => {
  const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  
  // Group levels into pairs for visual organization
  const levelPairs: Array<[CEFRLevel, CEFRLevel]> = [
    ['A1', 'A2'],
    ['B1', 'B2'],
    ['C1', 'C2']
  ];

  return (
    <div className="flex gap-6">
      {levelPairs.map(([level1, level2]) => (
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
