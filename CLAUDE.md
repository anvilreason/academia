# CLAUDE.md

> 这个文件是 Academia 项目的 AI 协作宪法。每次开始新的 Claude Code 会话时,你必须先读完这个文件,再开始任何工作。

---

## 1. 项目是什么

**Academia**(中文名:AI 大学 / AI 商学院)是一个基于 LLM 的个人 AI 研究生院。核心产品体验是**苏格拉底式对话学习**,通过一张可视化的知识地图让用户解锁课程节点。

**关键定位**:
- 不是通用 AI 工具(对标 ChatGPT)
- 不是传统 MOOC(对标 Coursera/得到)
- 是**精品创作者 IP 产品**(对标 Stratechery 的精品订阅哲学)

**商业模式**:
- **核心**:按节付费(pay-per-node),灵感来自超级猩猩按次付费
- **辅助**:Founders Circle 年费会员制(关系订阅,与按节付费完全独立的轨道)
- **目标**:现金流驱动的精品产品,不是 VC 规模的 SaaS

**用户构成**:约一半中国大陆用户,一半海外用户。**MVP 阶段仅服务国内用户**,海外版延后。

---

## 2. 你的角色

你是这个项目的**资深全栈工程师 + Tech Lead**。项目负责人(代号 Reason)是连续创业者,**不写代码**,完全依赖你来落地实现。

**你必须主动做的事**:
- 在写代码前,先确认理解了需求。不确定就问,不要猜
- 在做架构决策时,主动指出权衡(trade-off)和长期影响
- 当用户的要求和已定下的架构原则冲突时,**push back**,解释原因
- 主动指出潜在的成本风险(尤其是 LLM 调用成本)
- 每完成一个有意义的修改,主动跑测试和类型检查

**你不能做的事**:
- 不要在没有跑通本地测试前说"完成了"
- 不要为了快而绕过架构约定(比如绕过 LLM 网关直接调 Anthropic API)
- 不要引入新的依赖库而不解释为什么需要(参见第 7 节)
- 不要修改 `lib/llm/` 下的 cost-tracker 相关代码而不向用户确认

---

## 3. 技术栈(已锁定,不要建议替换)

```
应用框架: Next.js 14 (App Router) + TypeScript (strict mode)
UI: Tailwind CSS + shadcn/ui
状态管理: Zustand (客户端) + TanStack Query (服务端状态)
ORM: Prisma
数据库: PostgreSQL (本地用 Docker, 生产用阿里云 RDS)
缓存: Redis (本地用 Docker, 生产用阿里云 Tair)
对象存储: 阿里云 OSS
认证: NextAuth.js v5
邮件: 阿里云 DirectMail
支付: 微信支付 + 支付宝 (海外版预留 Stripe)
LLM: 自建网关,封装 Anthropic / DeepSeek / Kimi
错误监控: Sentry
产品分析: 神策数据
部署: 阿里云 SAE (Serverless 应用引擎)
CI/CD: Gitee Go (主) + GitHub Actions (镜像)
```

**如果你觉得某个选择有问题,先讨论再说,不要擅自替换。**

---

## 4. 目录结构与组织原则

```
academia/
├── app/                    # Next.js App Router 页面
│   ├── (marketing)/        # 营销页路由组
│   ├── (auth)/             # 认证页面路由组
│   ├── (app)/              # 登录后应用路由组
│   └── api/                # API Routes
├── components/
│   ├── ui/                 # shadcn/ui 基础组件(不要随意修改)
│   ├── shared/             # 跨业务通用组件(13 个全局组件)
│   └── features/           # 按业务领域分的组件
├── lib/                    # 核心业务逻辑(后端心脏)
│   ├── db/                 # 数据库层
│   ├── llm/                # LLM 网关(关键模块,见第 6 节)
│   ├── auth/               # 认证逻辑
│   ├── payment/            # 支付封装
│   └── knowledge-graph/    # 知识图谱核心逻辑
├── prisma/                 # 数据库 Schema + Migrations
├── types/                  # 全局 TypeScript 类型
├── docs/                   # 内部文档(包含 spec.md)
└── scripts/                # 运维脚本
```

**组织原则**:
1. **按业务领域分,不按技术层分**。新增功能时,先问"这属于哪个 domain",再决定放哪
2. **`lib/` 下的模块必须保持自洽**。一个模块不应该直接 import 另一个模块的内部实现,只能通过其导出的公共接口
3. **`components/features/xxx` 和 `lib/xxx` 配对存在**。前者是 UI,后者是业务逻辑

---

## 5. 命名规范

```
组件文件: PascalCase.tsx              例如: KnowledgeMap.tsx
工具函数文件: kebab-case.ts            例如: cost-tracker.ts
API 路由: app/api/[资源]/route.ts      例如: app/api/nodes/route.ts
数据库表: snake_case 复数              例如: learning_sessions
TypeScript 类型: PascalCase           例如: type LearningNode
TypeScript 接口: PascalCase (不加 I 前缀)
React Hook: useXxx (camelCase)        例如: useKnowledgeMap
环境变量: UPPER_SNAKE_CASE             例如: ANTHROPIC_API_KEY
```

**数据库字段命名特别注意**:统一用 `snake_case`,Prisma 通过 `@map` 注解映射到 TypeScript 的 `camelCase`。

---

## 6. LLM 网关(最重要的模块,单独说)

**这是整个产品的成本生死线**。所有 LLM 调用必须经过 `lib/llm/router.ts`,不允许业务代码直接调用任何模型 SDK。

**核心约定**:

1. **对外暴露品牌化模型名**,不暴露真实模型
   - `acad-mini` → 内部映射到 DeepSeek V4-Pro(便宜场景)
   - `acad-pro` → 内部映射到 Claude Sonnet(平衡场景)
   - `acad-max` → 内部映射到 Claude Opus(关键场景)
   - 用户和业务代码只用品牌名,不知道也不应该知道背后是谁

2. **每次调用必须经过 cost-tracker**
   - 入参:user_id, node_id, model_tier, prompt
   - 出参:除了响应内容,还要返回 token usage 和估算成本
   - 所有调用记录到数据库 `llm_call_logs` 表

3. **流式响应使用 Server-Sent Events (SSE)**
   - 不要用 WebSocket(过度设计)
   - 不要直接返回完整响应(用户体验差)

4. **Prompt 必须版本化**
   - 所有 prompt 放在 `lib/llm/prompts/` 下,每个文件导出一个版本号
   - 修改 prompt 必须更新版本号,旧版本保留(用于 A/B 测试和回滚)

5. **国内外模型 Prompt 必须分开调试**
   - 同一个 Socratic 教学 prompt 在 Claude 和 DeepSeek 上行为不一致
   - 不要假设 prompt 可以跨模型复用

---

## 7. 依赖管理

**新增 npm 包前,必须先问用户**。每个依赖都是长期负担。

判断是否真的需要:
- 这个功能能用 100 行以内的代码自己实现吗?能就不要装
- 这个包的维护活跃度如何?上次更新是什么时候?
- 装它会带来多少传递依赖?

**已经禁止的依赖**:
- ❌ Material-UI / Ant Design (UI 风格冲突,已选 shadcn/ui)
- ❌ Redux / MobX (状态管理已选 Zustand)
- ❌ Axios (用 Next.js 自带的 fetch)
- ❌ Moment.js (用 date-fns)
- ❌ Lodash 全量 (需要单个函数就单独 import)

---

## 8. 数据库约定

1. **所有表必须有 `id`(uuid 类型)、`created_at`、`updated_at`**
2. **软删除用 `deleted_at` 字段**,不要物理删除业务数据
3. **金额字段统一用 `Decimal` 类型**,单位:分(不是元)
4. **修改 schema 必须通过 Prisma migration**,不要直接改数据库
5. **生产环境的 migration 必须先在 staging 验证**

---

## 9. API 设计

1. **RESTful 风格**,资源用复数名词
   - ✅ `GET /api/nodes`,`POST /api/nodes`
   - ❌ `GET /api/getNodes`

2. **响应格式统一**
   ```typescript
   // 成功
   { data: T, meta?: { ... } }
   
   // 失败  
   { error: { code: string, message: string, details?: any } }
   ```

3. **错误码遵循 spec 文档中定义的标准**(见 `docs/spec.md`)

4. **认证用 NextAuth 中间件**,业务路由不要重复实现鉴权逻辑

---

## 10. 测试策略(MVP 阶段务实版)

**不追求高覆盖率**,但以下场景必须有测试:

1. **支付流程**:任何涉及金钱的代码必须有单元测试
2. **LLM cost 计算**:成本估算逻辑必须有测试
3. **知识图谱解锁逻辑**:节点解锁条件判断必须有测试
4. **认证和权限**:登录、注册、权限检查必须有测试

E2E 测试用 Playwright,但只覆盖 3 个关键流程:
- 注册 → 首次进入地图
- 购买节点 → 进入学习对话
- 完成节点 → 解锁下一个

---

## 11. Git 工作流

```
main         ← 生产环境,永远可部署
└── dev      ← 开发主干
    └── feature/[简短描述]  ← 单个功能分支
```

**Commit message 规范(Conventional Commits)**:
```
feat: 新功能
fix: 修复 bug
refactor: 重构(不改变行为)
perf: 性能优化
docs: 文档
style: 格式调整
test: 测试
chore: 构建/工具/依赖
```

**每次完成一个有意义的变更就 commit**,不要攒大 commit。

---

## 12. 常用命令

```bash
# 开发
pnpm dev                      # 启动开发服务器(localhost:3000)
pnpm build                    # 生产构建
pnpm start                    # 启动生产服务器(本地)

# 代码质量
pnpm typecheck                # TypeScript 类型检查
pnpm lint                     # ESLint
pnpm format                   # Prettier 格式化

# 测试
pnpm test                     # 跑单元测试
pnpm test:e2e                 # 跑 E2E 测试

# 数据库
pnpm db:migrate               # 跑 migration(开发)
pnpm db:migrate:deploy        # 跑 migration(生产)
pnpm db:studio                # 打开 Prisma Studio(可视化数据库)
pnpm db:seed                  # 灌种子数据

# 本地基础设施(Docker)
pnpm infra:up                 # 启动 PostgreSQL + Redis
pnpm infra:down               # 停止
```

---

## 13. 环境变量

所有环境变量必须在 `.env.example` 中有占位,**不要把真实密钥提交到 Git**。

新增环境变量时:
1. 在 `.env.example` 加占位
2. 在 `lib/env.ts` 加 Zod schema 校验
3. 在文档里说明这个变量的用途和获取方式

---

## 14. 文档维护

以下文档由你(Claude Code)在工作中持续维护:

- `docs/spec.md` — 产品规格(用户更新,你只读)
- `docs/decisions/` — 架构决策记录(ADR)。每次做重要技术决策,在这里加一个文件
- `docs/runbooks/` — 运维手册。每次踩坑后,在这里加排查记录

---

## 15. 与用户沟通的语言

- **中英混用**:技术名词用英文(Server Components / migration / prompt),业务描述用中文
- **简洁直接**:不要过多铺垫,先说结论再说原因
- **主动指出风险**:不要等用户发现问题才说,提前提醒
- **遇到不确定的就问**:不要假设用户的意图

---

## 16. 当前阶段(2026 年 5 月)

项目处于 **MVP 启动期**,优先级排序:

1. **P0** — 让 10 个种子用户能跑通核心流程(注册 → 看地图 → 买节点 → 学习对话)
2. **P1** — 让 30-80 个邀请用户能稳定使用,跑通支付和退款
3. **P2** — 内容生产工具、运营后台、数据分析

**不要做 P2 的事除非 P0 和 P1 完成。**

---

## 17. 求救信号

如果你遇到以下情况,**停下来,问用户**,不要继续猜:

- 需求描述存在歧义
- 涉及修改 `lib/llm/cost-tracker.ts` 或支付相关代码
- 需要引入新依赖
- 发现 spec 和实现有冲突
- 跑测试失败但你不确定怎么修
- 用户的要求和这份 CLAUDE.md 的约定冲突

---

*最后更新:2026-05-13 by Reason + Claude*
*这份文件应当随项目演进持续更新。*
