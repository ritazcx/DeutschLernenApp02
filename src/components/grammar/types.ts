/**
 * Shared type definitions for grammar components
 */

export interface HighlightRegion {
  start: number;
  end: number;
  type: string;
  explanation: string;
  originalIndex: number; // Index in sentence.grammarPoints
  level: string;
  rangeIndex: number; // Which range in multi-range group
  groupId: string; // Group related ranges together
}
