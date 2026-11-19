export type PipelineStatus = "done" | "live" | "pending";

export interface PipelineNodeMeta {
  id: string;
  label: string;
  detail: string;
  status: PipelineStatus;
  /** 3D 坐标，同时用于静态首帧的等比取景 */
  position: [number, number, number];
}

export const PIPELINE_NODES: PipelineNodeMeta[] = [
  {
    id: "intent",
    label: "意图识别",
    detail: "规则优先 + LLM 分类",
    status: "done",
    position: [-2.7, -1.75, 0.5],
  },
  {
    id: "rewrite",
    label: "Query 改写",
    detail: "同义词 + 时间线索",
    status: "done",
    position: [-1.85, -0.45, -0.55],
  },
  {
    id: "recall",
    label: "多路召回",
    detail: "BM25 8 · 向量 8",
    status: "done",
    position: [-0.55, 0.55, 0.6],
  },
  {
    id: "rerank",
    label: "Rerank",
    detail: "融合重排 top 5",
    status: "done",
    position: [0.75, 1.45, -0.3],
  },
  {
    id: "judge",
    label: "质量判定",
    detail: "0.82 · 通过",
    status: "live",
    position: [2.15, 0.75, 0.55],
  },
  {
    id: "answer",
    label: "答案生成",
    detail: "引用 3 条历史工单",
    status: "pending",
    position: [2.85, -0.65, -0.45],
  },
];

export const NODE_COLORS: Record<PipelineStatus, string> = {
  done: "#2e8b6b",
  live: "#b07a26",
  pending: "#d8cbb0",
};

export const PIPELINE_DESCRIPTION =
  "Agent 编排流水线：意图识别、Query 改写、多路召回、Rerank、质量判定、答案生成；质量不达标时回退改写并重试，最多两次。";
