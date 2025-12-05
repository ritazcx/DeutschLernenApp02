/**
 * Subordinate Clause Detector - MVP Version
 * Tree-based detection using spaCy dependency parsing
 * Focuses on 4 core clause types: dass, relative, adverbial, infinitive
 */

import { BaseGrammarDetector, DetectionResult, SentenceData, TokenData } from '../shared/baseDetector';
import { B1_GRAMMAR, GrammarCategory } from '../../cefr-taxonomy';
import { ClauseMarker, ClauseVerb, ClauseBoundary, ClauseType } from '../../types/clause';

export class SubordinateClauseDetector extends BaseGrammarDetector {
  name = 'SubordinateClauseDetector';
  category: GrammarCategory = 'word-order';

  // SCONJ markers for dass and adverbial clauses
  private readonly sconjMarkers = new Set([
    'dass', 'ob',                           // Completive
    'weil', 'da',                           // Causal
    'wenn', 'falls', 'sofern',              // Conditional
    'obwohl', 'obgleich', 'obschon',        // Concessive
    'als', 'nachdem', 'bevor', 'während',   // Temporal
    'bis', 'seit', 'sobald', 'sooft',
    'damit', 'sodass',                      // Purpose/Result
    'indem',                                // Modal
  ]);

  // Relative pronouns (PRELS)
  private readonly relativePronouns = new Set([
    'der', 'die', 'das', 'dem', 'den', 'des', 'dessen', 'deren', 'denen',
    'welcher', 'welche', 'welches', 'welchem', 'welchen', 'welches',
  ]);

  // Infinitive markers
  private readonly infinitiveMarkers = new Set(['um', 'ohne', 'statt', 'anstatt']);

  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    // Step 1: Detect all clause markers
    const markers = this.detectMarkers(sentence);

    // Step 2: Process each marker to build complete clause
    const processedRanges: Array<{start: number; end: number}> = [];
    
    for (const marker of markers) {
      const clause = this.buildClause(marker, sentence);
      
      if (clause) {
        // Check for overlapping clauses (nested clauses)
        const clauseRange = { 
          start: clause.position.start, 
          end: clause.position.end 
        };
        
        // Check if this clause overlaps with an existing clause
        const isNested = processedRanges.some(range => 
          (clauseRange.start > range.start && clauseRange.end < range.end) || // Fully nested
          (clauseRange.start < range.start && clauseRange.end > range.end)    // Contains another
        );
        
        // If nested, mark with lower confidence
        if (isNested && clause.confidence) {
          clause.confidence *= 0.9; // Reduce confidence for nested clauses
          clause.details.nested = true;
        }
        
        results.push(clause);
        processedRanges.push(clauseRange);
      }
    }

    return results;
  }

  /**
   * Step 1: Detect all clause markers (SCONJ, PRELS, infinitive markers)
   */
  private detectMarkers(sentence: SentenceData): ClauseMarker[] {
    const markers: ClauseMarker[] = [];

    sentence.tokens.forEach((token, index) => {
      // SCONJ markers (dass, weil, wenn, etc.)
      if (token.pos === 'SCONJ' && this.sconjMarkers.has(token.lemma.toLowerCase())) {
        markers.push({
          type: 'SCONJ',
          tokenIndex: index,
          lemma: token.lemma.toLowerCase(),
          text: token.text,
        });
      }
      // PRELS markers (relative pronouns)
      else if (token.tag === 'PRELS' || 
               (token.pos === 'PRON' && this.relativePronouns.has(token.lemma.toLowerCase()))) {
        markers.push({
          type: 'PRELS',
          tokenIndex: index,
          lemma: token.lemma.toLowerCase(),
          text: token.text,
        });
      }
      // Infinitive markers (um, ohne, statt with zu)
      else if (this.infinitiveMarkers.has(token.lemma.toLowerCase())) {
        // Check if followed by 'zu' within next 3 tokens
        if (this.hasZuNearby(sentence.tokens, index)) {
          markers.push({
            type: 'infinitive-marker',
            tokenIndex: index,
            lemma: token.lemma.toLowerCase(),
            text: token.text,
          });
        }
      }
    });

    return markers;
  }

  /**
   * Check if 'zu' appears within 3 tokens after the infinitive marker
   */
  private hasZuNearby(tokens: TokenData[], markerIndex: number): boolean {
    for (let i = markerIndex + 1; i < Math.min(markerIndex + 4, tokens.length); i++) {
      if (tokens[i].lemma.toLowerCase() === 'zu') {
        return true;
      }
    }
    return false;
  }

  /**
   * Step 2: Build complete clause from marker
   */
  private buildClause(marker: ClauseMarker, sentence: SentenceData): DetectionResult | null {
    // Find verb head for this clause
    const verb = this.locateVerbHead(marker, sentence);
    if (!verb) {
      return null;
    }

    // Detect clause boundaries
    const boundaries = this.detectBoundaries(marker, verb, sentence);
    if (!boundaries) {
      return null;
    }

    // Determine clause type
    const clauseType = this.determineClauseType(marker);

    // Calculate confidence
    const confidence = this.calculateConfidence(marker, verb, boundaries);

    // Determine clause function (semantic role)
    const clauseFunction = this.determineClauseFunction(marker, clauseType);

    // Build detection result
    return this.createResult(
      B1_GRAMMAR['subordinate-clauses'],
      { start: boundaries.startChar, end: boundaries.endChar },
      confidence,
      {
        conjunction: marker.type === 'SCONJ' ? marker.text : undefined,
        relativeWord: marker.type === 'PRELS' ? marker.text : undefined,
        infinitiveMarker: marker.type === 'infinitive-marker' ? marker.text : undefined,
        verb: verb.text,
        verbLemma: verb.lemma,
        verbForm: this.describeVerbForm(verb),
        type: clauseType,
        clauseFunction: clauseFunction,
        hasAuxiliary: verb.isCompound,
      },
    );
  }

  /**
   * Determine the semantic function of the clause
   */
  private determineClauseFunction(marker: ClauseMarker, clauseType: ClauseType): string {
    if (marker.type === 'PRELS') {
      return 'attributive'; // Relative clauses modify nouns
    }
    
    if (marker.type === 'infinitive-marker') {
      const functionMap: Record<string, string> = {
        'um': 'purpose',
        'ohne': 'manner',
        'statt': 'alternative',
        'anstatt': 'alternative',
      };
      return functionMap[marker.lemma] || 'infinitive';
    }
    
    // SCONJ function mapping
    const functionMap: Record<string, string> = {
      'dass': 'completive',
      'ob': 'interrogative',
      'weil': 'causal',
      'da': 'causal',
      'wenn': 'conditional',
      'falls': 'conditional',
      'sofern': 'conditional',
      'obwohl': 'concessive',
      'obgleich': 'concessive',
      'obschon': 'concessive',
      'als': 'temporal',
      'nachdem': 'temporal',
      'bevor': 'temporal',
      'während': 'temporal',
      'bis': 'temporal',
      'seit': 'temporal',
      'sobald': 'temporal',
      'sooft': 'temporal',
      'damit': 'purpose',
      'sodass': 'result',
      'indem': 'modal',
    };
    
    return functionMap[marker.lemma] || 'subordinate';
  }

  /**
   * Step 3: Locate verb head using dependency tree
   */
  private locateVerbHead(marker: ClauseMarker, sentence: SentenceData): ClauseVerb | null {
    const markerToken = sentence.tokens[marker.tokenIndex];

    // Strategy 1: Use spaCy dependency tree (head field)
    // The marker's head is usually the verb of the subordinate clause
    if (markerToken.head) {
      const headToken = this.findTokenByText(sentence, markerToken.head);
      if (headToken && (this.isFiniteVerb(headToken) || this.isVerbOrAux(headToken))) {
        return this.buildClauseVerb(headToken, sentence);
      }
    }

    // Strategy 2: For relative clauses (PRELS), look for verb that depends on the relative pronoun
    if (marker.type === 'PRELS') {
      return this.findRelativeClauseVerb(marker, sentence);
    }

    // Strategy 3: For infinitive clauses, look for VVINF or VVIZU
    if (marker.type === 'infinitive-marker') {
      return this.findInfinitiveClauseVerb(marker, sentence);
    }

    // Strategy 4: Search for verb after marker (verb-final word order)
    // Look for finite verb (VVFIN, VAFIN, VMFIN) after the marker
    for (let i = marker.tokenIndex + 1; i < sentence.tokens.length; i++) {
      const token = sentence.tokens[i];
      
      // Stop at punctuation or next clause marker
      if (token.pos === 'PUNCT' || token.pos === 'SCONJ') {
        break;
      }

      if (this.isFiniteVerb(token)) {
        return this.buildClauseVerb(token, sentence);
      }
    }

    // Strategy 5: Look for any verb (including auxiliaries and modals)
    for (let i = marker.tokenIndex + 1; i < sentence.tokens.length; i++) {
      const token = sentence.tokens[i];
      
      if (token.pos === 'PUNCT') break;
      
      if (this.isVerbOrAux(token)) {
        return this.buildClauseVerb(token, sentence);
      }
    }

    return null;
  }

  /**
   * Find verb for relative clauses
   */
  private findRelativeClauseVerb(marker: ClauseMarker, sentence: SentenceData): ClauseVerb | null {
    // In relative clauses, the verb usually comes after the relative pronoun
    // and before the next punctuation or clause boundary
    for (let i = marker.tokenIndex + 1; i < sentence.tokens.length; i++) {
      const token = sentence.tokens[i];
      
      // Stop at comma (end of relative clause)
      if (token.pos === 'PUNCT' && token.text === ',') {
        break;
      }
      
      // Look for finite verb
      if (this.isFiniteVerb(token)) {
        return this.buildClauseVerb(token, sentence);
      }
    }
    
    // Fallback: look for any verb
    for (let i = marker.tokenIndex + 1; i < sentence.tokens.length; i++) {
      const token = sentence.tokens[i];
      
      if (token.pos === 'PUNCT') break;
      
      if (this.isVerbOrAux(token)) {
        return this.buildClauseVerb(token, sentence);
      }
    }
    
    return null;
  }

  /**
   * Find verb for infinitive clauses (um...zu, ohne...zu, statt...zu)
   */
  private findInfinitiveClauseVerb(marker: ClauseMarker, sentence: SentenceData): ClauseVerb | null {
    // Find 'zu' first
    let zuIndex = -1;
    for (let i = marker.tokenIndex + 1; i < Math.min(marker.tokenIndex + 5, sentence.tokens.length); i++) {
      if (sentence.tokens[i].lemma.toLowerCase() === 'zu') {
        zuIndex = i;
        break;
      }
    }
    
    if (zuIndex === -1) return null;
    
    // Look for infinitive verb (VVINF or VVIZU) after 'zu'
    for (let i = zuIndex; i < sentence.tokens.length; i++) {
      const token = sentence.tokens[i];
      
      // Stop at punctuation
      if (token.pos === 'PUNCT') break;
      
      // Look for infinitive verb
      if (token.tag === 'VVINF' || token.tag === 'VVIZU' || 
          (token.pos === 'VERB' && token.lemma !== 'zu')) {
        return this.buildClauseVerb(token, sentence);
      }
    }
    
    return null;
  }

  /**
   * Build ClauseVerb object from token
   */
  private buildClauseVerb(token: TokenData, sentence: SentenceData): ClauseVerb {
    // Check if this is part of compound verb (haben/sein + Partizip II)
    const auxiliary = this.findAuxiliary(token, sentence);

    return {
      tokenIndex: token.index,
      lemma: token.lemma,
      text: token.text,
      tag: token.tag || token.pos || '',
      isCompound: !!auxiliary,
      auxiliaryIndex: auxiliary?.index,
    };
  }

  /**
   * Find auxiliary verb for compound tenses (haben/sein + Partizip II)
   * Also handles modal verbs (muss, kann, soll, etc.)
   */
  private findAuxiliary(verb: TokenData, sentence: SentenceData): TokenData | null {
    // Case 1: If verb is a participle (VVPP), look for haben/sein before it
    if (verb.tag === 'VVPP') {
      for (let i = verb.index - 1; i >= 0; i--) {
        const token = sentence.tokens[i];
        if (token.lemma === 'haben' || token.lemma === 'sein' || token.lemma === 'werden') {
          return token;
        }
        // Stop at clause boundary
        if (token.pos === 'SCONJ' || token.pos === 'PUNCT') {
          break;
        }
      }
    }
    
    // Case 2: If verb is an infinitive (VVINF), look for modal verb
    if (verb.tag === 'VVINF') {
      const modalVerbs = ['müssen', 'können', 'sollen', 'dürfen', 'wollen', 'mögen', 'möchten'];
      for (let i = verb.index - 1; i >= 0; i--) {
        const token = sentence.tokens[i];
        if (modalVerbs.includes(token.lemma.toLowerCase())) {
          return token;
        }
        // Stop at clause boundary
        if (token.pos === 'SCONJ' || token.pos === 'PUNCT') {
          break;
        }
      }
    }
    
    return null;
  }

  /**
   * Step 4: Detect clause boundaries
   */
  private detectBoundaries(
    marker: ClauseMarker,
    verb: ClauseVerb,
    sentence: SentenceData,
  ): ClauseBoundary | null {
    const markerToken = sentence.tokens[marker.tokenIndex];
    const verbToken = sentence.tokens[verb.tokenIndex];

    // Start: at the marker
    const start = marker.tokenIndex;
    let end = verb.tokenIndex;

    // If verb has auxiliary, include auxiliary in the clause
    if (verb.isCompound && verb.auxiliaryIndex !== undefined) {
      end = Math.max(end, verb.auxiliaryIndex);
    }

    // Extend end to include tokens after verb until boundary
    for (let i = end + 1; i < sentence.tokens.length; i++) {
      const token = sentence.tokens[i];

      // Stop at punctuation (comma, period, semicolon)
      if (token.pos === 'PUNCT' && [',', '.', ';', '!', '?'].includes(token.text)) {
        break;
      }

      // Stop at coordinating conjunction (und, aber, oder)
      if (token.pos === 'CCONJ') {
        break;
      }

      // Stop at next subordinating conjunction (nested clause)
      if (token.pos === 'SCONJ' && i > end) {
        break;
      }

      // Stop at relative pronoun (nested relative clause)
      if (token.tag === 'PRELS' && i > end) {
        break;
      }

      // For infinitive clauses, stop at main clause verb
      if (marker.type === 'infinitive-marker' && this.isFiniteVerb(token) && i > end) {
        break;
      }

      // Include separable verb prefixes (PTKVZ) after the verb
      if (token.tag === 'PTKVZ') {
        end = i;
        continue;
      }

      // Include this token
      end = i;
    }

    // Get character positions
    const startChar = markerToken.characterStart || 0;
    const endToken = sentence.tokens[end];
    const endChar = endToken.characterEnd || (endToken.characterStart + endToken.text.length);

    return {
      start,
      end,
      startChar,
      endChar,
    };
  }

  /**
   * Determine clause type from marker
   */
  private determineClauseType(marker: ClauseMarker): ClauseType {
    if (marker.type === 'PRELS') {
      return 'relative';
    }
    if (marker.type === 'infinitive-marker') {
      return 'infinitive';
    }
    if (marker.lemma === 'dass' || marker.lemma === 'ob') {
      return 'dass';
    }
    return 'adverbial';
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    marker: ClauseMarker,
    verb: ClauseVerb,
    boundaries: ClauseBoundary,
  ): number {
    // High confidence: spaCy tagged SCONJ or PRELS with finite verb
    if (marker.type === 'SCONJ' || marker.type === 'PRELS') {
      if (verb.tag && (verb.tag.includes('FIN') || verb.isCompound)) {
        return 0.95;
      }
      return 0.85;
    }

    // Medium confidence: infinitive clauses
    if (marker.type === 'infinitive-marker') {
      return 0.80;
    }

    return 0.75;
  }

  /**
   * Describe verb form for details
   */
  private describeVerbForm(verb: ClauseVerb): string {
    if (verb.isCompound) {
      return 'compound';
    }
    if (verb.tag?.includes('FIN')) {
      return 'finite';
    }
    if (verb.tag === 'VVINF' || verb.tag === 'VVIZU') {
      return 'infinitive';
    }
    if (verb.tag === 'VVPP') {
      return 'participle';
    }
    return 'unknown';
  }

  /**
   * Check if token is a finite verb (VVFIN, VAFIN, VMFIN)
   */
  private isFiniteVerb(token: TokenData): boolean {
    const tag = token.tag || '';
    return tag === 'VVFIN' || tag === 'VAFIN' || tag === 'VMFIN';
  }

  /**
   * Find token by text value (for dependency head resolution)
   */
  private findTokenByText(sentence: SentenceData, targetText: string): TokenData | null {
    return sentence.tokens.find((t) => t.text === targetText) || null;
  }
}
