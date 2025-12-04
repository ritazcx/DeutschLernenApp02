/**
 * Participial Attribute Detector
 * Identifies B2-level extended participial phrases (Erweiterte Partizipialattribute)
 * Supports both Partizip I (present participle) and Partizip II (past participle)
 */

import { BaseGrammarDetector, DetectionResult, SentenceData } from './baseDetector';
import { B2_GRAMMAR, GrammarCategory } from '../cefr-taxonomy';

export class ParticipialAttributeDetector extends BaseGrammarDetector {
  name = 'ParticipialAttributeDetector';
  category: GrammarCategory = 'participial-attribute';

  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];
    this.detectExtendedAdjectives(sentence, results);
    return results;
  }

  /**
   * Detect extended participial attribution patterns
   */
  private detectExtendedAdjectives(sentence: SentenceData, results: DetectionResult[]): void {
    for (let i = 0; i < sentence.tokens.length - 1; i++) {
      const token = sentence.tokens[i];

      if (token.pos !== 'NOUN') {
        continue;
      }

      const adjectivePhrase = this.findExtendedAdjectivePhrase(sentence.tokens, i);
      const isParticipial = this.isParticipialPhrase(adjectivePhrase);

      if (adjectivePhrase.length > 0 && isParticipial) {
        const startIndex = i - adjectivePhrase.length;
        const endIndex = i;
        const phraseInfo = this.analyzeParticipialPhrase(adjectivePhrase);

        results.push(
          this.createResult(
            B2_GRAMMAR['participial-attributes'],
            this.calculatePosition(sentence.tokens, startIndex, endIndex),
            0.9,
            {
              noun: token.text,
              adjectives: adjectivePhrase.map(t => t.text),
              phraseLength: adjectivePhrase.length,
              type: this.classifyAdjectivePhrase(adjectivePhrase),
              participleType: phraseInfo.participleType,
              baseVerb: phraseInfo.baseVerb,
              participleText: phraseInfo.participleText,
              hasPreposition: phraseInfo.hasPreposition,
              hasAdverb: phraseInfo.hasAdverb,
              modifiers: phraseInfo.modifiers,
            },
          ),
        );
      }
    }
  }

  /**
   * Find extended participial phrase before a noun
   */
  private findExtendedAdjectivePhrase(tokens: SentenceData['tokens'], nounIndex: number): SentenceData['tokens'] {
    const phrase: SentenceData['tokens'] = [];
    let currentIndex = nounIndex - 1;

    while (currentIndex >= 0) {
      const token = tokens[currentIndex];

      // Stop at finite verbs (but not participles)
      if ((token.pos === 'VERB' || token.pos === 'AUX') && 
          !this.isPartizipI(token) && 
          !this.isPartizipII(token)) {
        break;
      }

      // Stop at conjunctions that mark clause boundaries
      if (token.pos === 'CCONJ' || token.pos === 'SCONJ') {
        break;
      }

      // Stop at punctuation (except commas)
      if (token.pos === 'PUNCT' && token.text !== ',') {
        break;
      }

      phrase.unshift(token);
      currentIndex--;
    }

    return phrase;
  }

  /**
   * Check if token is Partizip I (present participle)
   */
  private isPartizipI(token: SentenceData['tokens'][0]): boolean {
    if (token.tag === 'VVPPR') {
      return true;
    }

    if (token.morph?.VerbForm === 'Part' && token.morph?.Tense === 'Pres') {
      return true;
    }

    if (token.pos === 'ADJ' && /end(e|er|es|en|em)?$/i.test(token.text)) {
      return this.isVerbBasedAdjective(token, 'partizip-i');
    }

    return false;
  }

  /**
   * Check if token is Partizip II (past participle)
   */
  private isPartizipII(token: SentenceData['tokens'][0]): boolean {
    if (token.tag === 'VVPP') {
      return true;
    }

    if (token.morph?.VerbForm === 'Part' && 
        (token.morph?.Tense === 'Past' || token.morph?.Aspect === 'Perf')) {
      return true;
    }

    if (token.pos === 'ADJ') {
      return this.isVerbBasedAdjective(token, 'partizip-ii');
    }

    return false;
  }

  /**
   * Check if an ADJ token is actually a participial adjective
   */
  private isVerbBasedAdjective(token: SentenceData['tokens'][0], type: 'partizip-i' | 'partizip-ii'): boolean {
    const text = token.text.toLowerCase();
    const lemma = token.lemma?.toLowerCase() || '';

    if (type === 'partizip-i') {
      if (lemma.endsWith('end') || lemma.endsWith('nd')) {
        return true;
      }
      if (/end(e|er|es|en|em)?$/i.test(text)) {
        return true;
      }
      if (lemma.endsWith('en') || lemma.endsWith('n')) {
        return true;
      }
      return false;
    } else {
      const hasGePrefix = text.startsWith('ge');
      const hasParticipleEnding = /[t]e[nrms]?$/i.test(text) || /en(e|er|es|en|em)?$/i.test(text);
      
      if (hasGePrefix && hasParticipleEnding) {
        return true;
      }
      
      const hasInseparablePrefix = /^(ver|er|be|ent|emp|zer|miss)/i.test(text);
      if (hasInseparablePrefix && hasParticipleEnding) {
        return true;
      }
      
      if (lemma.endsWith('en') || lemma.endsWith('n')) {
        return hasParticipleEnding;
      }
      
      return false;
    }
  }

  /**
   * Extract base verb from participial form
   */
  private extractBaseVerb(token: SentenceData['tokens'][0]): string | null {
    if (token.lemma && (token.lemma.endsWith('en') || token.lemma.endsWith('n'))) {
      return token.lemma;
    }

    const text = token.text.toLowerCase();

    if (this.isPartizipI(token)) {
      const stem = text.replace(/end(e|er|es|en|em)?$/i, '');
      return stem + 'en';
    }

    if (this.isPartizipII(token)) {
      let stem = text.replace(/^ge/i, '');
      stem = stem.replace(/[t]e[nrms]?$/i, '');
      stem = stem.replace(/en(e|er|es|en|em)?$/i, '');
      return stem + 'en';
    }

    return null;
  }

  /**
   * Check if collected phrase is truly participial
   */
  private isParticipialPhrase(phrase: SentenceData['tokens']): boolean {
    if (phrase.length === 0) return false;
    return phrase.some(t => this.isPartizipI(t) || this.isPartizipII(t));
  }

  /**
   * Analyze participial phrase to extract metadata
   */
  private analyzeParticipialPhrase(phrase: SentenceData['tokens']): {
    participleType: 'partizip-i' | 'partizip-ii' | 'both';
    baseVerb: string | null;
    participleText: string;
    hasPreposition: boolean;
    hasAdverb: boolean;
    modifiers: string[];
  } {
    const hasPartizipI = phrase.some(t => this.isPartizipI(t));
    const hasPartizipII = phrase.some(t => this.isPartizipII(t));
    const hasPreposition = phrase.some(t => t.pos === 'ADP');
    const hasAdverb = phrase.some(t => t.pos === 'ADV');

    const participle = phrase.find(t => this.isPartizipI(t) || this.isPartizipII(t));
    const baseVerb = participle ? this.extractBaseVerb(participle) : null;
    const participleText = participle ? participle.text : '';

    let participleType: 'partizip-i' | 'partizip-ii' | 'both';
    if (hasPartizipI && hasPartizipII) {
      participleType = 'both';
    } else if (hasPartizipI) {
      participleType = 'partizip-i';
    } else {
      participleType = 'partizip-ii';
    }

    const modifiers = phrase
      .filter(t => t.pos === 'ADP' || t.pos === 'ADV' || t.pos === 'PRON')
      .map(t => t.text);

    return {
      participleType,
      baseVerb,
      participleText,
      hasPreposition,
      hasAdverb,
      modifiers,
    };
  }

  /**
   * Classify the type of extended participial phrase
   */
  private classifyAdjectivePhrase(phrase: SentenceData['tokens']): string {
    if (phrase.length === 0) return 'simple';

    const hasPartizipI = phrase.some(t => this.isPartizipI(t));
    const hasPartizipII = phrase.some(t => this.isPartizipII(t));
    const hasPreposition = phrase.some(t => t.pos === 'ADP');
    const hasAdverb = phrase.some(t => t.pos === 'ADV');

    if (hasPartizipI && hasPreposition) {
      return 'partizip-i-with-preposition';
    } else if (hasPartizipI && hasAdverb) {
      return 'partizip-i-with-modifiers';
    } else if (hasPartizipI) {
      return 'partizip-i-phrase';
    }

    if (hasPartizipII && hasPreposition) {
      return 'partizip-ii-with-preposition';
    } else if (hasPartizipII && hasAdverb) {
      return 'partizip-ii-with-modifiers';
    } else if (hasPartizipII) {
      return 'partizip-ii-phrase';
    }

    if (hasPreposition) {
      return 'prepositional';
    } else {
      return 'multiple-adjectives';
    }
  }
}
