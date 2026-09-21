# NarrativeOS · AI 叙事课堂生成平台

官网首页，Next.js 16 + Tailwind CSS v4 实现，古风水墨视觉 + 视频沉浸式 Hero。

## 技术栈

- Next.js 16（App Router / TypeScript / Turbopack）
- Tailwind CSS v4（`@theme` 设计令牌 + 自定义关键帧）
- `next/font/google` 自托管 Noto Serif SC / Noto Sans SC / 马善政毛笔体
- GSAP 3 + ScrollTrigger + `@gsap/react`（钉住滚动、横向画廊、逐字标题、光标与磁吸）
- Lenis 1.3（`lenis/react`）平滑滚动，并与 ScrollTrigger 同步

## 动效清单

- 开场墨幕：双帘幕揭开 + 印章落款，Hero 标题逐字墨迹式入场
- Hero 钉住：向下滚动时视频放大、文案消散，产品坞随后覆盖
- 「课堂灵感」桌面端横向滚动画廊（移动端自动回退为纵向卡片）
- 大标题逐字揭示、滚动进度条、自定义光标、磁吸按钮、鼠标光晕
- 数字计数、打字机对话、叙事模式自动轮播、学科跑马灯
- 完整支持 `prefers-reduced-motion`，动效全部自动降级

## 本地运行

需要 Node.js 20.9+（本机可用 `nvm use 20`）：

```bash
npm install
npm run db:migrate
npm run dev
```

默认访问 `http://localhost:3000`。

登录功能还需要从 `.env.example` 创建 `.env`，配置 MySQL `DATABASE_URL`、随机的 `AUTH_SECRET` 和 SMTP。`nos_session` Cookie 的路径为 `/`，因此同一站点下的官网与 `/narrativeos/` 工作台会自动共享登录态。FastAPI 通过官网 `/api/auth/me` 校验该会话，并使用返回的 `user.id` 隔离任务。

本地联调工作台时，在构建或启动官网前设置：

```bash
NEXT_PUBLIC_WORKBENCH_URL=http://127.0.0.1:3001/ npm run dev
```

线上未设置 `NEXT_PUBLIC_WORKBENCH_URL` 时默认使用 `https://www.narrativeos.cn/narrativeos/`。

## Non-Prod IP 开发环境

`feature/*` 分支（同时兼容现有的 `feature-*` 命名）使用 `.github/workflows/docker-publish-deploy-dev.yml` 部署到独立的 Non-Prod 主机；`main` 分支使用生产工作流部署到生产环境。其他分支不会自动部署。GitHub 仓库需要创建名为 `development` 的 Environment，并配置：

- Secrets：`ACR_USERNAME`、`ACR_PASSWORD`、`DEPLOY_HOST`、`DEPLOY_USER`、`DEPLOY_SSH_KEY`、`DEPLOY_PATH`
- Variable：`WORKBENCH_URL=http://服务器IP:3001/narrativeos/`

在 Non-Prod 服务器的 `DEPLOY_PATH` 中，根据 `deploy/development.env.example` 创建 `.env`。开发官网地址为 `http://服务器IP:3002/`。由于使用 HTTP，开发环境通过 `AUTH_COOKIE_SECURE=false` 允许浏览器保存登录 Cookie；生产环境不要关闭该选项。

## 目录结构

- `src/app` — 根布局、页面与 favicon
- `src/components` — 各区块组件（Hero、产品、体验、能力、灵感、团队、技术、流程等）
- `src/lib/content.ts` — 全站文案与数据，可直接修改
- `src/app/globals.css` — 古风设计令牌、纹理、印章与动效
- `public/hero.mp4` — Hero 背景视频（`public/hero-poster.jpg` 为首帧占位）

## 常用命令

```bash
npm run dev    # 本地开发
npm run build  # 生产构建
npm run lint   # 代码检查
```
