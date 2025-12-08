import React, { useState } from 'react';
import { SentenceAnalysis, GrammarPoint, VocabularyPoint, CEFRLevel } from '../../types/grammar';
import { GRAMMAR_COLOR_MAP, VOCAB_LEVEL_COLORS, DEFAULT_GRAMMAR_COLOR } from './constants';
import { HighlightRegion } from './types';
import { isValidPosition, getOverlappingRegions, getVocabAtPosition } from './utils';

interface HighlightedSentenceProps {
  sentence: SentenceAnalysis;
  onGrammarPointClick?: (sentenceIndex: number, pointIndex: number) => void;
  sentenceIndex: number;
  selectedCEFRLevels?: CEFRLevel[];
}

const HighlightedSentence: React.FC<HighlightedSentenceProps> = ({ sentence, onGrammarPointClick, sentenceIndex, selectedCEFRLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] }) => {

  // Build highlighted spans from grammar points using POSITIONS (not text)
  // Keep ALL points, but track which to display based on CEFR filter
  const allPoints = [...sentence.grammarPoints].sort((a, b) => a.position.start - b.position.start);
  
  // Get vocabulary points (if any)
  const vocabPoints = sentence.vocabularyPoints || [];
  
  // Build highlight regions - use positions directly, allow overlapping
  const highlightRegions: HighlightRegion[] = [];
  
  // Add all points as regions, using their position data and original index
  sentence.grammarPoints.forEach((point, originalIndex) => {
    // Handle multi-range positions (new) or single position (legacy)
    const positionsArray = point.positions 
      ? point.positions 
      : (point.position ? [point.position] : []);
    
    // Create unique group ID for this grammar point
    const groupId = `point-${originalIndex}`;
    
    // Add each position range
    positionsArray.forEach((pos, rangeIndex) => {
      // Validate positions are within sentence bounds and actually point to text
      if (isValidPosition(pos.start, pos.end, sentence.sentence.length)) {
        // Only add to regions if this point's CEFR level is selected
        if (selectedCEFRLevels.includes(point.level)) {
          highlightRegions.push({
            start: pos.start,
            end: pos.end,
            type: point.type,
            explanation: point.explanation,
            originalIndex, // Store the original index from sentence.grammarPoints
            level: point.level,
            rangeIndex,
            groupId, // Same group ID for all ranges of this point
            confidence: (point as any).confidence ?? 0,
          });
        }
      }
    });
  });
  
  // Sort regions by start position, then by length (longer first for better visibility)
  highlightRegions.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (b.end - b.start) - (a.end - a.start);
  });
  // Build non-overlapping segments using a sweep-line algorithm
  type Event = { pos: number; kind: 'start' | 'end'; idx: number };
  const events: Event[] = [];
  highlightRegions.forEach((r, i) => {
    events.push({ pos: r.start, kind: 'start', idx: i });
    events.push({ pos: r.end, kind: 'end', idx: i });
  });

  // Sort events by position; when positions tie, process 'end' before 'start'
  events.sort((a, b) => a.pos - b.pos || (a.kind === b.kind ? 0 : (a.kind === 'end' ? -1 : 1)));

  const segments: Array<{ start: number; end: number; regions: number[] }> = [];
  const active = new Set<number>();
  let prevPos = 0;

  for (const ev of events) {
    if (ev.pos > prevPos && active.size > 0) {
      segments.push({ start: prevPos, end: ev.pos, regions: Array.from(active) });
    }

    if (ev.kind === 'start') active.add(ev.idx);
    else active.delete(ev.idx);

    prevPos = ev.pos;
  }

  // Optionally merge adjacent segments with identical region sets
  const mergedSegments: typeof segments = [];
  for (const seg of segments) {
    const last = mergedSegments[mergedSegments.length - 1];
    const key = seg.regions.slice().sort((a, b) => a - b).join(',');
    const lastKey = last ? last.regions.slice().sort((a, b) => a - b).join(',') : null;
    if (last && last.end === seg.start && lastKey === key) {
      last.end = seg.end; // merge
    } else {
      mergedSegments.push({ ...seg });
    }
  }

  // Track which segment key is hovered so we can prefer highest-confidence region on hover
  const [hoveredSegKey, setHoveredSegKey] = useState<string | null>(null);

  const parts: React.ReactElement[] = [];
  let cursor = 0;

  const pushTextWithVocab = (from: number, to: number) => {
    const text = sentence.sentence.substring(from, to);
    const elems = renderTextWithVocabulary(text, from, vocabPoints);
    elems.forEach((el, i) => parts.push(React.cloneElement(el, { key: `text-${from}-${to}-${i}` })));
  };

  for (const seg of mergedSegments) {
    if (cursor < seg.start) {
      pushTextWithVocab(cursor, seg.start);
    }

    const segText = sentence.sentence.substring(seg.start, seg.end);
    const regions = seg.regions.map(i => highlightRegions[i]);

    // Choose primary region by longest length as fallback
    let fallbackPrimary = regions[0];
    for (const r of regions) {
      if ((r.end - r.start) > (fallbackPrimary.end - fallbackPrimary.start)) fallbackPrimary = r;
    }

    const allExplanations = regions.map(r => `[${r.level}] ${r.type.toUpperCase()}: ${r.explanation}`).join('\n');

    const vocabHere = getVocabAtPosition(seg.start, seg.end, vocabPoints);

    // Hover state selection: we prefer the highest-confidence region when the user hovers this segment
    const segKey = `seg-${seg.start}-${seg.end}`;
    // Compute highest-confidence region for this segment
    const layersByConfidence = regions.slice().sort((a, b) => (a.confidence ?? 0) - (b.confidence ?? 0));
    const highestConfidenceRegion = regions.slice().sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))[0] || fallbackPrimary;

    parts.push(
      <span
        key={`seg-${seg.start}-${seg.end}`}
        className={`px-1 rounded transition-colors cursor-pointer relative group ${
          vocabHere ? 'underline decoration-dashed decoration-2 decoration-green-500' : ''
        }`}
        onMouseEnter={() => setHoveredSegKey && setHoveredSegKey(segKey)}
        onMouseLeave={() => setHoveredSegKey && setHoveredSegKey(null)}
        onClick={(e) => {
          e.stopPropagation();
          // If there's a hovered segment match, choose the highest-confidence region; otherwise fallback
          const chosen = (hoveredSegKey === segKey) ? highestConfidenceRegion : fallbackPrimary;
          onGrammarPointClick?.(sentenceIndex, chosen.originalIndex);
        }}
        title={allExplanations}
      >
        {/* Background layers (stacked) - render from low -> high confidence so higher overlays are visible */}
        {layersByConfidence.map((layer, li) => (
          <span
            key={`layer-${seg.start}-${seg.end}-${li}`}
            className={`${GRAMMAR_COLOR_MAP[layer.type as GrammarPoint['type']] || DEFAULT_GRAMMAR_COLOR} absolute inset-0 rounded pointer-events-none bg-opacity-60`}
            style={{ zIndex: li + 1 }}
          />
        ))}

        {/* Text content above backgrounds */}
        <span className="relative" style={{ zIndex: 50 }}>
          {renderTextWithVocabulary(segText, seg.start, vocabPoints)}
        </span>

        {regions.length > 1 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            {regions.length}
          </span>
        )}
      </span>
    );

    cursor = seg.end;
  }

  // Append remaining text after last segment
  if (cursor < sentence.sentence.length) {
    pushTextWithVocab(cursor, sentence.sentence.length);
  }

  return (
    <div className="text-base leading-relaxed relative">
      {parts}
    </div>
  );
};

// Helper function to render text with vocabulary underlines
function renderTextWithVocabulary(
  text: string,
  baseOffset: number,
  vocabPoints: VocabularyPoint[]
): React.ReactElement[] {
  const parts: React.ReactElement[] = [];
  
  // Find vocabulary points that overlap with this text segment
  const relevantVocab = vocabPoints.filter(v => 
    v.startIndex >= baseOffset && v.endIndex <= baseOffset + text.length
  ).sort((a, b) => a.startIndex - b.startIndex);
  
  let lastIdx = 0;
  
  relevantVocab.forEach((vocab, idx) => {
    const relativeStart = vocab.startIndex - baseOffset;
    const relativeEnd = vocab.endIndex - baseOffset;
    
    // Text before vocabulary
    if (relativeStart > lastIdx) {
      parts.push(
        <span key={`text-${idx}`}>
          {text.substring(lastIdx, relativeStart)}
        </span>
      );
    }
    
    // Determine decoration color based on vocabulary level
    const decorationColor = VOCAB_LEVEL_COLORS[vocab.level] || 'decoration-gray-500';
    
    // Vocabulary word with underline
    parts.push(
      <span
        key={`vocab-${idx}`}
        className={`underline decoration-dashed decoration-2 ${decorationColor}`}
      >
        {text.substring(relativeStart, relativeEnd)}
      </span>
    );
    
    lastIdx = relativeEnd;
  });
  
  // Remaining text
  if (lastIdx < text.length) {
    parts.push(
      <span key="text-end">
        {text.substring(lastIdx)}
      </span>
    );
  }
  
  return parts;
}

export default HighlightedSentence;
