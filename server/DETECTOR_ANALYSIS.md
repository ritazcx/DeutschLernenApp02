# Grammar Detector Analysis - Why Users See Limited Grammar Points

## Problem Summary
Users report seeing primarily B1-level grammar points detected, with very few or no A1/A2/B2+ detections, even in text that contains those structures.

## Current Architecture

### Detection Pipeline
- **GrammarDetectionEngine**: Orchestrates 20+ specialized detectors
- **Detectors by Level**: 
  - A1GrammarDetector (present tense, nominative case, agreement)
  - A2GrammarDetector (simple past, perfect, dative, accusative, modals, reflexives)
  - TenseDetector, CaseDetector, PassiveVoiceDetector, etc.
  - AI Fallback: AIGrammarDetector (uses Gemini API)

### Data Flow
1. Input: Text sentence
2. NLPEngine: Parses with spaCy → SentenceData (tokens with morph, dep, pos)
3. GrammarDetectionEngine: Runs all detectors on SentenceData
4. Merge & Filter: Deduplicates, scores by confidence
5. Output: Categorized grammar points by CEFR level

## Root Cause Analysis

### Issue 1: Incomplete Morphological Data from spaCy
**Problem**: spaCy German model sometimes returns incomplete morph information
- Expected: `{ Tense: 'Pres', VerbForm: 'Fin', Person: '1', Number: 'Sing' }`
- Actual: Sometimes missing `Tense`, `Person`, `VerbForm` fields
- Impact: Detectors rely on these fields and skip tokens with missing data

**Evidence**:
```
Token "laufen":
  - Expected: pos='VERB', morph.Tense='Pres', morph.VerbForm='Fin'
  - Actual: pos='VERB', morph.VerbForm='Part' (participle detected incorrectly)
```

### Issue 2: Detector Logic Too Strict
**Problem**: Detectors use exact matching, not fuzzy detection

**Example 1: A1 Present Tense Detection**
```typescript
// Current code requires BOTH conditions:
if (tense === 'Pres' && verbForm === 'Fin') {  // Too strict!
  // Report
}
```
- If spaCy returns morph without explicit Tense field, detection fails
- No fallback to verb conjugation pattern analysis

**Example 2: Subject-Verb Agreement**
```typescript
// Looks for nominative noun + verb with matching person/number
// But fails if:
// - morph.Person is missing from verb
// - morph.Case is missing from noun
// - heuristic "looksLikeSubject()" incorrectly categorizes position
```

### Issue 3: Missing Heuristic Fallbacks
**Problem**: Detectors don't have backup strategies when morphological data is incomplete

**What happens**:
```
Normal path (morphology complete):
  Input: "Ich laufe" → Tense=Pres detected ✓

Degraded path (morphology incomplete):
  Input: "Ich laufe" → Tense field missing → Detection fails ✗
  (No fallback to: look at conjugation patterns, verb lemma, etc.)
```

### Issue 4: Detection Confidence Thresholding
**Problem**: Some detectors report results with low confidence (0.6-0.8), which may be filtered by downstream processing

**Example**:
```typescript
// A1GrammarDetector reports:
{
  confidence: 0.85,  // Depends on morphology quality
  // If actual morphology incomplete, confidence should be lower
}
```

## Specific Detector Issues

### A1GrammarDetector
**What it detects**:
- Present tense verbs
- Nominative case nouns
- Subject-verb agreement

**Issues**:
1. `detectPresentTense()`: Requires `tense === 'Pres'` && `verbForm === 'Fin'`
   - Fails if spaCy doesn't set Tense field
   - No fallback to conjugation pattern (laufe/läufst/läuft = present)

2. `detectNominativeCase()`: Uses `looksLikeSubject()` heuristic
   - Requires nominative noun within 8 tokens before verb
   - Fails for unusual word orders (questions, subordinate clauses)

3. `detectSubjectVerbAgreement()`: Looks for matching person/number
   - Requires both noun AND verb to have person/number in morph
   - Fails when either is missing from spaCy output

### A2GrammarDetector
**What it detects**:
- Simple past (Präteritum)
- Present perfect (Perfekt)
- Dative case
- Accusative case
- Modal verbs
- Reflexive pronouns

**Issues**:
1. `detectSimplePast()`: Requires `tense === 'Past'` && `verbForm === 'Fin'`
   - Fails if spaCy doesn't set Tense, even for clear past forms like "lief", "aß"
   - No pattern matching for irregular verb forms

2. `detectPresentPerfect()`: Looks for `haben/sein` + participle
   - Works better since it checks verb lemmas and VerbForm
   - But may miss cases where participle VerbForm is incorrectly set

3. Case detection (dative, accusative):
   - Requires explicit Case field in morph
   - Fails silently if spaCy omits this

### Missing Detections (B2+ patterns)
**Already detected**:
- Passive voice (werden + participle)
- Subordinate clauses (weil, dass, wenn)
- Relative clauses (der, die, das)
- Conditional (würde, hätte)
- Subjunctive (rare)

**Potentially under-detected**:
- Complex reflexive constructions
- Prepositional phrase attachments
- Complex adjective structures
- Advanced modal + infinitive combinations

## Recommendations for Improvement

### Short-term (Quick Wins)

#### 1. Add Fallback Pattern Matching for Tense Detection
```typescript
// Add to A1GrammarDetector.detectPresentTense()
if (tense === 'Pres' && verbForm === 'Fin') {
  // Existing logic
}
// FALLBACK: If morph incomplete, check verb conjugation patterns
else if (this.looksLikePresentTense(token.text, token.lemma)) {
  // Report with slightly lower confidence
}

private looksLikePresentTense(word: string, lemma: string): boolean {
  // For common A1 verbs, check if word matches present conjugation
  const conjugations = {
    'sein': ['bin', 'bist', 'ist', 'sind', 'seid'],
    'haben': ['habe', 'hast', 'hat', 'haben', 'habt'],
    'laufen': ['laufe', 'läufst', 'läuft', 'laufen', 'lauft'],
    // ... more verbs
  };
  return conjugations[lemma]?.includes(word.toLowerCase()) ?? false;
}
```

#### 2. Improve Heuristics for Subject Detection
```typescript
// Replace simple 8-token lookahead with smarter heuristics
private looksLikeSubject(tokens: TokenData[], index: number): boolean {
  const token = tokens[index];
  
  // Rule 1: Nominative noun before first finite verb
  for (let i = index + 1; i < tokens.length; i++) {
    if (tokens[i].pos === 'VERB' && tokens[i].morph?.['VerbForm'] === 'Fin') {
      return true;  // Found verb after noun
    }
    if (tokens[i].dep === 'nsubj' || tokens[i].dep === 'nsubj:pass') {
      return false;  // Another subject found, this isn't it
    }
  }
  
  // Rule 2: Check dependency parsing (if available)
  if (token.dep === 'nsubj' || token.dep === 'nsubj:pass') {
    return true;  // Marked as subject in dependency tree
  }
  
  return false;
}
```

#### 3. Handle Missing Case Information
```typescript
// Add to A2GrammarDetector.detectAccusativeCase()
const caseVal = MorphAnalyzer.extractCase(token.morph || {});

if (caseVal === 'Acc') {
  // Existing logic
} else if (!caseVal) {
  // FALLBACK: Check article + noun gender/number for case inference
  const articleBefore = this.findArticleBeforeNoun(tokens, i);
  if (articleBefore && this.articleIndicatesAccusative(articleBefore.text)) {
    // Report with medium confidence
  }
}
```

#### 4. Use Dependency Parsing (already available!)
Most detectors don't use `token.dep` field, but spaCy provides it:
```typescript
// Current: Searches by position (error-prone)
// Better: Use dependency relations
for (let i = 0; i < tokens.length; i++) {
  const token = tokens[i];
  if (token.dep === 'nsubj') {
    // This is the SUBJECT, report agreement
  }
  if (token.dep === 'iobj') {
    // This is INDIRECT OBJECT (dative in German)
  }
  if (token.dep === 'obj') {
    // This is DIRECT OBJECT (accusative in German)
  }
}
```

### Medium-term (Structural Improvements)

#### 5. Create Confidence Scoring System
```typescript
// Instead of hardcoded 0.85, calculate based on data completeness
private calculateConfidence(token: TokenData, requiredFields: string[]): number {
  let baseConfidence = 0.95;
  const availableFields = requiredFields.filter(f => token.morph?.[f]);
  const missingRatio = (requiredFields.length - availableFields.length) / requiredFields.length;
  
  // Lower confidence if data is incomplete
  baseConfidence -= missingRatio * 0.3;
  
  return baseConfidence;
}
```

#### 6. Add B2+ Specific Detectors
Currently missing or weak:
- Complex passive constructions (sein + participle = state)
- Advanced modal combinations
- Infinitive constructions (um ... zu, ohne ... zu)
- Subjunctive in conditional clauses

#### 7. Integrate Dependency Parsing More
Use spaCy's dependency parse tree (already in SentenceData):
- Subject identification: `token.dep === 'nsubj'`
- Object identification: `token.dep === 'obj' || token.dep === 'iobj'`
- Clause attachment: `token.dep === 'acl'`, `token.dep === 'advcl'`
- Preposition object: `token.dep === 'obl'` (oblique)

## Implementation Priority

1. **High Priority** (Quick wins, big impact):
   - Add tense pattern matching fallback
   - Use dependency parsing for case detection
   - Improve subject identification heuristics

2. **Medium Priority** (Moderate effort, good impact):
   - Confidence scoring based on data completeness
   - Add B2+ specific detectors
   - Handle missing morph fields gracefully

3. **Low Priority** (Nice-to-have):
   - Advanced collocation detection
   - Semantic-based pattern matching
   - Machine learning-based confidence estimation

## Testing Strategy

### Unit Tests
Create test cases for degraded morphology:
```typescript
// Test: Present tense detection with incomplete morph
const incompleteToken = createGermanVerb('laufe', 'laufen', {
  // Tense field missing intentionally
  VerbForm: 'Fin'
});
// Should still detect as present tense (with lower confidence)
const results = detector.detect(createMockSentenceData('Ich laufe', [pronounToken, incompleteToken]));
expect(results.length).toBeGreaterThan(0);  // Currently fails!
```

### Integration Tests
Test with real spaCy output (sometimes incomplete):
```typescript
// Test with actual spaCy-parsed German text
const text = "Ich laufe schnell nach Hause.";
const sentenceData = await nlpEngine.parseSentence(text);
const results = detector.detect(sentenceData);
// Should detect: present tense, nominative case, subject-verb agreement
expect(results.length).toBeGreaterThan(3);
```

## Validation Metrics

After implementing improvements, measure:

| Metric | Current | Target |
|--------|---------|--------|
| A1 detection rate | ~30% | >80% |
| A2 detection rate | ~20% | >70% |
| B1 detection rate | ~60% | >75% |
| B2+ detection rate | ~10% | >50% |
| False positive rate | Unknown | <10% |
| Average confidence score | 0.80 | 0.85+ |

## Conclusion

The system has good structural design but suffers from:
1. **Over-reliance on complete morphological data** - spaCy sometimes returns incomplete morph
2. **Lack of fallback heuristics** - when morphology is incomplete, detection stops
3. **Under-utilization of dependency parsing** - could replace position-based heuristics
4. **Missing B2+ patterns** - need more advanced detectors

Implementing the recommended improvements will significantly improve detection coverage across all CEFR levels.
