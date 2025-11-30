# NLP层架构实现方案 - MVP 路线图

**当前状态（2025年11月30日）**
- 词汇验证进度：**2572/3636 完成 (70.7%)** ⚡ 快速增长中
- 词汇验证进程：**运行中**（从entry 2476）
- 预计完成：**今晚 (~30分钟内)**

---

## 第一阶段：数据层基础 (完成 ✅)

```
当前: 3636个德语词汇 + 词性 + 释义 + CEFR级别
状态: 2572/3636 完成，验证中
目标: 100% 完成验证 → commit → merge to main
```

---

## 第二阶段：NLP引擎 MVP (建议时间: 3-5天)

### 2.1 词形还原模块（Lemmatization）
**文件**: `server/src/services/nlpEngine/lemmatizer.ts`
**时间**: 1 天

```typescript
// 核心功能
interface LemmatizerResult {
  word: string;
  lemma: string;
  confidence: number;
  rules: string[];  // 应用了哪些规则
}

// 规则库（德语特定）
class GermanLemmatizer {
  // 规则1: 动词变位 → 原形
  // gehe, gehst, geht → gehen
  // ging, gingen → gehen
  // gegangen → gehen
  
  // 规则2: 名词复数 → 单数
  // Häuser → Haus
  // Bücher → Buch
  
  // 规则3: 形容词变化 → 基本形式
  // schöner, schönste → schön
  // größer → groß
  
  // 规则4: 可分动词
  // 识别: "abgehen", "aufstehen" → lemma: "gehen", "stehen" (标记separable=true)
  
  lemmatize(word: string): LemmatizerResult;
  lemmatizeMultiple(words: string[]): LemmatizerResult[];
}
```

**实现关键点**：
1. 维护规则数据库（德语变位、复数、分级形容词）
2. 可分动词特殊处理
3. 查询现有词汇库作为验证

**测试用例**：
```
gehe → gehen ✓
Häuser → Haus ✓
abgehen → gehen (separable) ✓
schönere → schön ✓
```

---

### 2.2 词性标注模块（POS Tagging）
**文件**: `server/src/services/nlpEngine/posTagger.ts`
**时间**: 1-1.5 天

```typescript
interface POSResult {
  word: string;
  pos: string;  // NOUN, VERB, ADJ, ADV, PREP, etc.
  confidence: number;
  context?: string;  // 如有二义性
}

class POSTagger {
  // 规则1: 查词汇库
  // 如果 word 在数据库中，直接用其 POS
  
  // 规则2: 词尾识别
  // -ung → NOUN
  // -heit, -keit → NOUN
  // -lich, -bar → ADJ
  // -en, -ern → VERB
  
  // 规则3: 大写识别
  // Großbuchstabe 开头 + 非句首 → likely NOUN
  
  // 规则4: 上下文
  // 前面是 "ein" → likely NOUN
  // 前面是 "zu" → likely VERB/ADJ
  
  tag(word: string, context?: string[]): POSResult;
  tagSentence(sentence: string): POSResult[];
}
```

**数据来源**: 使用现有 `vocabulary` 表中的 `pos` 字段
- 3636个词汇已有POS标注 ✓
- 未知词用规则推断

---

### 2.3 形态学分析（Morphology）
**文件**: `server/src/services/nlpEngine/morphAnalyzer.ts`
**时间**: 1.5 天

```typescript
interface MorphFeature {
  case?: 'nominative' | 'genitive' | 'dative' | 'accusative';
  number?: 'singular' | 'plural';
  gender?: 'masculine' | 'feminine' | 'neuter';
  tense?: 'present' | 'past' | 'perfect' | 'pluperfect';
  mood?: 'indicative' | 'subjunctive' | 'conditional' | 'imperative';
  person?: '1st' | '2nd' | '3rd';
  voice?: 'active' | 'passive';
}

class MorphAnalyzer {
  // 动词形态识别
  analyzeVerb(word: string, lemma: string): MorphFeature;
  
  // 名词形态识别
  analyzeNoun(word: string, article?: string): MorphFeature;
  
  // 形容词形态识别
  analyzeAdjective(word: string, context?: {article: string, noun: {gender, number, case}}): MorphFeature;
  
  // 例: "schöne" + {article: "die", noun: {gender: "f", number: "sg", case: "nom"}}
  //     → {gender: "f", number: "sg", case: "nom", declension: "weak"}
}
```

**规则来源**：
- 德语语法书中的标准变格表
- 可分动词识别
- 虚拟语气检测

---

### 2.4 短语识别模块（Phrase Recognition）
**文件**: `server/src/services/nlpEngine/phraseRecognizer.ts`
**时间**: 1 天

```typescript
interface Phrase {
  text: string;
  tokens: string[];
  type: 'collocation' | 'functional_verb' | 'idiom' | 'prepositional';
  meaning?: string;
  level?: string;  // B1, B2, C1
}

class PhraseRecognizer {
  // 预定义短语库（从vocabulary表派生）
  // - "zur Verfügung stellen" → functional verb
  // - "ins Kino gehen" → prepositional phrase
  // - "sich vorstellen" → reflexive verb phrase
  
  recognizePhrases(tokens: string[]): Phrase[];
  
  // 例: ["Wir", "brachten", "die", "Lösung", "zur", "Anwendung"]
  //     → [Phrase{type: "functional_verb", text: "zur Anwendung"}]
}
```

**数据来源**：
- B1/B2 常见短语库（从现有语法点派生）
- 功能动词列表
- 常见搭配

---

### 2.5 依存解析模块（Dependency Parsing - 简化版）
**文件**: `server/src/services/nlpEngine/dependencyParser.ts`
**时间**: 2 天

```typescript
interface Token {
  id: number;
  word: string;
  lemma: string;
  pos: string;
  morph: MorphFeature;
  head?: number;     // 指向的词的ID
  deprel: string;    // nsubj, obj, aux, etc.
}

interface DependencyTree {
  tokens: Token[];
  root: Token;  // 主动词
  relations: Array<{dependent: Token, head: Token, relation: string}>;
}

class DependencyParser {
  // 基于规则的简单解析（不需要完整的转移解析）
  // 
  // 规则1: V2原则检查
  // 主句动词必须在第2位
  
  // 规则2: 主语识别
  // 在动词前的nom格代词/名词 = nsubj
  
  // 规则3: 直接宾语识别
  // 在动词后的acc格名词/代词 = obj
  
  // 规则4: 间接宾语识别
  // 在动词后的dat格名词/代词 = iobj
  
  // 规则5: 从句检查
  // wenn, weil, dass, ob... 开头 = subordinate clause
  // 从句内动词在末尾
  
  parse(sentence: string): DependencyTree;
  parseMultiple(sentences: string[]): DependencyTree[];
}
```

**关键：这是简化版，关注学习者重要的依存关系**
- V2原则（主句语序）
- 主语/宾语识别
- 从句检测

---

## 第三阶段：NLP引擎集成 (1天)

### 3.1 统一接口
**文件**: `server/src/services/nlpEngine/index.ts`

```typescript
export interface ParsedSentence {
  text: string;
  tokens: Array<{
    word: string;
    lemma: string;
    pos: string;
    morph: MorphFeature;
    position: {start: number, end: number};
  }>;
  dependencies: Array<{
    dependent: number;  // token index
    head: number;
    relation: string;
  }>;
  phrases: Phrase[];
  separableVerbs: Array<{
    prefix: string;
    root: string;
    textSpan: string;
  }>;
  clauses: Array<{
    type: 'main' | 'subordinate';
    tokens: string[];
    clauseMarker?: string;  // wenn, weil, dass...
  }>;
  hasPassive: boolean;
  hasSubjunctive: boolean;
  estimatedDifficulty: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
}

export class NLPEngine {
  parse(text: string): ParsedSentence[];
  
  // 内部组件
  private lemmatizer: GermanLemmatizer;
  private posTagger: POSTagger;
  private morphAnalyzer: MorphAnalyzer;
  private phraseRecognizer: PhraseRecognizer;
  private dependencyParser: DependencyParser;
}
```

---

## 第四阶段：功能解锁（选择一个作为MVP的第一个应用）

### 选项A：自动生词本（最简单，最快见效）
**时间**: 2 天
**文件**: `server/src/services/vocabularyExtraction.ts`

```typescript
interface ExtractedVocabulary {
  lemma: string;
  pos: string;
  level: string;  // CEFR level
  meaning: string;
  examples: string[];
  frequency: number;
  forms: string[];  // gehen, gehe, geht, ging, gegangen...
}

class VocabularyExtractor {
  // 输入: 文章
  // 过程:
  //   1. 用NLPEngine解析全文
  //   2. 提取所有lemma
  //   3. 查词汇库获取: level, meaning, pos
  //   4. 根据lemma收集所有变体
  //   5. 去重、排序
  // 输出: 去重生词本（按词频或难度）
  
  extract(text: string, excludeLevel?: string[]): ExtractedVocabulary[];
  // excludeLevel: 排除 A1, A2 等过于简单的词
}
```

**前端集成** (`components/ChatTutor.tsx`):
```typescript
// 添加"生词本"面板
// 显示: 词 | 词性 | 释义 | 所有变体
// 功能: 复制、导出、导入到学习app
```

**价值**：
- ✅ 立刻可用（无需修改grammar.ts）
- ✅ 基于NLP引擎验证
- ✅ 学生最常用的功能

---

### 选项B：语法纠错（最有用但复杂）
**时间**: 3-4 天
**文件**: `server/src/services/grammarChecker.ts`

```typescript
interface GrammarError {
  type: 'conjugation' | 'agreement' | 'case' | 'word_order' | 'separable_verb';
  position: {start: number, end: number};
  original: string;
  correction: string;
  explanation: string;
  severity: 'critical' | 'major' | 'minor';
}

class GrammarChecker {
  // 规则1: 动词变位检查
  checkConjugation(sentence: ParsedSentence): GrammarError[];
  
  // 规则2: 性数格一致检查
  checkAgreement(sentence: ParsedSentence): GrammarError[];
  
  // 规则3: 格的正确性
  checkCase(sentence: ParsedSentence): GrammarError[];
  
  // 规则4: V2原则
  checkVerbPosition(sentence: ParsedSentence): GrammarError[];
  
  // 规则5: 可分动词顺序
  checkSeparableVerbOrder(sentence: ParsedSentence): GrammarError[];
  
  check(text: string): GrammarError[];
}
```

---

### 选项C：阅读理解题自动生成（创意但有趣）
**时间**: 2-3 天
**文件**: `server/src/services/comprehensionGenerator.ts`

```typescript
interface ComprehensionQuestion {
  question: string;
  answers: {text: string, correct: boolean}[];
  difficulty: string;
  grammarFocus?: string;
  sentence: string;
}

class ComprehensionGenerator {
  // 问题模板:
  // Q: Wer...? (主语 from nsubj)
  // Q: Wen...? (直接宾语 from obj)
  // Q: Wem...? (间接宾语 from iobj)
  // Q: Wann...? (时间状语)
  // Q: Wo...? (地点状语)
  // Q: Warum...? (原因)
  
  generateQuestions(text: string): ComprehensionQuestion[];
}
```

---

## 推荐的MVP实现顺序

```
Week 1 (完成词汇验证)
├─ 2.1: Lemmatizer (1天)
├─ 2.2: POS Tagger (1天)
├─ 2.3: Morph Analyzer (1.5天)
└─ 2.4: Phrase Recognizer (1天)

Week 2 (NLP集成 + 第一个应用)
├─ 2.5: Dependency Parser (2天)
├─ 3.1: 统一接口 (1天)
├─ 选择功能 Option A 或 B (2-4天)
└─ 前端集成 (1天)

总计: 2-2.5 周，3个模块可以立刻用
```

---

## 快速MVP（1周完成）

如果你想要最快的MVP，建议这样做：

### 跳过完整的依存解析，先做Lemmatizer + 生词本提取

```
Day 1-2: Lemmatizer + POS Tagger
Day 3: VocabularyExtractor
Day 4: 前端集成（生词本面板）
Day 5: 测试 + 优化
```

**这样你能**：
- ✅ 一周内交付第一个NLP应用（生词本）
- ✅ 完全独立于DeepSeek API（节省成本）
- ✅ 为后续应用奠定基础

**核心文件结构**：

```
server/src/services/nlpEngine/
├── lemmatizer.ts          (450 行)
├── posTagger.ts           (300 行)
├── phraseRecognizer.ts    (250 行)
├── morphAnalyzer.ts       (400 行)
├── dependencyParser.ts    (500 行)
└── index.ts               (200 行)

server/src/services/
├── vocabularyExtraction.ts (300 行)
├── grammarChecker.ts      (500 行)  [可选]
└── comprehensionGenerator.ts (400 行) [可选]

server/src/routes/
└── nlp.ts                 (150 行) [新API端点]
```

---

## 数据依赖

✅ **已有**:
- 3636个词汇 + lemma + POS + meaning
- 15个语法点定义
- 可分动词列表（可以从词汇库推导）

❌ **需要构建**:
- 德语动词变位规则表 (~500个常用动词)
- 名词复数规则 + 例外 (~1000个)
- 形容词变化规则 + 例外 (~500个)
- 短语库 (~2000个常用短语)

**好消息**: 这些都是静态数据，可以逐步充实

---

## 下一步行动

1. ✅ **等待词汇验证完成** (~30分钟)
2. ✅ **提交 & 合并到 main 分支**
3. 📝 **创建 `nlp-engine` 分支**
4. 🚀 **开始实现 Lemmatizer** （最关键的模块）

建议立刻开始，不用等完全完成。可以：
- Lemmatizer 完成后立刻测试
- 同时继续词汇验证

---

## 关键决策点

> **选择：快速MVP vs 完整系统**

### 快速MVP（1周）
- ✅ Lemmatizer + 生词本
- ✅ 可立刻上线使用
- ❌ 依存解析暂无
- ❌ 语法纠错暂无

### 完整系统（3-4周）
- ✅ 完整NLP引擎
- ✅ 10+ 学习功能可用
- ❌ 需要更多投入

**建议**: 先做快速MVP（1周），建立信心。然后逐步添加高级功能。

