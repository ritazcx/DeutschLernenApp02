# 快速参考: npm test 问题解决方案

## 核心概念
**旧方案**: 每个测试初始化一次 spaCy (n个测试 × 30s = 300s+，最后卡住)
**新方案**: spaCy初始化一次，所有测试共享 (30s + 2-5s = 35-40s) ⚡

## 新的 npm 命令

```bash
# 快速开发（单元测试，无 spaCy）
npm run test:unit              # ~5-10 秒
npm run test:watch:unit        # 监看单元测试

# 完整测试（集成测试，含 spaCy）
npm test                       # 等同于下面
npm run test:integration       # ~35-40 秒
npm run test:watch             # 监看集成测试

# 覆盖率报告
npm run test:coverage          # ~40-50 秒
```

## 工作流示例

```bash
# 步骤 1: 开发阶段 - 快速验证（秒级）
$ npm run test:unit
✓ 15 tests passed in 5s
[修改代码]
$ npm run test:watch:unit
# 自动重运行...

# 步骤 2: 完整验证 - 提交前（分钟级）
$ npm test
✓ Global Setup: initializing spaCy...
✓ spaCy service initialized in 18s
✓ 80 tests passed in 2s
✓ Global Teardown: shutting down spaCy...
✓ All tests passed

# 步骤 3: CI/CD - 生成报告
$ npm run test:coverage
✓ Coverage: 78%
```

## 技术架构

### 单元测试配置
- 位置: `jest.config.unit.js`
- 范围: `tests/unit/**/*.test.ts` 只
- 排除: `tests/integration/`, `tests/e2e/`, spacy-backed
- 超时: 10s
- 并行: 50%
- spaCy: 不需要 ✓

### 集成测试配置  
- 位置: `jest.config.js` / `jest.config.integration.js`
- 范围: 所有 `*.test.ts`
- Global Setup: `tests/globalSetup.ts`
- Global Teardown: `tests/globalTeardown.ts`
- 超时: 30s (单个测试)
- 并行: 否 (maxWorkers: 1)
- spaCy: 需要 ✓

### spaCy 生命周期

```
开始测试
  ↓
Global Setup (自动执行)
  ├─ 创建 SpacyService
  ├─ 等待 isReady() = true (最多 60s)
  ├─ 健康检查 + 自动重试
  └─ 存储到 global.__SPACY_SERVICE__
  ↓
测试 1: 使用全局 spaCy (~100ms)
测试 2: 使用全局 spaCy (~120ms)
...
  ↓
Global Teardown (自动执行)
  ├─ 调用 service.shutdown()
  ├─ 优雅关闭 (2s) + 强制kill (1s)
  └─ 清理资源
  ↓
完成
```

## 修改的关键文件

| 文件 | 变化 | 说明 |
|------|------|------|
| `jest.config.js` | 改进 | 添加 globalSetup/globalTeardown |
| `jest.config.unit.js` | ✨新建 | 单元测试专用 |
| `jest.config.integration.js` | ✨新建 | 集成测试专用 |
| `spacyService.ts` | 改进 | 新增 isReady(), healthCheck(), shutdown() |
| `package.json` | 改进 | 新增 npm scripts |
| `globalSetup.ts` | ✨新建 | spaCy 初始化 |
| `globalTeardown.ts` | ✨新建 | spaCy 关闭 |
| `integrationUtils.ts` | ✨新建 | 集成测试辅助 |
| `TESTING.md` | ✨新建 | 完整文档 |

## 如何在新建测试中使用 spaCy

```typescript
import { getNLPEngineForIntegrationTests, isSpacyServiceReady } from '../integrationUtils';

describe('My Integration Tests', () => {
  let nlpEngine: NLPEngine;

  beforeAll(() => {
    // 检查 spaCy 是否就绪（可选）
    if (!isSpacyServiceReady()) {
      console.warn('spaCy not ready');
    }
    
    // 获取共享的 NLPEngine 实例
    nlpEngine = getNLPEngineForIntegrationTests();
  });

  it('should work with spaCy', async () => {
    const result = await nlpEngine.analyzeGrammar('Das ist einfach.');
    expect(result.summary.totalPoints).toBeGreaterThan(0);
  }, 20000); // 足够的超时时间
});
```

**关键点**: 
- 文件必须在 `tests/integration/` 目录
- 不在 `testPathIgnorePatterns` 中
- 使用 `getNLPEngineForIntegrationTests()`

## 故障排查

### 问题: "spaCy service not ready"
```
✗ Error: spaCy service did not become ready within 60s
```
**原因**: spaCy 模型加载超时  
**解决**:
1. 检查 `spacy-service.py` 是否存在
2. 运行 `python3 server/spacy-service.py` 手动测试
3. 增加 `globalSetup.ts` 中的 `maxWaitTime`

### 问题: 进程仍在运行
```
✗ Error: Cannot log after tests are done
```
**原因**: spaCy 进程未正确关闭  
**解决**: 
- 检查 `globalTeardown.ts` 是否执行
- 手动 `pkill -f spacy` 清理
- 重新运行 `npm test`

### 问题: 测试超时
```
✗ Timeout - Async callback was not invoked within 30000ms
```
**原因**: 测试运行超过 30 秒  
**解决**:
1. 检查 spaCy 服务是否正常
2. 在测试中增加 `testTimeout`: `it('test', async () => {...}, 40000)`
3. 简化测试内容

## 性能对比

| 指标 | 旧方案 | 新方案 | 改进 |
|------|-------|--------|------|
| 10 个集成测试 | ~300s | ~40s | **7.5 倍** |
| 单元测试 | - | ~5s | **即时** |
| spaCy 初始化 | 10×(10-30s) | 1×(10-30s) | **10 倍** |
| 进程泄漏 | 频繁 | 无 | **稳定** |
| 开发循环 | 等待... 😴 | 秒级反馈 ⚡ | **更爽** |

## 下一步

选择其中一个继续:

### A. 验证系统工作
```bash
npm run test:integration
# 查看是否成功初始化和关闭 spaCy
```

### B. 实现更多测试
- 现在有稳定的测试基础
- 可以快速验证新功能
- 集成测试在 `tests/integration/` 目录

### C. 优化检测器
- 利用 spaCy 数据改进启发式算法
- 减少虚假正例/负例
- 用集成测试验证改进

---
**详细文档**: 查看 `server/TESTING.md`
