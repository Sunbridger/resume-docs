export const PROFILE = {
  // 占位信息：替换这里即可更新站点
  name: "你的名字",
  role: "AI 应用工程师",
  tagline: "把 Agent 与 RAG 从方案落成可用的产品。",
  intro:
    "专注 Agent 工作流编排、检索增强生成与 AI 产品前端。把复杂的业务流程拆解成可执行的节点与工具，再把它交到真实用户手里。",
  skills: ["Agent 编排", "RAG 检索", "LangGraph", "FastAPI", "React", "前端性能"],
  location: "中国 · 远程 / 现场",
};

export interface ProjectHighlight {
  title: string;
  points: string[];
}

export interface ProjectInfo {
  id: string;
  index: string;
  title: string;
  role: string;
  period: string;
  stack: string[];
  summary: string;
  highlights: ProjectHighlight[];
}

export const PROJECTS: Record<"ticket" | "risk", ProjectInfo> = {
  ticket: {
    id: "ticket-agent",
    index: "01",
    title: "工单智能体系统",
    role: "AI 应用开发",
    period: "2025.10 – 2026.06",
    stack: [
      "Python",
      "FastAPI",
      "Pydantic",
      "LangGraph",
      "LangChain",
      "Qdrant",
      "Celery",
      "Redis",
      "React",
    ],
    summary:
      "面向公司内部工单场景，服务研发与技术支持两类角色。以 RAG 检索历史处理经验为核心，打通从问题检索到工单流转与处理的完整业务流程，用 Workflow 为主、LLM 为辅的方式把编排权交给代码。",
    highlights: [
      {
        title: "意图识别与任务路由",
        points: [
          "规则优先 + LLM 结构化分类，划分五类业务意图",
          "正则匹配高频确定性请求，减少不必要的模型调用",
          "Pydantic 校验参数，缺失或低置信度先澄清",
        ],
      },
      {
        title: "Workflow 编排与工具执行",
        points: [
          "代码配置业务流程，节点、条件分支与状态流转由代码控制",
          "多工具依赖链：查询 → 详情 → 判断 → 转交 → 提醒，后序入参来自前序输出",
          "语义判断环节由 LLM 辅助，例如方案可用性与信息完整度",
          "双角色能力：技术支持的检索/创建，研发的查询/转交/完结/复盘",
        ],
      },
      {
        title: "多阶段 RAG 检索",
        points: [
          "Query 改写 → 多路召回 → Rerank → 质量判定 → 答案生成",
          "质量不达标回退改写并重试，最多 2 次",
          "每日增量同步工单数据，清洗后写入 Qdrant 知识库",
        ],
      },
      {
        title: "上下文与异步任务",
        points: [
          "工具原始结果落 Redis，按步骤提取字段注入上下文",
          "复盘等长耗时任务交由 Celery + MQ 异步执行",
          "Agent 只负责任务发起与状态轮询，不阻塞主链路",
        ],
      },
    ],
  },
  risk: {
    id: "risk-platform",
    index: "02",
    title: "智能风险预警平台",
    role: "AI 前端开发",
    period: "2025.03 – 2025.09",
    stack: ["React", "TypeScript", "PDF.js", "markdown-it", "SSE", "自研渲染调度器"],
    summary:
      "面向政府采购领域的 AI 巡检平台，对招标文件、采购需求与投标文件做智能风险识别。负责 AI 分析结果的前端承载与复杂 PDF 交互：大文档按需渲染、流式结果稳定输出、风险与原文的精确联动。",
    highlights: [
      {
        title: "PDF 大文件加载与渲染",
        points: [
          "HTTP Range + PDF.js 分片加载，首屏从约 15s 降至约 2s",
          "scroll + rAF 计算可视区域，只渲染即将进入视口的页面",
          "优先级队列调度 + AbortController 取消，卸载 Canvas 释放资源",
          "快速滚动帧率稳定在 50–60fps",
        ],
      },
      {
        title: "流式巡检结果渲染",
        points: [
          "SSE 接收结果，rAF 合并高频回调，降低重复渲染开销",
          "markdown-it Token 流映射自定义标签为 React 风险组件",
          "流式未闭合语法自动补齐，避免 DOM 结构错乱与布局抖动",
          "200+ tokens/s 下保持流畅，组件响应延迟小于 16ms",
        ],
      },
      {
        title: "风险与原文联动",
        points: [
          "风险项携带页码与区域坐标，点击平滑定位到 PDF 对应页",
          "页面级半透明标注框叠加，保留原文上下文",
          "巡检流式输出与标注同步推进，阅读与定位不打断",
        ],
      },
      {
        title: "为真实场景做取舍",
        points: [
          "仅对可视区域计算与渲染，其余页面保留占位骨架",
          "渲染任务可取消、可重排，主线程始终留给交互",
          "指标可观测：加载/渲染页数、帧率、取消任务数实时可见",
        ],
      },
    ],
  },
};
