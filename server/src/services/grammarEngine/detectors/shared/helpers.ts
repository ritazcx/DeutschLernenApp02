import { GrammarPoint } from '../../cefr-taxonomy';

interface BuildOptions {
  idPrefix?: string;
  level?: string;
  category?: string;
}

/**
 * Build a canonical GrammarPoint object from a pattern/source.
 * This centralizes how detectors map DSL/taxonomy entries into the
 * runtime GrammarPoint shape consumed by the detection engine.
 */
export function buildGrammarPoint(src: any, opts: BuildOptions = {}): GrammarPoint {
  const id = opts.idPrefix ? `${opts.idPrefix}${src.id || src.name || 'unknown'}` : (src.id || src.name || 'unknown');
  const category = (opts.category as any) || src.category || src.type || 'collocation';
  const level = (opts.level as any) || src.level || 'B1';

  const name = src.name || src.label || (() => {
    if (src.verb && src.verb.lemma) {
      if (src.type === 'reflexive-prep') return `sich ${src.verb.lemma} ${src.prep?.lemma || ''}`.trim();
      if (src.type === 'verb-prep') return `${src.verb.lemma} ${src.prep?.lemma || ''}`.trim();
      if (src.type === 'verb-noun') return `${src.noun?.lemma || ''} ${src.verb.lemma}`.trim();
      return src.verb.lemma;
    }
    return src.id || src.name || '';
  })();

  const description = src.description || src.text || `Grammar point: ${name}`;
  const examples = Array.isArray(src.examples) ? src.examples : (src.examples ? [src.examples] : []);

  const explanation = src.meaning || src.explanation || src.description || src.note || '';

  const gp: GrammarPoint = {
    id: String(id),
    category: category as any,
    level: level as any,
    name: String(name),
    description: String(description),
    examples,
    explanation: String(explanation),
  } as GrammarPoint;

  // Optional enrichments from src
  if (src.contextVariants) gp.contextVariants = src.contextVariants;
  if (src.spaCyFeatures) gp.spaCyFeatures = src.spaCyFeatures;
  if (src.relatedVocabulary) gp.relatedVocabulary = src.relatedVocabulary;

  return gp;
}

export default buildGrammarPoint;
