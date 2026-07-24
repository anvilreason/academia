# Academia

Academia 是一所“个人 AI 研究生院”：学习者带着真实问题进入，由 AI 导师通过苏格拉底式追问，把经典理论推演成可复用的判断。

- 公开功能预览：https://academia-agent.anvilreason.chatgpt.site
- GitHub Pages 跳转页：https://anvilreason.github.io/academia/
- 架构与上线边界：[docs/architecture.md](docs/architecture.md)

## 已跑通的产品路径

`落地页 → 5 轮免费试听 → 注册认领会话 → 学院地图 → 测试订单 → Porter 课程 → 完成笔记 → 下一节推荐`

测试支付不会产生真实扣款。Cloudflare/D1 是公开功能预览；阿里云 SAE、RDS、Tair、DirectMail 和正式支付仍是生产目标。

## 本地开发

```bash
npm install
npm run db:generate
npx wrangler d1 migrations apply DB --local --persist-to .wrangler/state
npm run dev
```

本地环境变量参考 `.env.example`。不要提交真实密钥。

## 验证

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

启动本地服务后，可以额外运行：

```bash
npm run test:integration
```
