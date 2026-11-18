# AI 应用工程师 · 交互式作品集

在线地址：<https://sunbridger.github.io/resume-docs/>

基于简历构建的纯前端单页作品集，把两个项目做成可交互的最小化 Demo：

- **工单智能体系统**：意图识别与澄清、参数校验、Workflow 编排、BM25 + 伪向量多路召回、Rerank、质量判定与重试、工具调用（查询 / 转交 / 完结 / 创建）、Celery 异步复盘。
- **智能风险预警平台**：PDF.js 按需渲染与任务调度、视口计算、渲染取消与资源释放、流式巡检输出、Markdown 中间态修复、自定义风险标签映射、风险与原文页面级联动、实时性能指标 HUD。

> 所有逻辑均在浏览器内运行。LLM 语义判断由规则模拟，界面中以「mock」标注；工单与风险数据均为合成样例。

## 快速开始

```bash
npm install
npm run dev       # 本地开发
npm run build     # 生产构建
npm run preview   # 预览构建产物
```

需要 Node 22+。

## 重新生成招标 PDF

`src/assets/tender.pdf` 为脚本生成的 25 页合成招标文件。修改 `scripts/generate-pdf.mjs` 后执行：

```bash
npm run gen:pdf   # 依赖本机 Google Chrome（可用 CHROME_PATH 指定）
```

## 替换个人信息

站点中的姓名、头衔、简介、技能与项目文案集中在 `src/data/profile.ts`，替换即可。默认使用占位名「你的名字」。

## Demo 覆盖的场景

工单智能体（顶部切换技术支持 / 研发）：

| 场景 | 示例输入 |
| --- | --- |
| 历史经验检索 | 财务系统登录不上，提示账号被锁定怎么办？ |
| 无可用方案 → 结构化表单创建 | 食堂刷卡机充值后余额没到账，怎么处理？ |
| 多工具依赖链长任务 | 帮我推进上周未完成的工单（查询 → 详情 → 判断 → 转交 → 提醒） |
| 参数缺失澄清 → 补齐后执行 | 帮我转交工单 → 把 TK-1042 转交给张工 |
| 工单完结 | 完结 TK-1031，原因是已修复并回归 |
| 异步复盘 | 复盘我上周处理过的工单 |
| 越界拒答 | 帮我写一首关于春天的诗 |

风险预警平台：

- PDF 默认只渲染视口附近的页面（并发 2，离开视口即取消、远离视口卸载 Canvas）。
- 右侧巡检报告以流式 Markdown 输出，未闭合的加粗 / 代码块 / 表格会自动补齐后再渲染。
- 点击任意风险卡片会平滑定位到 PDF 对应页，并叠加页面级区域高亮。
- 右上角「性能指标」可开关 HUD，观察加载 / 渲染页数、FPS、取消任务数与首屏耗时。

## 部署到 GitHub Pages

`vite.config.ts` 的 `base` 已设为 `./`，构建产物可部署到任意子路径。

方式一：手动发布

```bash
npm run build
# 将 dist/ 内容推送到仓库的 gh-pages 分支，并在仓库设置中选择该分支
```

方式二：GitHub Actions（推荐）

在 `.github/workflows/deploy.yml` 中加入：

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

然后在仓库 Settings → Pages 中将 Source 设为 GitHub Actions。

## 目录结构

```
src/
  components/           站点骨架、Hero、Markdown 渲染
  data/profile.ts       个人信息与项目文案（替换入口）
  data/risks.ts         风险标注、巡检报告与坐标
  demo/ticket/          工单智能体：引擎（BM25 / RAG / 意图路由）+ UI
  demo/risk/            PDF 查看器、渲染调度器、流式巡检面板
  assets/tender.pdf     脚本生成的 25 页示例文档
scripts/generate-pdf.mjs  使用 Chrome headless 生成示例 PDF
```
