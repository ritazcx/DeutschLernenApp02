/**
 * Agreement Detector
 * Identifies agreement errors and correct agreement patterns
 */

import { BaseGrammarDetector, DetectionResult, SentenceData, TokenData } from './baseDetector';
import { B1_GRAMMAR, GrammarCategory } from '../cefr-taxonomy';
import * as MorphAnalyzer from '../morphologyAnalyzer';

export class AgreementDetector extends BaseGrammarDetector {
  name = 'AgreementDetector';
  category: GrammarCategory = 'agreement';

  /**
   * Detect agreement patterns in the sentence
   * Currently focuses on adjective agreement (article-adjective-noun)
   */
  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    // Look for adjective agreement patterns
    this.detectAdjectiveAgreement(sentence, results);

    return results;
  }

  /**
   * Detect adjective agreement in noun phrases
   * Pattern: [article] [adjective] [noun]
   */
  private detectAdjectiveAgreement(sentence: SentenceData, results: DetectionResult[]): void {
    for (let i = 0; i < sentence.tokens.length - 2; i++) {
      const article = sentence.tokens[i];
      const adjective = sentence.tokens[i + 1];
      const noun = sentence.tokens[i + 2];

      // Check for article-adjective-noun pattern
      if (this.isArticle(article) && adjective.pos === 'ADJ' && noun.pos === 'NOUN') {
        // Check if they agree in case, gender, number
        const agreement = this.checkAgreement(article, adjective, noun);

        if (agreement.isCorrect) {
          // Correct agreement - this is a learning opportunity
          results.push(
            this.createResult(
              B1_GRAMMAR['adjective-agreement'],
              this.calculatePosition(sentence.tokens, i, i + 2),
              0.85,
              {
                article: article.text,
                adjective: adjective.text,
                noun: noun.text,
                case: agreement.case,
                gender: agreement.gender,
                number: agreement.number,
                correct: true,
              },
            ),
          );
        }
      }
    }
  }

  /**
   * Check if a token is an article
   */
  private isArticle(token: TokenData): boolean {
    return token.pos === 'DET' &&
           ['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'eines']
           .includes(token.text.toLowerCase());
  }

  /**
   * Check agreement between article, adjective, and noun
   */
  private checkAgreement(article: TokenData, adjective: TokenData, noun: TokenData): {
    isCorrect: boolean;
    case?: string;
    gender?: string;
    number?: string;
  } {
    // Extract morphological features
    const articleCase = MorphAnalyzer.extractCase(article.morph || {});
    const articleGender = MorphAnalyzer.extractGender(article.morph || {});
    const articleNumber = MorphAnalyzer.extractNumber(article.morph || {});

    const adjectiveCase = MorphAnalyzer.extractCase(adjective.morph || {});
    const adjectiveGender = MorphAnalyzer.extractGender(adjective.morph || {});
    const adjectiveNumber = MorphAnalyzer.extractNumber(adjective.morph || {});

    const nounCase = MorphAnalyzer.extractCase(noun.morph || {});
    const nounGender = MorphAnalyzer.extractGender(noun.morph || {});
    const nounNumber = MorphAnalyzer.extractNumber(noun.morph || {});

    // Must have morphological features to detect agreement
    // 'unknown' means the feature is missing
    const hasCaseFeatures = articleCase && articleCase !== 'unknown' && 
                           adjectiveCase && adjectiveCase !== 'unknown' && 
                           nounCase && nounCase !== 'unknown';
    const hasGenderFeatures = articleGender && articleGender !== 'unknown' && 
                             adjectiveGender && adjectiveGender !== 'unknown' && 
                             nounGender && nounGender !== 'unknown';
    const hasNumberFeatures = articleNumber && articleNumber !== 'unknown' && 
                             adjectiveNumber && adjectiveNumber !== 'unknown' && 
                             nounNumber && nounNumber !== 'unknown';

    // If we don't have the necessary features, we can't verify agreement
    if (!hasCaseFeatures && !hasGenderFeatures && !hasNumberFeatures) {
      return { isCorrect: false };
    }

    // Check agreement for features that are present
    // Note: In German, gender agreement is not required in plural forms
    const isPlural = (articleNumber === 'Plur' || adjectiveNumber === 'Plur' || nounNumber === 'Plur');
    const caseAgrees = !hasCaseFeatures || (articleCase === adjectiveCase && adjectiveCase === nounCase);
    const genderAgrees = !hasGenderFeatures || isPlural || (articleGender === adjectiveGender && adjectiveGender === nounGender);
    const numberAgrees = !hasNumberFeatures || (articleNumber === adjectiveNumber && adjectiveNumber === nounNumber);

    return {
      isCorrect: caseAgrees && genderAgrees && numberAgrees,
      case: articleCase || adjectiveCase || nounCase,
      gender: articleGender || adjectiveGender || nounGender,
      number: articleNumber || adjectiveNumber || nounNumber,
    };
  }
}