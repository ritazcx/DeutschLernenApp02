export type DepSignature = {
  verbDeps: string[];
  reflexiveDeps: string[];
  prepDeps: string[];
  nounDeps?: string[];
  maxDepth: number;
  mustMatchDeps?: string[];
  shouldMatchDeps?: string[];
  headRelation?: string;
  normalizeVerbForms?: boolean;
  collapseAux?: boolean;
  allowParticiple?: boolean;
};

export type CollocationBase = {
  id: string;
  type: 'reflexive-prep' | 'verb-prep' | 'verb-noun' | 'separable';
  verb: { lemma: string; pos?: string };
  depSignature: DepSignature;
  mustMatch?: string[];
  shouldMatch?: string[];
  examples?: string[];
  meaning?: string;
};

export type ReflexivePrepDef = CollocationBase & {
  type: 'reflexive-prep';
  reflexive?: { required?: boolean; dep?: string[] };
  prep?: { lemma: string; dep?: string };
  noun?: { lemma?: string };
};

export type VerbPrepDef = CollocationBase & {
  type: 'verb-prep';
  prep: { lemma: string; dep?: string };
  separable?: { particle?: string };
};

export type VerbNounDef = CollocationBase & {
  type: 'verb-noun';
  noun: { lemma: string; pos?: string };
};

export type SeparableDef = CollocationBase & {
  type: 'separable';
  separable: { particle: string };
};

export type CollocationDef = ReflexivePrepDef | VerbPrepDef | VerbNounDef | SeparableDef;

export default CollocationDef;
