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

线上未设置 `NEXT_PUBLIC_WORKBENCH_URL` 时默认使用 `https://www.narrativeos.cn/narrativeos/`。生产 GitHub Actions 工作流会显式将该地址作为 Docker 构建参数传入，并在构建前校验。

`NEXT_PUBLIC_WORKBENCH_URL` 在 `next build` 时写入浏览器代码。修改服务器 `.env` 或重启已有容器不会改变按钮链接，需要重新构建并部署镜像。Docker 构建排除 `.env` 和 `.env.*` 文件；本地构建开发镜像时，需通过 `--build-arg NEXT_PUBLIC_WORKBENCH_URL=http://开发服务器/narrativeos/` 传入地址。

## Non-Prod IP 开发环境

`feature/*` 分支（同时兼容现有的 `feature-*` 命名）使用 `.github/workflows/docker-publish-deploy-dev.yml` 部署到独立的 Non-Prod 主机；`main` 分支使用生产工作流部署到生产环境。其他分支不会自动部署。GitHub 仓库需要创建名为 `development` 的 Environment，并配置：

- Secrets：`ACR_USERNAME`、`ACR_PASSWORD`、`DEPLOY_HOST`、`DEPLOY_USER`、`DEPLOY_SSH_KEY`、`DEPLOY_PATH`
- Variable：`WORKBENCH_URL=http://开发服务器/narrativeos/`（可带端口，例如 `http://服务器IP:3001/narrativeos/`；当前配置为 `http://43.138.207.82/narrativeos/`）

开发流程从 `development` Environment 读取该变量，校验后传入 Docker 构建。地址必须以 `/narrativeos/` 结尾；localhost、回环地址和生产域名会让构建失败，避免部署出错误链接。开发环境仍运行 Next.js 的 production 构建，工作台地址由上述构建参数区分。

生产 Compose 项目名固定为 `linchang-web`，开发项目名固定为 `linchang-web-development`，避免同一主机上 dev 重建 prod 容器。生产官网默认监听 `127.0.0.1:3002`；开发官网默认使用 `3003`，可通过 `development` Environment 的 Variable `WEBSITE_PORT` 修改，工作流禁止使用生产默认端口 `3002`。若生产自定义了端口，开发端口也必须与其分开。已有部署升级时，先重新部署生产以恢复 `linchang-web` 中的生产镜像，再部署开发。

在 Non-Prod 服务器的独立 `DEPLOY_PATH` 中，根据 `deploy/development.env.example` 创建 `.env`。开发官网地址为 `http://服务器IP:3003/`。工作流会导出开发端口，覆盖服务器旧 `.env` 中的 `WEBSITE_PORT`；已有微信回调地址和反向代理配置也需同步到新端口。由于使用 HTTP，开发环境通过 `AUTH_COOKIE_SECURE=false` 允许浏览器保存登录 Cookie；生产环境不要关闭该选项。`TEACHER_ECOSYSTEM_SERVICE_TOKEN` 必须使用独立的长随机值，并与生成工作台开发部署目录中的同名变量完全一致。

## 目录结构

账户菜单、管理员入口、账户请求、会话生命周期、图标、样式和小尺寸 Logo 统一由 `packages/narrativeos-ui` 中的 `@narrativeos/ui` 提供。官网和工作台组件只负责各自的接口及导航地址。修改共享行为时直接修改该包，勿在页面中再复制实现。

工作台通过提交到仓库的 npm 版本包使用同一份实现，因此两个仓库均可独立构建 Docker 镜像。共享包的打包、升级步骤见 [维护说明](packages/narrativeos-ui/README.md)。广场正文、返回导航和加载状态文案统一在 `src/lib/messages/teacher-plaza.ts`，由现有 `getMessages(locale).ui.plaza` 提供；账户文案使用 `getMessages(locale).ui.account`。

运行 `npm run test:shared-ui` 检查账户协议与失败分支。`tests/shared-account-menu.browser.cjs` 使用 Playwright 验证两个运行中的应用，支持 `UI_TEST_PORTAL_URL` 和 `UI_TEST_WORKBENCH_URL`（可带 `/narrativeos/`）；可通过 `PLAYWRIGHT_MODULE` 指定已有 Playwright 模块。浏览器用例拦截 API 请求，不会写入实际账户或留言数据。

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

## 开发部署目标校验

2026-11-02 排查确认：`linchangWeb` 的 GitHub `development` Environment 未设置 SSH secrets，开发工作流继承了仓库级部署凭据，实际主机与 `WORKBENCH_URL` 中的 `43.138.207.82` 不符。因此容器更新成功没有更新用户访问的开发服务器。错误目标上临时添加的调查用 IP 站点已停用，并已通过 Nginx 配置校验和重载；生产域名配置未修改。

开发工作流现于构建及部署前校验 `DEPLOY_HOST` 与 `WORKBENCH_URL` 的 DNS 地址是否一致，不匹配则失败，防止再次误部署。手动运行时设置 `diagnose_only=true` 可仅执行目标校验。

后续部署前须在官网仓库的 `development` Environment 配置正确的 `DEPLOY_HOST`、`DEPLOY_USER`、`DEPLOY_SSH_KEY`、`DEPLOY_PATH`。不要将凭据写入仓库。服务器修正后，再检查既有官网容器及代理端口，复用其实际路由；不能根据另一台服务器的结构推断需要改 Nginx。公开广场 HTML、静态资源和工作台路由均需单独验收。

状态：目标配置错误已确认，调查用代理变更已撤回；目标校验已实现。指定公网开发页面仍为旧版，正确服务器部署待完成。
