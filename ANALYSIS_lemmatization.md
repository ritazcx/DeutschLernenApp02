# 词汇匹配算法需求分析

## 1. 需求概述

实现德语词汇的智能匹配系统，包括：
- 词形还原（lemmatization）：将变化形式还原到基本形式
- 短语匹配：识别多词短语
- 可分动词处理：处理德语特有的可分动词结构

---

## 2. 核心挑战分析

### 2.1 词形还原的复杂性

**德语名词变化（4个格，3个性别）：**
```
基本形式: Haus (房子)
变体: des Hauses, dem Haus, den Häusern, etc.
```

**德语动词变化（时态、人称、语态）：**
```
基本形式: gehen (去)
变体: gehst, geht, gehe, gingen, gegangen, etc.
```

**德语形容词变化（格、性、数、定冠词类型）：**
```
基本形式: schön (美的)
变体: schönen, schöner, schönes, schönere, etc.
```

**问题：** 
- JavaScript中缺乏完善的德语NLP库
- 简单的规则不足以覆盖所有情况（德语有许多不规则变化）
- 需要大量的字典/规则库

### 2.2 短语匹配的复杂性

**固定搭配（Kollokationen）：**
```
"sich freuen auf" (期待)
"Angst haben vor" (害怕)
"in Betracht ziehen" (考虑)
```

**问题：**
- 短语可能被其他词汇打断
- 需要考虑词序和灵活性
- 短语内部词汇可能也需要还原

### 2.3 可分动词的特殊性

**可分动词结构：**
```
基本形式: abhängen (取决于)
使用: "Das hängt von dir ab" (这取决于你)
特点: 前缀在句子中分离出来
```

**问题：**
- 识别可分动词前缀（ab-, an-, auf-, aus-, etc.）
- 在句子中找到分离的两部分
- 需要维护可分动词列表

---

## 3. 技术方案对比

### 方案A：JavaScript + NLP库（当前环境）

**推荐库：**
- `germalemma` - 专门德语词形还原
- `compromise` - 通用NLP，有德语支持
- `natural` - Node.js NLP库

**优点：**
- 保持单一技术栈（JavaScript/TypeScript）
- 部署简单（无额外服务）
- 实时处理，无网络开销

**缺点：**
- 库的准确度有限（可能60-80%）
- 维护和扩展困难
- 需要手动处理特殊情况

**实现难度：** ⭐⭐⭐ (中等)

### 方案B：Python微服务（推荐 - 最佳准确度）

**技术栈：**
- spaCy德语模型 (`de_core_news_md`)
- 或 NLTK + HanTa
- Flask/FastAPI提供HTTP接口

**优点：**
- spaCy德语模型准确度高（85%+）
- 可处理复杂的语言学分析
- 易于扩展和维护
- 可离线运行（不依赖外部API）

**缺点：**
- 需要部署额外服务
- Node.js和Python之间的进程间通信开销
- 增加系统复杂度

**实现难度：** ⭐⭐⭐⭐ (较难)

### 方案C：外部API（快速但成本高）

**选项：**
- DeepL API - 有词形还原功能
- Google Cloud NLP
- AWS Comprehend

**优点：**
- 高准确度
- 零维护成本
- 不需要本地模型

**缺点：**
- 每次调用产生成本
- 依赖网络连接
- 隐私问题（数据上传）
- 响应延迟

**实现难度：** ⭐ (简单)

---

## 4. 推荐实现方案

### 阶段1：快速MVP（第一周）

**使用方案：JavaScript库 + 预构建词典**

```typescript
// 核心思路
interface LemmaEntry {
  form: string;
  lemma: string;
  pos: string; // 词性
  tags?: string[]; // 语法标签
}

// 简化实现
const lemmaDict: Map<string, string> = new Map([
  // 动词
  ['gehst', 'gehen'],
  ['geht', 'gehen'],
  ['ging', 'gehen'],
  
  // 名词
  ['Häuser', 'Haus'],
  ['des', 'die'],
  
  // 形容词
  ['schönen', 'schön'],
  ['schöner', 'schön'],
]);

function lemmatize(word: string): string {
  return lemmaDict.get(word.toLowerCase()) || word;
}
```

**预构建词典来源：**
- 现有vocabulary数据库中的词汇
- 德语morphology数据集（开源）
- 手动规则（前缀、后缀模式）

**预期准确度：** 70-80%
**实现时间：** 2-3天

---

### 阶段2：完整解决方案（第二周）

**推荐使用Python微服务**

```python
# services/lemmatizer.py
import spacy
from flask import Flask, jsonify

app = Flask(__name__)
nlp = spacy.load("de_core_news_md")

@app.route('/lemmatize', methods=['POST'])
def lemmatize_text(text: str):
    doc = nlp(text)
    result = []
    for token in doc:
        result.append({
            'text': token.text,
            'lemma': token.lemma_,
            'pos': token.pos_,
            'tag': token.tag_
        })
    return jsonify(result)
```

**集成步骤：**
1. 启动Python微服务（Docker化）
2. Node.js通过HTTP调用
3. 缓存常见词汇的还原结果
4. 降级方案：如果服务不可用，使用JavaScript库

**预期准确度：** 85-90%
**实现时间：** 3-4天

---

### 阶段3：优化和特殊处理（第三周）

**可分动词处理：**
```typescript
const separableVerbs = {
  'abhängen': 'ab',
  'anfangen': 'an',
  'aufstehen': 'auf',
  'einkaufen': 'ein',
  // ...
};

function findSeparableVerb(tokens: string[], index: number) {
  // 在当前位置后查找可分动词前缀
  // 例如：["hängt", "...", "ab"] → "ab-hängen"
}
```

**短语匹配（最长优先）：**
```typescript
const phrases = [
  { tokens: ['sich', 'freuen', 'auf'], lemma: 'sich_freuen_auf' },
  { tokens: ['Angst', 'haben', 'vor'], lemma: 'Angst_haben_vor' },
];

function matchPhrases(tokens: string[]) {
  // 贪心算法：从长到短尝试匹配
  for (let length = Math.min(4, tokens.length); length > 0; length--) {
    // 检查是否有长度为length的短语匹配
  }
}
```

---

## 5. 现有资源利用

### 已有数据：
- **vocabulary表**：3636个词汇，有lemma潜力
- **grammar_points表**：42个语法规则点
- **需要补充**：每个词汇的形变表

### 可用开源数据：
- **German morphology dataset** - 德语词形变化数据
- **Universal Dependencies German** - 依赖解析语料库
- **German Stop Words** - 常用词汇

---

## 6. 实现优先级建议

### 第1优先级（必做）：
1. **词性-based还原** - 按词性分类实现规则
   - 动词：去掉时态/人称后缀
   - 名词：处理格变和复数
   - 形容词：去掉屈折后缀

2. **可分动词识别** - 处理德语特有结构

### 第2优先级（重要）：
3. **常用短语库** - 前100个高频短语

### 第3优先级（优化）：
4. **Python spaCy集成** - 提高准确度到85%+
5. **缓存和性能优化**

---

## 7. 成本-收益分析

| 方案 | 准确度 | 实现时间 | 维护成本 | 推荐度 |
|-----|-------|--------|--------|-------|
| JS库 + 词典 | 70-80% | 2-3天 | 低 | ⭐⭐⭐ (快速开始) |
| Python spaCy | 85-90% | 4-5天 | 中 | ⭐⭐⭐⭐⭐ (最终目标) |
| 外部API | 95%+ | 1天 | 高(费用) | ⭐⭐ (成本限制) |
| 混合方案 | 80-85% | 3-4天 | 中 | ⭐⭐⭐⭐ (平衡) |

---

## 8. 建议路线图

**Week 1：MVP实现**
- [ ] 构建基础词形还原规则（动词/名词/形容词）
- [ ] 实现可分动词识别
- [ ] 集成到现有AI Prompt中
- 预期准确度：70-75%

**Week 2：完整解决方案**
- [ ] 部署Python spaCy服务
- [ ] 集成词形还原到词汇匹配
- [ ] 添加常用短语库
- 预期准确度：85%+

**Week 3：优化和上线**
- [ ] 性能测试和缓存优化
- [ ] 降级方案实现
- [ ] 用户测试和反馈
- 预期准确度：85-90%

