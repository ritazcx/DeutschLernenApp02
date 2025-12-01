## 测试系统说明

### 问题和解决方案

**问题**: `npm test` 启动 spaCy 服务后卡住，原因是：
1. spaCy 模型加载需要 10-30 秒
2. 默认 Jest 超时 5 秒不足
3. 每个测试都重复初始化 spaCy 服务，效率低下
4. 进程清理不完全导致测试套件无法完成

**解决方案**: 使用 Jest 的 Global Setup/Teardown 机制
- spaCy 服务在所有测试**前**初始化一次（globalSetup）
- 所有测试共享同一个 spaCy 服务实例（快速）
- 所有测试**后**统一关闭服务（globalTeardown）
- 单个集成测试超时设为 30 秒

### 新的测试命令

```bash
# 运行单元测试（不需要 spaCy，快速）
npm run test:unit

# 运行集成测试（需要 spaCy，包含所有测试）
npm run test:integration

# 默认：npm test 运行集成测试
npm test

# 单元测试监看模式
npm run test:watch:unit

# 集成测试监看模式
npm run test:watch

# 生成覆盖率报告（基于集成测试）
npm run test:coverage
```

### 配置文件说明

| 文件 | 用途 |
|------|------|
| `jest.config.js` | **主配置**（集成测试）|
| `jest.config.unit.js` | 单元测试专用配置 |
| `jest.config.integration.js` | 集成测试专用配置 |
| `tests/globalSetup.ts` | spaCy 服务启动（自动执行） |
| `tests/globalTeardown.ts` | spaCy 服务关闭（自动执行） |
| `tests/integrationUtils.ts` | 辅助函数供集成测试使用 |

### 执行流程

#### 单元测试流程
```
jest 启动
  ↓
加载 jest.config.unit.js
  ↓
测试运行（excludes integration/e2e）
  ↓
无 globalSetup，不需要 spaCy
  ↓
完成，无需清理 spaCy
```

#### 集成测试流程
```
jest 启动
  ↓
加载 jest.config.integration.js (或 jest.config.js)
  ↓
执行 globalSetup
  ├─ 创建 SpacyService 实例
  ├─ 等待 service.isReady() 返回 true (最多 60s)
  └─ 存储到 global.__SPACY_SERVICE__
  ↓
测试运行（maxWorkers=1，串行执行）
  ├─ 每个测试 testTimeout: 30000
  └─ 通过 getNLPEngineForIntegrationTests() 使用全局 spaCy
  ↓
执行 globalTeardown
  ├─ 从 global.__SPACY_SERVICE__ 获取实例
  ├─ 调用 service.shutdown()
  └─ 优雅关闭，超时后强制 kill
```

### SpacyService 改进

**新增方法**:
- `isReady(): boolean` - 检查服务是否就绪
- `shutdown(): Promise<void>` - 优雅关闭服务
- `private healthCheck()` - 内部健康检查

**改进的单例**:
```typescript
export function getSpacyService(): SpacyService {
  // 优先使用全局管理的实例（集成测试）
  if ((global as any).__SPACY_SERVICE__) {
    return (global as any).__SPACY_SERVICE__;
  }
  
  // 降级到本地单例（非测试环境）
  if (!instance) {
    instance = new SpacyService();
  }
  return instance;
}
```

### 运行集成测试时的输出示例

```
╔════════════════════════════════════════════════════════╗
║       Global Setup: Initializing spaCy Service        ║
╚════════════════════════════════════════════════════════╝

[Setup] Current status: initializing
[Setup] Current status: ready
✓ spaCy service initialized successfully in 18234ms

 PASS  tests/integration/spacy-backed.test.ts
  Grammar Detection with Real spaCy Data
    PassiveVoiceDetector
      ✓ should detect present passive voice (234ms)
      ✓ should detect past passive voice (185ms)
    ...

╔════════════════════════════════════════════════════════╗
║      Global Teardown: Shutting down spaCy Service     ║
╚════════════════════════════════════════════════════════╝

✓ spaCy service shut down successfully

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
```

### 故障排查

**问题**: 测试超时
```
FAIL tests/integration/spacy-backed.test.ts
  ● Timeout - Async callback was not invoked within the 30000ms timeout
```

**原因**: spaCy 服务初始化超过 30 秒

**解决**:
1. 检查 spacy-service.py 是否正常
2. 增加 globalSetup 中的 maxWaitTime（当前 60s）
3. 增加单个测试的 testTimeout（当前 30s）

**问题**: 无法找到 spaCy 服务
```
[spaCy Service] ✗ Could not find spacy-service.py in any location
```

**原因**: spacy-service.py 文件丢失或路径错误

**解决**:
1. 确保 `server/spacy-service.py` 存在
2. 检查构建过程是否包含该文件
3. 在 Render 部署时确保 Python 环境正确配置

### 最佳实践

1. **快速迭代**: 使用 `npm run test:unit` 进行快速测试
2. **集成验证**: 用 `npm run test:integration` 在 CI/CD 前
3. **监看模式**: `npm run test:watch:unit` 开发中实时反馈
4. **完整覆盖**: CI/CD 管道中运行 `npm run test:coverage`

### 迁移指南

如果有其他需要 spaCy 的测试：

```typescript
// 在文件顶部导入辅助工具
import { getNLPEngineForIntegrationTests, isSpacyServiceReady } from '../integrationUtils';

describe('My Integration Tests', () => {
  let nlpEngine: NLPEngine;

  beforeAll(() => {
    // 可选：检查 spaCy 是否就绪
    if (!isSpacyServiceReady()) {
      console.warn('spaCy not ready - tests may fail');
    }
    nlpEngine = getNLPEngineForIntegrationTests();
  });

  it('should use spaCy', async () => {
    const result = await nlpEngine.analyzeGrammar('Das ist ein Test.');
    expect(result).toBeDefined();
  });
});
```

### 配置详解

**maxWorkers: 1** (集成测试)
- 确保测试串行执行，避免 spaCy 进程冲突
- 单元测试可用 '50%' 并行执行

**testTimeout: 30000** (集成测试)
- 单个测试最多 30 秒
- spaCy 分析通常 100-500ms
- 留出缓冲时间

**globalSetup maxWaitTime: 60000**
- 等待 spaCy 服务就绪最多 60 秒
- 远程服务器首次启动可能较慢

---

**最后提醒**: 如果看到任何 spaCy 相关错误，请检查：
1. `server/spacy-service.py` 是否存在
2. Python 3 和 spaCy 依赖是否安装
3. 磁盘空间（spaCy 模型约 100MB）
4. 进程 stdio 输出中的错误消息
