import React, { useState } from 'react';

interface GrammarPoint {
  id: string;
  category: string;
  level: string;
  text: string;
  startPos: number;
  endPos: number;
  explanation: string;
  details?: Record<string, any>;
  tokenIndices: number[];
}

interface MorphologicalDetailsProps {
  point: GrammarPoint;
  onClose: () => void;
}

/**
 * Display morphological details for a grammar point
 */
const MorphologicalDetails: React.FC<MorphologicalDetailsProps> = ({ point, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">
            {point.category.charAt(0).toUpperCase() + point.category.slice(1)}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-700">Text</p>
            <p className="text-gray-800 font-mono">"{point.text}"</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700">Level</p>
            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
              {point.level}
            </span>
          </div>

          {point.details && Object.keys(point.details).length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Morphological Features</p>
              <div className="bg-gray-50 p-3 rounded space-y-1">
                {Object.entries(point.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">{key}:</span>
                    <span className="text-gray-800 font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Explanation</p>
            <p className="text-gray-700 text-sm">{point.explanation}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};

interface GrammarPointDisplayProps {
  points: GrammarPoint[];
  sentence: string;
}

/**
 * Display grammar points with highlighting
 */
export const GrammarPointDisplay: React.FC<GrammarPointDisplayProps> = ({
  points,
  sentence,
}) => {
  const [selectedPoint, setSelectedPoint] = useState<GrammarPoint | null>(null);

  // Sort points by position for proper rendering
  const sortedPoints = [...points].sort((a, b) => a.startPos - b.startPos);

  // Build highlighted sentence
  const segments: (string | React.ReactNode)[] = [];
  let lastEnd = 0;

  for (const point of sortedPoints) {
    // Add text before this point
    if (lastEnd < point.startPos) {
      segments.push(sentence.substring(lastEnd, point.startPos));
    }

    // Add highlighted text
    const highlightedText = sentence.substring(point.startPos, point.endPos);
    const color = getCategoryColor(point.category);

    segments.push(
      <span
        key={`${point.id}-${point.startPos}`}
        className={`${color} cursor-pointer hover:opacity-80 transition-opacity`}
        onClick={() => setSelectedPoint(point)}
        title={point.category}
      >
        {highlightedText}
      </span>
    );

    lastEnd = point.endPos;
  }

  // Add remaining text
  if (lastEnd < sentence.length) {
    segments.push(sentence.substring(lastEnd));
  }

  return (
    <div>
      <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 mb-4">
        <p className="text-gray-800">{segments}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 mb-4">
        {sortedPoints.map((point) => (
          <div
            key={point.id}
            onClick={() => setSelectedPoint(point)}
            className="p-3 bg-gray-50 border-l-4 rounded cursor-pointer hover:bg-gray-100 transition-colors"
            style={{ borderColor: getCategoryColorBorder(point.category) }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-800">
                  {point.category.toUpperCase()}
                </p>
                <p className="text-sm text-gray-600">"{point.text}"</p>
                <p className="text-sm text-gray-700 mt-1">{point.explanation}</p>
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {point.level}
              </span>
            </div>
          </div>
        ))}
      </div>

      {selectedPoint && (
        <MorphologicalDetails
          point={selectedPoint}
          onClose={() => setSelectedPoint(null)}
        />
      )}
    </div>
  );
};

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    tense: 'bg-yellow-200 text-yellow-900',
    case: 'bg-purple-200 text-purple-900',
    mood: 'bg-pink-200 text-pink-900',
    voice: 'bg-cyan-200 text-cyan-900',
    verb_form: 'bg-orange-200 text-orange-900',
    preposition: 'bg-green-200 text-green-900',
    conjunction: 'bg-blue-200 text-blue-900',
    agreement: 'bg-red-200 text-red-900',
    word_order: 'bg-indigo-200 text-indigo-900',
    article: 'bg-amber-200 text-amber-900',
    pronoun: 'bg-violet-200 text-violet-900',
    adjective: 'bg-lime-200 text-lime-900',
    noun: 'bg-rose-200 text-rose-900',
    separable_verb: 'bg-sky-200 text-sky-900',
    modal_verb: 'bg-fuchsia-200 text-fuchsia-900',
    collocation: 'bg-slate-200 text-slate-900',
    special_construction: 'bg-teal-200 text-teal-900',
  };
  return colors[category] || 'bg-gray-200 text-gray-900';
}

function getCategoryColorBorder(category: string): string {
  const colors: Record<string, string> = {
    tense: '#eab308',
    case: '#a855f7',
    mood: '#ec4899',
    voice: '#06b6d4',
    verb_form: '#f97316',
    preposition: '#22c55e',
    conjunction: '#3b82f6',
    agreement: '#ef4444',
    word_order: '#6366f1',
    article: '#f59e0b',
    pronoun: '#8b5cf6',
    adjective: '#84cc16',
    noun: '#f43f5e',
    separable_verb: '#0ea5e9',
    modal_verb: '#d946ef',
    collocation: '#64748b',
    special_construction: '#14b8a6',
  };
  return colors[category] || '#d1d5db';
}
