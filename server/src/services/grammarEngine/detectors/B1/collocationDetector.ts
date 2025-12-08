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
      // ensure we operate on the canonical verb head (prefer index-head resolution)
      const verbIdx = this.getCanonicalVerbIndex(tokens, verbToken.index);

      for (const def of patterns) {
        // (separable patterns are handled here as well) — allow processing
        // quick lemma filter — use canonical verb lemma when available
        const canonicalVerbLemma = tokens[verbIdx] && tokens[verbIdx].lemma ? tokens[verbIdx].lemma : verbToken.lemma;
        if (!this.lemmaMatches(canonicalVerbLemma, def.verb?.lemma || (def as any).verb)) continue;

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

        const orderedTokens = matchedTokens.slice().sort((a, b) => a.index - b.index);
        const positions = this.calculateMultiplePositions(tokens, indices);
        // Normalize a single continuous range for legacy consumers by taking
        // the min start and max end across all component token ranges.
        const positionRange = {
          start: Math.min(...positions.map(p => p.start)),
          end: Math.max(...positions.map(p => p.end)),
        };
        try {
          console.debug(`[collocationDetector][emit] pattern=${def.id} indices=${JSON.stringify(indices)} positionRange=${JSON.stringify(positionRange)} confidence=${confidence}`);
        } catch (e) {}
        results.push(this.createResult(grammarPoint, positionRange, confidence, {
          collocation: humanCollocation,
          definition: def,
          tokens: orderedTokens,
          words: orderedTokens.map(t => t.text),
          positions,
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
      // Debug: log pattern attempt and nearby candidates
      const maxDepth = def.depSignature?.maxDepth ?? 4;
      try {
        console.debug(`[collocationDetector] trying pattern=${def.id} verbIdx=${verbIdx} lemma=${tokens[verbIdx]?.lemma}`);
        const verbChildren = depUtils.getChildren(tokens, verbIdx).map(c => ({ idx: c.index, lemma: c.lemma, pos: c.pos, dep: c.dep, text: c.text }));
        console.debug(`[collocationDetector][${def.id}] verb-children:`, verbChildren);
      } catch (e) {
        // safe guard debug
      }

      const allowedReflDeps = def.depSignature?.reflexiveDeps || def.reflexive?.dep || undefined;
      const refl = this.findReflexiveForVerb(tokens, verbIdx, { strict: true, allowedDeps: allowedReflDeps, maxDepth, mustMatchDeps: def.depSignature?.mustMatchDeps, shouldMatchDeps: def.depSignature?.shouldMatchDeps });
      if (refl) {
        // find noun object with case->prep child matching
        const noun = this.findNounObject(tokens, verbIdx, def.noun?.lemma || null, { strict: true, nounDeps: def.depSignature?.nounDeps, verbDeps: def.depSignature?.verbDeps, mustMatchDeps: def.depSignature?.mustMatchDeps, shouldMatchDeps: def.depSignature?.shouldMatchDeps });
        // If noun not specified, accept any oblique object carrying the required case/prep
        const prep = this.findPrepForVerb(tokens, verbIdx, def.prep?.lemma, { strict: true, prepDeps: def.depSignature?.prepDeps, mustMatchDeps: def.depSignature?.mustMatchDeps, shouldMatchDeps: def.depSignature?.shouldMatchDeps, maxDepth });
        if (prep) return { indices: [verbIdx, refl.index, prep.index], matchedTokens: [tokens[verbIdx], refl, prep], confidence: 0.98, type: def.type };
      }

      // Tier 2: looser dependency (reflexive in subtree, prep attached to verb)
      const refl2 = this.findReflexiveForVerb(tokens, verbIdx, { strict: false, allowedDeps: allowedReflDeps, maxDepth, mustMatchDeps: def.depSignature?.mustMatchDeps, shouldMatchDeps: def.depSignature?.shouldMatchDeps });
      const prep2 = this.findPrepForVerb(tokens, verbIdx, def.prep?.lemma, { strict: false, prepDeps: def.depSignature?.prepDeps, mustMatchDeps: def.depSignature?.mustMatchDeps, shouldMatchDeps: def.depSignature?.shouldMatchDeps, maxDepth });
      if (refl2 && prep2) return { indices: [verbIdx, refl2.index, prep2.index], matchedTokens: [tokens[verbIdx], refl2, prep2], confidence: 0.85, type: def.type };

      // Tier 3: surface fallback (small window)
      const refl3 = this.findReflexiveForVerb(tokens, verbIdx, { fallbackWindow: 3, allowedDeps: allowedReflDeps, maxDepth });
      const prep3 = this.findPrepForVerb(tokens, verbIdx, def.prep?.lemma, { fallbackWindow: 3, prepDeps: def.depSignature?.prepDeps, mustMatchDeps: def.depSignature?.mustMatchDeps, shouldMatchDeps: def.depSignature?.shouldMatchDeps, maxDepth });
      if (refl3 && prep3) return { indices: [verbIdx, refl3.index, prep3.index], matchedTokens: [tokens[verbIdx], refl3, prep3], confidence: 0.6, type: def.type };

      return null;
    }

    if (def.type === 'verb-prep') {
      const prep = this.findPrepForVerb(tokens, verbIdx, def.prep?.lemma, { strict: true, prepDeps: def.depSignature?.prepDeps, mustMatchDeps: def.depSignature?.mustMatchDeps, shouldMatchDeps: def.depSignature?.shouldMatchDeps });
      if (prep) return { indices: [verbIdx, prep.index], matchedTokens: [tokens[verbIdx], prep], confidence: 0.92, type: def.type };

      const prep2 = this.findPrepForVerb(tokens, verbIdx, def.prep?.lemma, { strict: false, prepDeps: def.depSignature?.prepDeps, mustMatchDeps: def.depSignature?.mustMatchDeps, shouldMatchDeps: def.depSignature?.shouldMatchDeps });
      if (prep2 && depUtils.inSameClause(tokens, verbIdx, prep2.index)) return { indices: [verbIdx, prep2.index], matchedTokens: [tokens[verbIdx], prep2], confidence: 0.8, type: def.type };

      const prep3 = this.findPrepForVerb(tokens, verbIdx, def.prep?.lemma, { fallbackWindow: 3, prepDeps: def.depSignature?.prepDeps, mustMatchDeps: def.depSignature?.mustMatchDeps, shouldMatchDeps: def.depSignature?.shouldMatchDeps });
      if (prep3) return { indices: [verbIdx, prep3.index], matchedTokens: [tokens[verbIdx], prep3], confidence: 0.55, type: def.type };

      return null;
    }

    if (def.type === 'verb-noun') {
      const noun = this.findNounObject(tokens, verbIdx, def.noun?.lemma, { strict: true, nounDeps: def.depSignature?.nounDeps, verbDeps: def.depSignature?.verbDeps, mustMatchDeps: def.depSignature?.mustMatchDeps, shouldMatchDeps: def.depSignature?.shouldMatchDeps });
      if (noun) return { indices: [verbIdx, noun.index], matchedTokens: [tokens[verbIdx], noun], confidence: 0.93, type: def.type };

        const noun2 = this.findNounObject(tokens, verbIdx, def.noun?.lemma, { strict: false, nounDeps: def.depSignature?.nounDeps, verbDeps: def.depSignature?.verbDeps, mustMatchDeps: def.depSignature?.mustMatchDeps, shouldMatchDeps: def.depSignature?.shouldMatchDeps });
        if (noun2 && depUtils.inSameClause(tokens, verbIdx, noun2.index)) return { indices: [verbIdx, noun2.index], matchedTokens: [tokens[verbIdx], noun2], confidence: 0.75, type: def.type };

      const noun3 = this.findNounObject(tokens, verbIdx, def.noun?.lemma, { fallbackWindow: 3, nounDeps: def.depSignature?.nounDeps, verbDeps: def.depSignature?.verbDeps, mustMatchDeps: def.depSignature?.mustMatchDeps, shouldMatchDeps: def.depSignature?.shouldMatchDeps });
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
  private findReflexiveForVerb(tokens: TokenData[], verbIdx: number, opts: { strict?: boolean; fallbackWindow?: number; allowedDeps?: string[]; maxDepth?: number; mustMatchDeps?: string[]; shouldMatchDeps?: string[] } = {}): TokenData | null {
    const strict = opts.strict === true;
    const fallbackWindow = opts.fallbackWindow || 0;
    const maxDepth = opts.maxDepth || 3;
    // Copy allowed deps to avoid mutating DSL arrays passed in opts
    const allowedDeps = Array.isArray(opts.allowedDeps) && opts.allowedDeps.length > 0 ? [...opts.allowedDeps] : ['obj', 'iobj', 'refl', 'oa', 'dobj'];
    if (!allowedDeps.includes('dobj')) allowedDeps.push('dobj');

    // Tier 1 (strict): direct child or grandchild PRON with reflexive morphology/lemma
    const children = depUtils.getChildren(tokens, verbIdx);
    for (const c of children) {
      if (c.pos === 'PRON' && ((c.morph?.Reflex === 'Yes' || c.morph?.Reflex === 'Ref') || c.lemma === 'sich' || REFLEXIVE_PRONOUNS.has(c.text.toLowerCase()))) {
        if (allowedDeps.includes(c.dep)) return c;
      }
      const grand = depUtils.getChildren(tokens, c.index);
      for (const g of grand) {
        if (g.pos === 'PRON' && ((g.morph?.Reflex === 'Yes' || g.morph?.Reflex === 'Ref') || g.lemma === 'sich' || REFLEXIVE_PRONOUNS.has(g.text.toLowerCase()))) {
          if (allowedDeps.includes(g.dep)) return g;
        }
      }
    }

    if (strict) return null;

    // Tier 2: descendants within `maxDepth` (require same clause)
    const descendants = this.gatherDescendants(tokens, verbIdx, maxDepth);
    for (const d of descendants) {
      if (d.pos === 'PRON' && ((d.morph?.Reflex === 'Yes' || d.morph?.Reflex === 'Ref') || d.lemma === 'sich' || REFLEXIVE_PRONOUNS.has(d.text.toLowerCase()))) {
        if (allowedDeps.includes(d.dep) && depUtils.inSameClause(tokens, verbIdx, d.index)) return d;
      }
    }

    // Tier 2b: conservative collapsed-path DFS fallback honoring must/should deps
    try {
      const dfsRes = this.findByCollapsedPath(tokens, verbIdx, (t) => (t.pos === 'PRON' || (t.lemma && REFLEXIVE_PRONOUNS.has((t.text || t.lemma).toLowerCase())) || t.lemma === 'sich'), { maxDepth, mustMatchDeps: opts.mustMatchDeps, shouldMatchDeps: opts.shouldMatchDeps, requireSameClause: true });
      if (dfsRes && dfsRes.token) {
        console.debug && console.debug(`[collocationDetector] reflexive found by DFS at idx=${dfsRes.token.index} via path=${dfsRes.pathDeps}`);
        return dfsRes.token;
      }
    } catch (e) {
      // swallow DFS errors in production usage
    }

    // Tier 3: small window fallback (require same clause)
    if (fallbackWindow > 0) {
      for (let i = Math.max(0, verbIdx - fallbackWindow); i <= Math.min(tokens.length - 1, verbIdx + fallbackWindow); i++) {
        const t = tokens[i];
        if (t.pos === 'PRON' && (t.morph?.Reflex === 'Yes' || t.morph?.Reflex === 'Ref' || t.lemma === 'sich')) {
          if (allowedDeps.includes(t.dep) && depUtils.inSameClause(tokens, verbIdx, t.index)) return t;
        }
      }
    }

    return null;
  }

  // Follow head chain and prefer main verb over auxiliaries/modals when possible
  private getCanonicalVerbIndex(tokens: TokenData[], startIdx: number): number {
    let cur = startIdx;
    const seen = new Set<number>();
    while (!seen.has(cur)) {
      seen.add(cur);
      const tok = tokens[cur];
      if (!tok) break;
      // If token is auxiliary-like, try to prefer its head when that head is a main verb
      const isAuxLike = tok.pos === 'AUX' || tok.dep === 'aux' || (tok.tag && /^V/.test(tok.tag) && tok.pos !== 'VERB');
      const head = depUtils.getHeadIndex(tokens, cur);
      if (head === null || head === cur) break;
      const headTok = tokens[head];
      if (isAuxLike && headTok && headTok.pos === 'VERB') {
        cur = head;
        continue;
      }
      // If current token is not VERB but head is VERB, prefer head as canonical
      if (tok.pos !== 'VERB' && headTok && headTok.pos === 'VERB') {
        cur = head;
        continue;
      }
      break;
    }
    return cur;
  }

  // Gather descendants up to a max depth (1..n) using depUtils.getChildren
  private gatherDescendants(tokens: TokenData[], headIndex: number, maxDepth = 3): TokenData[] {
    const out: TokenData[] = [];
    const visit = (idx: number, depth: number) => {
      if (depth > maxDepth) return;
      const children = depUtils.getChildren(tokens, idx);
      for (const c of children) {
        out.push(c);
        visit(c.index, depth + 1);
      }
    };
    visit(headIndex, 1);
    return out;
  }

  // Conservative collapsed-path DFS: traverse children up to `maxDepth`, skipping
  // ignorable deps and returning the shortest matching node where `matchFn` is true.
  // Returns the matched token and the path of deps taken (for debug).
  private findByCollapsedPath(tokens: TokenData[], startIdx: number, matchFn: (t: TokenData) => boolean, opts: any = {}): any {
    const maxDepth = opts.maxDepth || 3;
    const allowedTraverse = Array.isArray(opts.allowedTraverseDeps) && opts.allowedTraverseDeps.length > 0 ? opts.allowedTraverseDeps : ['det', 'amod', 'adj', 'adv', 'case', 'compound', 'nk'];
    const allowedFinal = Array.isArray(opts.allowedFinalDeps) && opts.allowedFinalDeps.length > 0 ? opts.allowedFinalDeps : null;
    const mustMatch = Array.isArray(opts.mustMatchDeps) && opts.mustMatchDeps.length > 0 ? opts.mustMatchDeps : null;
    const shouldMatch = Array.isArray(opts.shouldMatchDeps) && opts.shouldMatchDeps.length > 0 ? opts.shouldMatchDeps : null;

    const visited = new Set<number>();
    let best: { token: TokenData; path: string[] } | null = null;

    const dfs = (idx: number, depth: number, path: string[]) => {
      if (depth > maxDepth) return;
      const children = depUtils.getChildren(tokens, idx);
      for (const c of children) {
        if (visited.has(c.index) || c.pos === 'PUNCT') continue;
        // Accept traversal through ignorable deps, else still allow exploring children
        const depLabel = c.dep || '';
        const newPath = path.concat(depLabel);

        // Check final match condition
        if (matchFn(c)) {
          // Determine whether this final dep is acceptable by priority:
          // 1) If `mustMatchDeps` is provided, require membership there.
          // 2) Else if `allowedFinal` provided, require membership there.
          // 3) Else if `shouldMatchDeps` provided, accept only if in should.
          // 4) Otherwise accept.
            let acceptFinal = true;
            if (mustMatch) {
              acceptFinal = mustMatch.includes(depLabel);
            } else if (allowedFinal) {
              acceptFinal = allowedFinal.includes(depLabel);
            } else {
              // `shouldMatch` is advisory: prefer nodes whose dep is in shouldMatch,
              // but do not reject nodes solely because they are not in shouldMatch.
              acceptFinal = true;
            }

          if (acceptFinal) {
            // Optionally require same clause
            if (!opts.requireSameClause || depUtils.inSameClause(tokens, startIdx, c.index)) {
              if (!best || newPath.length < best.path.length) best = { token: c, path: newPath };
            }
          }
        }

        // Continue traversal if dep is ignorable or not overly restrictive
        if (allowedTraverse.includes(depLabel) || depLabel === '' ) {
          visited.add(c.index);
          dfs(c.index, depth + 1, newPath);
          visited.delete(c.index);
        }
      }
    };

    dfs(startIdx, 1, []);
    if (best) {
      const b: any = best;
      return { token: b.token, pathDeps: b.path };
    }
    return { token: null, pathDeps: [] };
  }

  // Find preposition associated with verb according to dependency chain
  private findPrepForVerb(tokens: TokenData[], verbIdx: number, prepLemma?: string, opts: { strict?: boolean; fallbackWindow?: number; prepDeps?: string[]; verbDeps?: string[]; mustMatchDeps?: string[]; shouldMatchDeps?: string[]; maxDepth?: number } = {}): TokenData | null {
    const strict = opts.strict === true;
    const fallbackWindow = opts.fallbackWindow || 0;
    const maxDepth = opts.maxDepth || 3;
    const allowedPrepDeps = Array.isArray(opts.prepDeps) && opts.prepDeps.length > 0 ? opts.prepDeps : ['case', 'prep'];

    // Debug: trace inputs and local choices
    try {
      const verbDeps = opts['verbDeps'] || ['obj', 'dobj', 'oa', 'obl', 'nk'];
      const children = depUtils.getChildren(tokens, verbIdx).map(c => ({ idx: c.index, text: c.text, lemma: c.lemma, dep: c.dep, pos: c.pos }));
      console.debug(`[collocationDetector][prep-debug] verbIdx=${verbIdx} prepLemma=${prepLemma} strict=${strict} fallbackWindow=${fallbackWindow} maxDepth=${maxDepth} allowedPrepDeps=${JSON.stringify(allowedPrepDeps)} verbDeps=${JSON.stringify(verbDeps)}`);
      console.debug(`[collocationDetector][prep-debug] verbChildren=`, children);
    } catch (e) {
      // swallow debug errors
    }

    // Tier 1 (strict): find noun child of verb (use verbDeps if provided) that has a case child (preposition)
    const verbDeps = opts['verbDeps'] || ['obj', 'dobj', 'oa', 'obl', 'nk'];
    const children = depUtils.getChildren(tokens, verbIdx);
    for (const c of children) {
      if (verbDeps.includes(c.dep) && (c.pos === 'NOUN' || c.pos === 'PROPN' || c.pos === 'PRON')) {
        // look for case child of this noun (allow depth up to 2)
        const caseChild = depUtils.findChild(tokens, c.index, (t) => (allowedPrepDeps.includes(t.dep) || t.dep === 'prep' || t.dep === 'case') && this.matchPreposition(t, prepLemma || ''));
        if (caseChild) return caseChild;
        // grandchild case (collapsed path)
        const grandChildren = depUtils.getChildren(tokens, c.index);
        for (const g of grandChildren) {
          const gc = depUtils.findChild(tokens, g.index, (t) => (allowedPrepDeps.includes(t.dep) || t.dep === 'prep' || t.dep === 'case') && this.matchPreposition(t, prepLemma || ''));
          if (gc) return gc;
        }
      }
    }

    // Tier 2: preposition attached directly to verb (dep=prep/op)
    const prepAttached = depUtils.findChild(tokens, verbIdx, (t) => (allowedPrepDeps.includes(t.dep) || t.dep === 'prep' || t.dep === 'op') && this.matchPreposition(t, prepLemma || ''));
    if (prepAttached) {
      try {
        const match = this.matchPreposition(prepAttached, prepLemma || '');
        const sameClause = depUtils.inSameClause(tokens, verbIdx, prepAttached.index);
        console.debug(`[collocationDetector][prep-attached-debug] found prepAttached idx=${prepAttached.index} text=${prepAttached.text} lemma=${prepAttached.lemma} dep=${prepAttached.dep} matchPreposition=${match} inSameClause=${sameClause}`);
      } catch (e) {
        // swallow debug errors
      }
      if (depUtils.inSameClause(tokens, verbIdx, prepAttached.index)) return prepAttached;
    }

    if (strict) return null;

    // Tier 3: preposition inside verb subtree is allowed ONLY if it is in the same clause
    // and its head is a noun/pronoun (i.e., part of an NP governed by the verb). Allow depth up to maxDepth.
    const descendants = this.gatherDescendants(tokens, verbIdx, maxDepth);
    for (const d of descendants) {
      if (this.isPreposition(d) && this.matchPreposition(d, prepLemma || '') && depUtils.inSameClause(tokens, verbIdx, d.index)) {
        const headIdx = depUtils.getHeadIndex(tokens, d.index);
        if (headIdx !== null) {
          const headTok = tokens[headIdx];
          if (headTok && (headTok.pos === 'NOUN' || headTok.pos === 'PROPN' || headTok.pos === 'PRON')) return d;
        }
      }
    }

    // Collapsed-path DFS fallback: allow prep realized on a noun descendant (prep child of noun)
    const prepTraverse = opts.prepDeps ? opts.prepDeps.concat(['det','amod','adj']) : ['case','det','amod','adj'];
    const prepFinal = opts.prepDeps || ['case'];
    const requireSameClause = strict ? true : false;
    const prepMatch = this.findByCollapsedPath(tokens, verbIdx, (t) => this.isPreposition(t) && this.matchPreposition(t, prepLemma || ''), { maxDepth, mustMatchDeps: opts.mustMatchDeps, shouldMatchDeps: opts.shouldMatchDeps, requireSameClause });
    if (prepMatch.token) return prepMatch.token;

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
  private findNounObject(tokens: TokenData[], verbIdx: number, nounLemma?: string | null, opts: { strict?: boolean; fallbackWindow?: number; nounDeps?: string[]; verbDeps?: string[]; mustMatchDeps?: string[]; shouldMatchDeps?: string[] } = {}): TokenData | null {
    const strict = opts.strict === true;
    const fallbackWindow = opts.fallbackWindow || 0;
    const nounDeps = Array.isArray(opts.nounDeps) && opts.nounDeps.length > 0 ? opts.nounDeps : ['obj', 'dobj', 'oa', 'obl', 'nk'];
    const verbDeps = Array.isArray(opts.verbDeps) && opts.verbDeps.length > 0 ? opts.verbDeps : ['obj', 'dobj', 'oa', 'obl', 'nk'];

    // Tier 1 (strict): direct child of verb with matching dep (allow following verbDeps/nounDeps)
    const children = depUtils.getChildren(tokens, verbIdx);
    for (const c of children) {
      if (verbDeps.includes(c.dep) && (c.pos === 'NOUN' || c.pos === 'PROPN')) {
        // only accept strict matches when nounLemma is provided
        if (!nounLemma) return c;
        if (c.lemma && this.lemmaMatches(c.lemma, nounLemma)) return c;
      }
    }

    if (strict) return null;

    // Tier 2: search descendants up to depth 3 (collapsed paths)
    const descendants = this.gatherDescendants(tokens, verbIdx, opts.fallbackWindow ? Math.max(3, opts.fallbackWindow) : 3);
    for (const d of descendants) {
      if ((d.pos === 'NOUN' || d.pos === 'PROPN') && (nounLemma ? (d.lemma && this.lemmaMatches(d.lemma, nounLemma)) : true) && depUtils.inSameClause(tokens, verbIdx, d.index)) {
        if (nounDeps.includes(d.dep) || nounLemma) return d;
      }
    }

    // Collapsed-path DFS fallback: find noun reachable through ignorable nodes
    const nounTraverse = opts.nounDeps ? opts.nounDeps.concat(['det','amod','adj','compound','nk']) : ['det','amod','adj','compound','nk'];
    const nounFinal = opts.nounDeps || nounDeps;
    const nounMatch = this.findByCollapsedPath(tokens, verbIdx, (t) => (t.pos === 'NOUN' || t.pos === 'PROPN') && (!nounLemma || (!!t.lemma && this.lemmaMatches(t.lemma, nounLemma))), { maxDepth: 3 });
    if (nounMatch.token) return nounMatch.token;

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