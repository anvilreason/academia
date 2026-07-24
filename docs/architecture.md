# Academia 架构与上线边界

## 当前公开预览

公开链接运行在 Cloudflare Sites，使用 Next.js 16、Vinext、Cloudflare Workers 与 D1。它是功能预览，不是面向中国用户的正式生产环境。页面必须持续提示用户不要填写敏感信息或真实支付资料。

预览环境的目标是验证完整业务路径：

`落地页 → 学院/专业/课程 → AI 试听 → 注册认领会话 → 测试订单 → 节点权限 → 课程对话 → 长期记忆 → 期末考试 → 学分/GPA → 定向重修 → 下一节推荐`

## 业务边界

- 页面、REST 接口、权限和 LLM 网关只依赖 `AcademiaRepository`。
- `D1AcademiaRepository` 是预览实现，Drizzle 管理表结构和迁移。
- `PrismaAcademiaRepository` 是阿里云 RDS/PostgreSQL 的生产替换点；生产资源就绪后按相同接口完成实现。
- Auth.js 使用 JWT 会话。密码在服务端通过 Web Crypto PBKDF2-SHA256 派生，每位用户使用独立盐，并记录算法和迭代次数；原始密码从不保存。Cloudflare 预览使用其运行时支持的 100,000 次迭代，阿里云正式环境迁移至 Argon2id。
- 注册与登录使用按时间窗口计数的 D1 限流，限流标识由 IP 和邮箱经 HMAC 后生成，不保存原始 IP。正式环境迁移至 Tair，并补齐邮箱验证、找回密码、会话撤销和安全通知。
- 所有模型请求只能经过 `lib/llm/router.ts`，业务只引用内部别名 `acad-pro`。Provider adapter 负责把统一消息转换为各模型厂商的流式协议。
- `acad-pro` 可由环境变量映射到 Kimi、OpenAI 或 Anthropic；Kimi 的公开预览默认使用中国区 `kimi-k2.6` 快速模式，K3 适配保留为后续用户主动触发的“深入推演”。日常深入思考由苏格拉底式教学 Prompt 与持久记忆驱动。OpenAI 默认使用 `gpt-5.6-sol`，Anthropic 默认使用 `claude-sonnet-5`。SSE 对前端只暴露 `meta`、`delta`、`progress`、`usage`、`done` 和 `error`。
- 每日 AI 成本按 Asia/Shanghai 日期结算，全局硬上限为 ¥50；请求开始前预留，结束后按累计 usage 结算。
- 课程对话、实践项目和总 Agent 的用户输入会写入统一长期记忆。检索层按相关性、显著性和时间排序，只把与当前问题有关的记忆送入模型；用户可以在 Agent 内查看和遗忘单条记忆。
- 总 Agent 与课程对话使用独立线程，但共享同一用户记忆空间。模型不得虚构记忆，引用过往内容时必须说明来自哪门课或哪个项目。
- 学籍记录包括用户专业、课程任务、考试尝试、已获学分与课程完成消费。考试结果采用百分制并换算为最高 4.0 的学分加权 GPA。
- 星图学籍卡把余额和会员成长值分开保存：储值只增加余额，只有已购买且完成课程的金额会累加到会员等级。

## 测试支付

`PAYMENT_MODE=test` 时可以调用测试确认和测试储值接口。它们会创建真实订单、权限、账户余额与流水记录，但绝不连接支付渠道或产生资金流。

当 `PAYMENT_MODE` 不是 `test` 时，测试确认接口直接不可用。接入微信支付或支付宝前，必须补齐服务端签名、webhook 验签、幂等、退款状态机与风控。

## 正式生产目标

正式环境仍锁定阿里云：

- SAE 运行 Next.js 服务；
- RDS PostgreSQL 使用 Prisma adapter；
- Tair/Redis 负责限流、幂等锁与短期状态；
- DirectMail 负责邮箱验证和找回密码；
- 微信支付与支付宝使用正式商户配置；
- 完成域名、ICP 备案、Sentry/神策监控和 D1 → PostgreSQL 迁移演练后再邀请种子用户。

Cloudflare 预览数据不应被视为正式生产数据。
