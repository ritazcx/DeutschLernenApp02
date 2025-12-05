/**
 * Agreement Detector — Final Integrated Version
 * NP chunking + agreement detection in ONE class.
 */

import {
  BaseGrammarDetector,
  DetectionResult,
  SentenceData,
  TokenData,
} from "../shared/baseDetector";
import { B1_GRAMMAR, GrammarCategory } from "../../cefr-taxonomy";
import * as MorphAnalyzer from "../../morphologyAnalyzer";

export class AgreementDetector extends BaseGrammarDetector {
  name = "AgreementDetector";
  category: GrammarCategory = "agreement";

  /**
   * MAIN ENTRY — Detect all NP agreement issues
   */
  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];
    const npChunks = this.extractNPChunks(sentence);

    for (const np of npChunks) {
      // Skip NP if contains a named entity or proper noun
      if (np.some(tok => this.isNamedEntity(tok) || tok.pos === "PROPN")) continue;

      const result = this.checkNPAgreement(np);
      const isCorrect = result.state === "correct";

      if (result.state !== "correct") {
        const startIdx = np[0].index;
        const endIdx = np[np.length - 1].index;

        results.push(
          this.createResult(
            B1_GRAMMAR["adjective-agreement"],
            this.calculatePosition(sentence.tokens, startIdx, endIdx),
            result.state === "error" ? 0.85 : 0.65,
            {
              npTokens: np.map(t => t.text),
              state: result.state,
              case: result.case,
              gender: result.gender,
              number: result.number,
              missing: result.missing,
              correct: isCorrect,
            }
          )
        );
      }
    }

    return results;
  }

  // --------------------------------------------------------------------------
  // NP CHUNKER (INTEGRATED)
  // --------------------------------------------------------------------------

  /**
   * Extract NP chunks using dependency relations.
   * Uses token.head (string → token.text) instead of numeric indexes.
   */
  private extractNPChunks(sentence: SentenceData): TokenData[][] {
    const tokens = sentence.tokens;

    // Map token.text → token.index[]
    const textToIndexes = new Map<string, number[]>();
    for (const tok of tokens) {
      if (!textToIndexes.has(tok.text)) textToIndexes.set(tok.text, []);
      textToIndexes.get(tok.text)!.push(tok.index);
    }

    const resolveHead = (headText?: string): number[] => {
      if (!headText) return [];
      return textToIndexes.get(headText) ?? [];
    };

    const allowedDeps = new Set([
      "det",
      "amod",
      "compound",
      "nmod",
      "appos",
      "advmod",
      "case",
      "conj",
    ]);

    const npPOS = new Set(["NOUN", "PROPN", "PRON", "NUM", "ADJ", "DET"]);

    const visitedGlobal = new Set<number>();
    const chunks: TokenData[][] = [];

    /**
     * Recursive dependent collector
     */
    const collect = (headIndex: number, visited: Set<number>) => {
      for (const tok of tokens) {
        if (!allowedDeps.has(tok.dep)) continue;
        if (visited.has(tok.index)) continue;

        const headCandidates = resolveHead(tok.head);
        if (!headCandidates.includes(headIndex)) continue;

        // Accept only NP-internal POS
        if (npPOS.has(tok.pos)) {
          visited.add(tok.index);
          collect(tok.index, visited);
        }
      }
    };

    // NP heads are nouns/pronouns/propns/numerals
    const npHeads = tokens.filter(t =>
      ["NOUN", "PROPN", "PRON", "NUM"].includes(t.pos)
    );

    for (const head of npHeads) {
      if (visitedGlobal.has(head.index)) continue;

      const visited = new Set<number>();
      visited.add(head.index);

      collect(head.index, visited);

      const chunk = Array.from(visited).map(i => tokens[i]);
      chunk.sort((a, b) => a.index - b.index);

      chunks.push(chunk);

      for (const idx of visited) visitedGlobal.add(idx);
    }

    return chunks;
  }

  // --------------------------------------------------------------------------
  // AGREEMENT CHECKING
  // --------------------------------------------------------------------------

  private checkNPAgreement(np: TokenData[]): {
    state: "correct" | "error" | "uncertain";
    case?: string;
    gender?: string;
    number?: string;
    missing?: string[];
  } {
    const cases = new Set<string>();
    const genders = new Set<string>();
    const numbers = new Set<string>();
    const missing: string[] = [];

    let isPlural = false;

    for (const tok of np) {
      if (!["DET", "ADJ", "NOUN", "NUM", "PRON"].includes(tok.pos)) continue;

      const c = MorphAnalyzer.extractCase(tok.morph);
      const g = MorphAnalyzer.extractGender(tok.morph);
      const n = MorphAnalyzer.extractNumber(tok.morph);

      if (!c || c === "unknown") missing.push(`${tok.text}:case`);
      else cases.add(c);

      if (!g || g === "unknown") {
        if (!isPlural) missing.push(`${tok.text}:gender`);
      }
      else genders.add(g);

      if (!n || n === "unknown") missing.push(`${tok.text}:number`);
      else numbers.add(n);

      if (n === "Plur") isPlural = true;
    }

    if (missing.length > 0) {
      return {
        state: "uncertain",
        case: Array.from(cases)[0],
        gender: Array.from(genders)[0],
        number: Array.from(numbers)[0],
        missing,
      };
    }

    const caseAgrees = cases.size === 1;
    const numberAgrees = numbers.size === 1;
    const genderAgrees = isPlural ? true : genders.size === 1;

    if (caseAgrees && numberAgrees && genderAgrees) {
      return {
        state: "correct",
        case: Array.from(cases)[0],
        gender: Array.from(genders)[0],
        number: Array.from(numbers)[0],
      };
    }

    return {
      state: "error",
      case: Array.from(cases)[0],
      gender: Array.from(genders)[0],
      number: Array.from(numbers)[0],
    };
  }
}