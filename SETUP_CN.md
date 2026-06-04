# AI Game LaunchPad v1.0 中文部署说明

这是 v1.0 Workflow Studio Beta，合并了 v0.7 AI Sandbox、v0.8 Creator Platform 和 v0.9 Beta 的功能。

## 本地运行

```bash
npm install
cp .env.example .env
notepad .env
npx prisma generate
npx prisma db push
npm run seed
npm run build
npm run dev
```

打开：

```txt
http://localhost:3000
```

## 必须配置

```env
DATABASE_URL="你的 Supabase PostgreSQL URL"
OPENAI_API_KEY="你的 OpenAI Key，可留空使用 fallback"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 重要页面

```txt
/studio              工作流创作页面
/dashboard/games/new 传统生成页面
/editor/[slug]       AI 游戏编辑器
/play/[slug]         可试玩游戏页面
/games               游戏列表
/pricing             套餐页面
```

## 数据库同步

v1.0 新增 Workflow / WorkflowRun，所以必须执行：

```bash
npx prisma db push
```

否则线上会报表不存在。
