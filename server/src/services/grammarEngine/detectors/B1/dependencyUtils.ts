import { TokenData } from '../shared/baseDetector';

/**
 * Dependency utilities for token tree traversal.
 * These helpers normalize head resolution (head may be token text or numeric index)
 * and provide common traversal utilities used by dependency-driven detectors.
 */

export function getHeadIndex(tokens: TokenData[], index: number): number | null {
  const token = tokens[index];
  if (!token) return null;

  // If head is a number (some pipelines), use it directly
  // but TokenData.head is typically a string in this repo; accept both.
  // @ts-ignore
  const headRaw: any = token.head;
  if (typeof headRaw === 'number') {
    return headRaw >= 0 && headRaw < tokens.length ? headRaw : null;
  }

  // If head is a string, prefer numeric string (index) only. Text-based
  // resolution (matching token.text or token.lemma) is lossy and can produce
  // incorrect head links — avoid it. If your upstream parser provides
  // token.head as text, prefer switching to numeric head indices.
  if (typeof headRaw === 'string') {
    const parsed = parseInt(headRaw, 10);
    if (!isNaN(parsed)) {
      return parsed >= 0 && parsed < tokens.length ? parsed : null;
    }
    // If head is textual (some test fixtures provide head as token.text/lemma),
    // we allow resolution only when it maps uniquely to a single token. This
    // avoids lossy or ambiguous text-based resolution while still supporting
    // test fixtures that use head text.
    const matches = tokens.filter((t) => t.text === headRaw || t.lemma === headRaw);
    if (matches.length === 1) return matches[0].index;
    return null;
  }

  return null;
}

export function getChildren(tokens: TokenData[], headIndex: number): TokenData[] {
  return tokens.filter((t, idx) => {
    const h = getHeadIndex(tokens, idx);
    return h === headIndex;
  });
}

export function findChild(tokens: TokenData[], headIndex: number, predicate: (t: TokenData) => boolean): TokenData | null {
  const children = getChildren(tokens, headIndex);
  for (const c of children) {
    if (predicate(c)) return c;
  }
  return null;
}

export function getDescendants(tokens: TokenData[], headIndex: number): TokenData[] {
  const out: TokenData[] = [];
  const stack = [headIndex];
  while (stack.length) {
    const idx = stack.pop() as number;
    const children = getChildren(tokens, idx);
    for (const c of children) {
      out.push(c);
      stack.push(c.index);
    }
  }
  return out;
}

export function inSameClause(tokens: TokenData[], indexA: number, indexB: number): boolean {
  // Simple clause check: ensure no subordinating conjunction (SCONJ) or comma between
  const start = Math.min(indexA, indexB);
  const end = Math.max(indexA, indexB);
  for (let i = start; i <= end; i++) {
    const t = tokens[i];
    if (!t) continue;
    if (t.pos === 'SCONJ' || (t.pos === 'PUNCT' && t.text === ',')) return false;
  }
  return true;
}

export default {
  getHeadIndex,
  getChildren,
  getDescendants,
  findChild,
  inSameClause,
};
