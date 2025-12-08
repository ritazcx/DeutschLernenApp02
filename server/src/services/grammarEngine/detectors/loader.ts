import rawPatterns from './B1/collocationPatterns';
import { CollocationDef } from '../types/collocation';

const GLOBAL_DEFAULTS = {
  verbDeps: ['obj', 'dobj', 'oa', 'obl', 'nk'],
  reflexiveDeps: ['obj', 'iobj', 'refl', 'oa', 'dobj'],
  prepDeps: ['case', 'op', 'mnr'],
  nounDeps: ['obj', 'nmod', 'obl'],
  maxDepth: 3,
};

function mergeArray(...arrays: Array<any[] | undefined>): string[] {
  const out = new Set<string>();
  for (const arr of arrays) {
    if (!Array.isArray(arr)) continue;
    for (const x of arr) out.add(String(x));
  }
  return Array.from(out);
}

function normalizeDepSignature(def: any) {
  const rawSig = def.depSignature || {};

  // Legacy reflexive listing at def.reflexive.dep
  const legacyRefl = def.reflexive && Array.isArray(def.reflexive.dep) ? def.reflexive.dep : undefined;

  const verbDeps = mergeArray(rawSig.verbDeps, GLOBAL_DEFAULTS.verbDeps);
  const reflexiveDeps = mergeArray(rawSig.reflexiveDeps, legacyRefl, GLOBAL_DEFAULTS.reflexiveDeps);
  const prepDeps = mergeArray(rawSig.prepDeps, GLOBAL_DEFAULTS.prepDeps);
  const nounDeps = mergeArray(rawSig.nounDeps, GLOBAL_DEFAULTS.nounDeps);
  const maxDepth = typeof rawSig.maxDepth === 'number' ? rawSig.maxDepth : GLOBAL_DEFAULTS.maxDepth;

  return {
    ...rawSig,
    verbDeps,
    reflexiveDeps,
    prepDeps,
    nounDeps,
    maxDepth,
  };
}

function normalizeOne(def: any): CollocationDef {
  const depSignature = normalizeDepSignature(def);
  return { ...def, depSignature } as CollocationDef;
}

const patterns: CollocationDef[] = (rawPatterns as any[]).map(normalizeOne);

export default patterns;
