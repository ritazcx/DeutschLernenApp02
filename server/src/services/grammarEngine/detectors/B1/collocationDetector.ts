/**
 * Collocation Detector (refactored)
 *
 * Production-grade, dependency-driven detector for German collocations.
 * - Uses a small DSL of collocation definitions
 * - Dependency-aware: prefers direct dependency relations but falls back to
 *   clause/window-based heuristics when necessary
 * - Handles reflexive constructions, verb+prep, verb+noun, and separable verbs
 */

import { BaseGrammarDetector, DetectionResult, SentenceData, TokenData } from '../shared/baseDetector';
import { GrammarCategory } from '../../cefr-taxonomy';
import patterns from './collocationPatterns';
import depUtils from './dependencyUtils';

type CollocationDef = typeof patterns[number];

const REFLEXIVE_PRONOUNS = new Set(['mich', 'dich', 'sich', 'uns', 'euch', 'mir', 'dir', 'ihm', 'ihr', 'ihnen']);

export class CollocationDetector extends BaseGrammarDetector {
  name = 'CollocationDetector';
  category: GrammarCategory = 'collocation';

  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];
    const tokens = sentence.tokens;

    // iterate verbs in sentence and attempt to match patterns (dependency-first)
    const verbCandidates = tokens.filter(t => this.isVerbOrAux(t) || t.pos === 'VERB');
    for (const verbToken of verbCandidates) {
      const verbIdx = verbToken.index;

      for (const def of patterns) {
        // (separable patterns are handled here as well) — allow processing
        // quick lemma filter
        if (!this.lemmaMatches(verbToken.lemma, def.verb?.lemma || (def as any).verb)) continue;

        // run a dependency-driven matcher per definition
        const res = this.matchDefinitionDependency(tokens, verbIdx, def);
        if (!res) continue;

        const { indices, matchedTokens, confidence, type } = res;

        // Do not emit separable-pattern results from this detector (handled by SeparableVerbDetector)
        if (def.type === 'separable') continue;

        // human-readable label
        let humanCollocation = def.id;
        if (def.type === 'reflexive-prep') {
          humanCollocation = `sich ${def.verb.lemma} ${def.prep?.lemma || ''}`.trim();
        } else if (def.type === 'verb-prep') {
          humanCollocation = `${def.verb.lemma} ${def.prep?.lemma || ''}`.trim();
        } else if (def.type === 'verb-noun') {
          humanCollocation = `${def.noun?.lemma || ''} ${def.verb.lemma}`.trim();
        }

        const grammarPoint = {
          id: `b1-collocation-${def.id}`,
          category: 'collocation' as const,
          level: 'B1' as const,
          name: humanCollocation,
          description: `Collocation: ${humanCollocation}`,
          examples: (def as any).examples || [],
          explanation: 'Common collocation',
        };

        const position = this.calculateMultiplePositions(tokens, indices);
        results.push(this.createResult(grammarPoint, position[0], confidence, {
          collocation: humanCollocation,
          definition: def,
          tokens: matchedTokens,
          words: matchedTokens.map(t => t.text),
          positions: position,
          type: type || def.type,
        }));
      }
    }

    // Note: separable verb emission is disabled in this detector to avoid
    // duplicating detections handled by the dedicated separable-verb detector.
    // We keep the helper methods for analysis/debugging but do not push
    // collocation results for separable patterns here.

    return results;
  }

  // Dependency-first matcher
  private matchDefinitionDependency(tokens: TokenData[], verbIdx: number, def: CollocationDef | any) {
    // Tier 1: strict dependency
    if (def.type === 'reflexive-prep') {
      const refl = this.findReflexiveForVerb(tokens, verbIdx, { strict: true, allowedDeps: def.reflexive?.dep });
      if (refl) {
        // find noun object with case->prep child matching
        const noun = this.findNounObject(tokens, verbIdx, def.noun?.lemma || null, { strict: true });
        // If noun not specified, accept any oblique object carrying the required case/prep
        const prep = this.findPrepForVerb(tokens, verbIdx, def.prep?.lemma, { strict: true });
        if (prep) return { indices: [verbIdx, refl.index, prep.index], matchedTokens: [tokens[verbIdx], refl, prep], confidence: 0.98, type: def.type };
      }

      // Tier 2: looser dependency (reflexive in subtree, prep attached to verb)
      const refl2 = this.findReflexiveForVerb(tokens, verbIdx, { strict: false, allowedDeps: def.reflexive?.dep });
      const prep2 = this.findPrepForVerb(tokens, verbIdx, def.prep?.lemma, { strict: false });
      if (refl2 && prep2) return { indices: [verbIdx, refl2.index, prep2.index], matchedTokens: [tokens[verbIdx], refl2, prep2], confidence: 0.85, type: def.type };

      // Tier 3: surface fallback (small window)
      const refl3 = this.findReflexiveForVerb(tokens, verbIdx, { fallbackWindow: 3, allowedDeps: def.reflexive?.dep });
      const prep3 = this.findPrepForVerb(tokens, verbIdx, def.prep?.lemma, { fallbackWindow: 3 });
      if (refl3 && prep3) return { indices: [verbIdx, refl3.index, prep3.index], matchedTokens: [tokens[verbIdx], refl3, prep3], confidence: 0.6, type: def.type };

      return null;
    }

    if (def.type === 'verb-prep') {
      const prep = this.findPrepForVerb(tokens, verbIdx, def.prep?.lemma, { strict: true });
      if (prep) return { indices: [verbIdx, prep.index], matchedTokens: [tokens[verbIdx], prep], confidence: 0.92, type: def.type };

      const prep2 = this.findPrepForVerb(tokens, verbIdx, def.prep?.lemma, { strict: false });
      if (prep2 && depUtils.inSameClause(tokens, verbIdx, prep2.index)) return { indices: [verbIdx, prep2.index], matchedTokens: [tokens[verbIdx], prep2], confidence: 0.8, type: def.type };

      const prep3 = this.findPrepForVerb(tokens, verbIdx, def.prep?.lemma, { fallbackWindow: 3 });
      if (prep3) return { indices: [verbIdx, prep3.index], matchedTokens: [tokens[verbIdx], prep3], confidence: 0.55, type: def.type };

      return null;
    }

    if (def.type === 'verb-noun') {
      const noun = this.findNounObject(tokens, verbIdx, def.noun?.lemma, { strict: true });
      if (noun) return { indices: [verbIdx, noun.index], matchedTokens: [tokens[verbIdx], noun], confidence: 0.93, type: def.type };

        const noun2 = this.findNounObject(tokens, verbIdx, def.noun?.lemma, { strict: false });
        if (noun2 && depUtils.inSameClause(tokens, verbIdx, noun2.index)) return { indices: [verbIdx, noun2.index], matchedTokens: [tokens[verbIdx], noun2], confidence: 0.75, type: def.type };

      const noun3 = this.findNounObject(tokens, verbIdx, def.noun?.lemma, { fallbackWindow: 3 });
      if (noun3) return { indices: [verbIdx, noun3.index], matchedTokens: [tokens[verbIdx], noun3], confidence: 0.5, type: def.type };

      return null;
    }

    if (def.type === 'separable') {
      const part = this.findSeparableParticle(tokens, verbIdx, def.separable?.particle, { strict: true });
      if (part) return { indices: [verbIdx, part.index], matchedTokens: [tokens[verbIdx], part], confidence: 0.95, type: def.type };

      const part2 = this.findSeparableParticle(tokens, verbIdx, def.separable?.particle, { strict: false, fallbackWindow: 3 });
      if (part2) return { indices: [verbIdx, part2.index], matchedTokens: [tokens[verbIdx], part2], confidence: 0.7, type: def.type };

      return null;
    }

    return null;
  }

  // Find reflexive pronoun attached to verb (direct child or close in clause)
  private findReflexiveForVerb(tokens: TokenData[], verbIdx: number, opts: { strict?: boolean; fallbackWindow?: number; allowedDeps?: string[] } = {}): TokenData | null {
    const strict = opts.strict === true;
    const fallbackWindow = opts.fallbackWindow || 0;
    // Copy allowed deps to avoid mutating DSL arrays passed in opts
    const allowedDeps = Array.isArray(opts.allowedDeps) && opts.allowedDeps.length > 0 ? [...opts.allowedDeps] : ['obj', 'iobj', 'refl', 'oa', 'dobj'];
    // Ensure we accept 'dobj' for reflexive pronouns in many test fixtures
    if (!allowedDeps.includes('dobj')) allowedDeps.push('dobj');

    // Tier 1 (strict): must be PRON, have morph Reflex=Yes OR be explicit reflexive lemma/text
    // and be a direct child with allowed dep
    const children = depUtils.getChildren(tokens, verbIdx);
    for (const c of children) {
      if (c.pos === 'PRON' && ((c.morph?.Reflex === 'Yes' || c.morph?.Reflex === 'Ref') || c.lemma === 'sich' || REFLEXIVE_PRONOUNS.has(c.text.toLowerCase()))) {
        if (allowedDeps.includes(c.dep)) return c;
      }
    }

    if (strict) return null;

    // Tier 2: reflexive inside verb subtree (descendants) BUT must be in same clause
    const descendants = depUtils.getDescendants(tokens, verbIdx);
    for (const d of descendants) {
      if (d.pos === 'PRON' && ((d.morph?.Reflex === 'Yes' || d.morph?.Reflex === 'Ref') || d.lemma === 'sich' || REFLEXIVE_PRONOUNS.has(d.text.toLowerCase()))) {
        // require dep to be allowed by DSL to avoid matching other pronouns
        if (allowedDeps.includes(d.dep) && depUtils.inSameClause(tokens, verbIdx, d.index)) return d;
      }
    }

    // Tier 3: small window fallback (require same clause)
    if (fallbackWindow > 0) {
      for (let i = Math.max(0, verbIdx - fallbackWindow); i <= Math.min(tokens.length - 1, verbIdx + fallbackWindow); i++) {
        const t = tokens[i];
        if (t.pos === 'PRON' && (t.morph?.Reflex === 'Yes' || t.morph?.Reflex === 'Ref' || t.lemma === 'sich')) {
          // Only accept if dep is allowed by DSL and in same clause
          if (allowedDeps.includes(t.dep) && depUtils.inSameClause(tokens, verbIdx, t.index)) return t;
        }
      }
    }

    return null;
  }

  // Find preposition associated with verb according to dependency chain
  private findPrepForVerb(tokens: TokenData[], verbIdx: number, prepLemma?: string, opts: { strict?: boolean; fallbackWindow?: number } = {}): TokenData | null {
    const strict = opts.strict === true;
    const fallbackWindow = opts.fallbackWindow || 0;

    // Tier 1 (strict): find noun child of verb (obj/obl/oa/dobj) that has a case child (preposition)
    const children = depUtils.getChildren(tokens, verbIdx);
    for (const c of children) {
      if (['obj', 'obl', 'oa', 'dobj'].includes(c.dep) && (c.pos === 'NOUN' || c.pos === 'PROPN')) {
        // look for case child of this noun
        const caseChild = depUtils.findChild(tokens, c.index, (t) => (t.dep === 'case' || t.dep === 'prep') && this.matchPreposition(t, prepLemma || ''));
        if (caseChild) return caseChild;
      }
    }

    if (strict) return null;

    // Tier 2: preposition attached directly to verb (dep=prep/op)
    const prepAttached = depUtils.findChild(tokens, verbIdx, (t) => (t.dep === 'prep' || t.dep === 'op') && this.matchPreposition(t, prepLemma || ''));
    if (prepAttached) {
      // even attached children should be in the same clause
      if (depUtils.inSameClause(tokens, verbIdx, prepAttached.index)) return prepAttached;
    }

    // Tier 3: preposition inside verb subtree is allowed ONLY if it is in the same clause
    // and its head is a noun/pronoun (i.e., part of an NP governed by the verb)
    const descendants = depUtils.getDescendants(tokens, verbIdx);
    for (const d of descendants) {
      if (this.isPreposition(d) && this.matchPreposition(d, prepLemma || '') && depUtils.inSameClause(tokens, verbIdx, d.index)) {
        const headIdx = depUtils.getHeadIndex(tokens, d.index);
        if (headIdx !== null) {
          const headTok = tokens[headIdx];
          if (headTok && (headTok.pos === 'NOUN' || headTok.pos === 'PROPN' || headTok.pos === 'PRON')) return d;
        }
      }
    }

    // Tier 4: small window fallback (require clause boundary)
    if (fallbackWindow && fallbackWindow > 0) {
      for (let i = Math.max(0, verbIdx - fallbackWindow); i <= Math.min(tokens.length - 1, verbIdx + fallbackWindow); i++) {
        const t = tokens[i];
        if (this.isPreposition(t) && this.matchPreposition(t, prepLemma || '') && depUtils.inSameClause(tokens, verbIdx, t.index)) return t;
      }
    }

    return null;
  }

  // Find noun object related to verb (dependency-first)
  private findNounObject(tokens: TokenData[], verbIdx: number, nounLemma?: string | null, opts: { strict?: boolean; fallbackWindow?: number } = {}): TokenData | null {
    const strict = opts.strict === true;
    const fallbackWindow = opts.fallbackWindow || 0;

    // Tier 1 (strict): direct child of verb with matching dep
    const children = depUtils.getChildren(tokens, verbIdx);
    for (const c of children) {
      if (['obj', 'dobj', 'oa', 'obl', 'nk'].includes(c.dep) && (c.pos === 'NOUN' || c.pos === 'PROPN')) {
        // only accept strict matches when nounLemma is provided
        if (!nounLemma) continue;
        if (c.lemma && this.lemmaMatches(c.lemma, nounLemma)) return c;
      }
    }

    if (strict) return null;

    // Tier 2: noun descendant inside verb subtree BUT only accept if lemma matches and same clause
    const descendants = depUtils.getDescendants(tokens, verbIdx);
    for (const d of descendants) {
      if ((d.pos === 'NOUN' || d.pos === 'PROPN') && nounLemma && (d.lemma && this.lemmaMatches(d.lemma, nounLemma)) && depUtils.inSameClause(tokens, verbIdx, d.index)) return d;
    }

    // Tier 3: small window fallback (require same clause and lemma match)
    if (fallbackWindow && fallbackWindow > 0 && nounLemma) {
      for (let i = Math.max(0, verbIdx - fallbackWindow); i <= Math.min(tokens.length - 1, verbIdx + fallbackWindow); i++) {
        const t = tokens[i];
        if ((t.pos === 'NOUN' || t.pos === 'PROPN') && (t.lemma && this.lemmaMatches(t.lemma, nounLemma)) && depUtils.inSameClause(tokens, verbIdx, t.index)) return t;
      }
    }

    return null;
  }

  // Find separable particle for a verb
  private findSeparableParticle(tokens: TokenData[], verbIdx: number, particleLemma?: string, opts: { strict?: boolean; fallbackWindow?: number } = {}): TokenData | null {
    const strict = opts.strict === true;
    const fallbackWindow = opts.fallbackWindow || 0;

    // Prefer dependency-based prt child attached to verb
    const partChild = depUtils.findChild(tokens, verbIdx, (t) => (t.dep === 'prt' || t.tag === 'PTKVZ' || t.pos === 'PART') && (t.lemma === particleLemma || t.text.toLowerCase() === (particleLemma || '').toLowerCase()));
    if (partChild) return partChild;

    if (strict) return null;

    // Fallback: search verb subtree for particle but require same clause
    const descendants = depUtils.getDescendants(tokens, verbIdx);
    for (const d of descendants) {
      if ((d.tag === 'PTKVZ' || d.pos === 'PART' || d.dep === 'prt') && (d.lemma === particleLemma || d.text.toLowerCase() === (particleLemma || '').toLowerCase()) && depUtils.inSameClause(tokens, verbIdx, d.index)) return d;
    }

    // Final fallback: small window surface match (require same clause)
    if (fallbackWindow && fallbackWindow > 0) {
      for (let i = Math.max(0, verbIdx - fallbackWindow); i <= Math.min(tokens.length - 1, verbIdx + fallbackWindow); i++) {
        const t = tokens[i];
        if ((t.tag === 'PTKVZ' || t.pos === 'PART' || t.dep === 'prt') && (t.lemma === particleLemma || t.text.toLowerCase() === (particleLemma || '').toLowerCase()) && depUtils.inSameClause(tokens, verbIdx, t.index)) return t;
      }
    }

    return null;
  }

  // Lightweight compatibility wrapper used by the separable-pass earlier.
  // Returns array of matches like the original helper did so the later
  // separable-pass loop can remain unchanged.
  private findSeparableMatches(tokens: TokenData[], def: any) {
    const matches: Array<{ indices: number[]; tokens: TokenData[] }> = [];
    const verbs = tokens.filter(t => this.lemmaMatches(t.lemma, def.verb?.lemma || (def as any).verb));
    for (const v of verbs) {
      const part = this.findSeparableParticle(tokens, v.index, def.separable?.particle, { strict: true });
      if (part) {
        matches.push({ indices: [v.index, part.index], tokens: [v, part] });
        continue;
      }

      const part2 = this.findSeparableParticle(tokens, v.index, def.separable?.particle, { strict: false, fallbackWindow: 3 });
      if (part2) matches.push({ indices: [v.index, part2.index], tokens: [v, part2] });
    }
    return matches;
  }

  // Lenient lemma matcher (preserve previous behavior)
  private lemmaMatches(tokenLemma?: string, patternLemma?: string): boolean {
    if (!tokenLemma || !patternLemma) return false;
    const a = tokenLemma.toLowerCase();
    const b = patternLemma.toLowerCase();
    if (a === b) return true;
    if (a.startsWith(b) || b.startsWith(a)) return true;
    const strip = (s: string) => s.replace(/(en|ern|n)$/i, '');
    if (strip(a) === strip(b)) return true;
    return false;
  }
}

export default CollocationDetector;