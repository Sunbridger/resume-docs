export type RiskLevel = "high" | "medium" | "low";

export interface RiskAnnotation {
  id: string;
  page: number;
  level: RiskLevel;
  title: string;
  quote?: string;
  analysis: string;
  suggestion: string;
  /** 页面内的区域坐标，单位为百分比 */
  rect: { top: number; left: number; width: number; height: number };
}

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  high: "高风险",
  medium: "中风险",
  low: "低风险",
};

export const RISKS: RiskAnnotation[] = [
  {
    id: "R-01",
    page: 9,
    level: "medium",
    title: "评分标准缺少客观量化口径",
    quote: "本地化服务能力（6 分）：根据投标人本地服务能力综合评定。",
    analysis:
      "评分项仅描述为“综合评定”，未给出本地机构、人员数量、响应时限等可核验指标，评委自由裁量空间过大，容易引发质疑。",
    suggestion:
      "拆分为客观指标，例如本地服务机构（2 分）、常驻人员数量（2 分）、响应时限承诺（2 分），并附证明材料要求。",
    rect: { top: 28.2, left: 8, width: 84, height: 26.9 },
  },
  {
    id: "R-02",
    page: 10,
    level: "high",
    title: "技术参数指向特定品牌",
    quote:
      "视频接入模块须兼容海康威视 iVMS-8700 平台协议，并支持该平台私有协议接入。",
    analysis:
      "将特定厂商平台与私有协议作为准入条件，可能排除具备同等能力的其他投标人，构成对供应商的差别待遇。",
    suggestion:
      "改为“兼容主流视频平台开放协议，或提供同等能力的接入证明”，并允许以兼容性测试报告替代原厂证明。",
    rect: { top: 24.1, left: 8, width: 84, height: 6.7 },
  },
  {
    id: "R-03",
    page: 7,
    level: "medium",
    title: "业绩门槛与项目规模不匹配",
    quote:
      "近三年同类项目单项合同金额不低于人民币 800 万元，且数量不少于 2 个。",
    analysis:
      "业绩金额接近项目预算（1,280 万元）的 63%，且限定项目类型，可能对中小企业形成不合理限制。",
    suggestion:
      "按预算金额的一定比例设置业绩门槛，或允许以同类项目经验、技术方案佐证替代单一合同金额要求。",
    rect: { top: 22.4, left: 8, width: 84, height: 14.6 },
  },
  {
    id: "R-04",
    page: 13,
    level: "high",
    title: "付款比例失衡、回款周期过长",
    quote:
      "预付款 10%；终验后支付 30%；剩余 60% 分三年平均支付，每年经审计确认后支付。",
    analysis:
      "60% 的尾款分三年且与财政审计挂钩，回款周期明显偏长，可能推高中标报价，或影响供应商现金流与履约质量。",
    suggestion:
      "预付款建议不低于合同价款的 30%，尾款支付周期控制在 2 年以内，并明确逾期付款的违约责任。",
    rect: { top: 24.1, left: 8, width: 84, height: 20.8 },
  },
  {
    id: "R-05",
    page: 15,
    level: "high",
    title: "违约责任明显不对等",
    quote:
      "中标人逾期交付按日千分之五支付违约金；采购人逾期付款按日万分之零点五支付违约金。",
    analysis:
      "双方违约责任相差 10 倍，且采购人可在提前 15 日通知后无责解除合同，权利义务显著失衡。",
    suggestion:
      "对等设置违约金比例，明确双方免责情形；解除合同应区分违约解除与协商解除，并约定已完成工作的结算方式。",
    rect: { top: 9.7, left: 8, width: 84, height: 23.2 },
  },
  {
    id: "R-06",
    page: 18,
    level: "medium",
    title: "接口对接缺少验收标准",
    quote:
      "投标人应提供完整的接口清单、字段说明与联调方案，接口对接涉及第三方配合的由中标人自行协调。",
    analysis:
      "未约定接口响应时间、成功率、数据一致性等验收口径，也未明确第三方配合失败时的责任划分。",
    suggestion:
      "补充接口联调的量化指标与测试方法，并约定因第三方原因导致延期时的处理机制。",
    rect: { top: 9.7, left: 8, width: 84, height: 23.9 },
  },
  {
    id: "R-07",
    page: 3,
    level: "medium",
    title: "采购需求未明确数据安全要求",
    quote:
      "系统需与市级政务服务平台完成对接，实现园区数据的统一采集、治理与呈现。",
    analysis:
      "涉及政务数据汇聚，但采购需求中未明确数据分类分级、共享边界、脱敏要求与安全责任，存在合规风险。",
    suggestion:
      "在需求中补充数据安全条款，明确数据分类分级、最小必要原则、共享审批流程及安全责任划分。",
    rect: { top: 34.6, left: 8, width: 84, height: 13.9 },
  },
  {
    id: "R-08",
    page: 22,
    level: "high",
    title: "验收标准未量化",
    quote:
      "系统应满足招标文件及合同约定的功能与性能要求，运行稳定，用户使用体验良好，采购人满意。",
    analysis:
      "以“稳定”“良好”“满意”等主观描述作为验收依据，缺少可用率、响应时间、缺陷等级等可量化指标，易产生争议。",
    suggestion:
      "引用技术规格中的性能指标作为验收依据，明确缺陷等级、整改时限与复验流程。",
    rect: { top: 9.7, left: 8, width: 84, height: 14.6 },
  },
  {
    id: "R-09",
    page: 11,
    level: "medium",
    title: "商务评分主观分占比偏高",
    quote:
      "本地化服务能力（6 分）与售后服务（5 分）由评标委员会根据投标人材料主观评定。",
    analysis:
      "11 分主观评分缺少评分区间与扣分依据，不同评委之间可能产生较大偏差，影响评分一致性。",
    suggestion:
      "为每项主观分设置明确的评分档次与对应条件，必要时引入统一评分细则表。",
    rect: { top: 13.1, left: 8, width: 84, height: 23.7 },
  },
  {
    id: "R-10",
    page: 19,
    level: "low",
    title: "功能清单存在重复描述",
    quote:
      "第 6 项「访客与通行」：访客预约、二维码通行、通行记录查询，支持访客预约与二维码通行。",
    analysis:
      "同一能力在条目内重复表述，且与第 3 项「巡检计划」的部分描述交叉，可能导致评分理解偏差。",
    suggestion:
      "梳理功能清单，去重并统一术语，确保每个功能点只出现一次且可被唯一验收。",
    rect: { top: 13.1, left: 8, width: 84, height: 27.6 },
  },
  {
    id: "R-11",
    page: 8,
    level: "medium",
    title: "人员资质要求可能超出实际需要",
    quote:
      "项目经理须同时具备 PMP 证书与信息系统项目管理师（高级）证书。",
    analysis:
      "双证要求叠加且不允许更换，可能超出项目实际管理需要，对具备同等经验的团队形成限制。",
    suggestion:
      "改为“具备 PMP 或高级信息系统项目管理师证书之一”，并允许以同等项目管理经验替代。",
    rect: { top: 9.7, left: 8, width: 84, height: 17.0 },
  },
  {
    id: "R-12",
    page: 23,
    level: "high",
    title: "知识产权归属约定不完整",
    quote:
      "本项目定制开发部分的软件著作权归采购人所有；项目产生的数据归采购人所有。",
    analysis:
      "未约定第三方组件、开源软件及通用产品模块的授权范围与后续使用限制，也未明确二次开发与迁移时的权利边界。",
    suggestion:
      "补充第三方组件清单与许可方式，明确采购人对定制成果的二次开发、迁移与再许可权利。",
    rect: { top: 9.7, left: 8, width: 84, height: 20.1 },
  },
];

const SEVERITY_ORDER: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2 };

export function riskStats() {
  return {
    total: RISKS.length,
    high: RISKS.filter((risk) => risk.level === "high").length,
    medium: RISKS.filter((risk) => risk.level === "medium").length,
    low: RISKS.filter((risk) => risk.level === "low").length,
  };
}

/** 生成巡检报告的 Markdown 流，风险项使用 <risk> 自定义标签。 */
export function buildInspectionReport(): string {
  const stats = riskStats();
  const ordered = [...RISKS].sort(
    (a, b) => SEVERITY_ORDER[a.level] - SEVERITY_ORDER[b.level] || a.page - b.page,
  );

  const blocks = ordered.map((risk) => {
    const level = RISK_LEVEL_LABEL[risk.level];
    return [
      `<risk id="${risk.id}" level="${risk.level}" page="${risk.page}" title="${risk.title}" label="${level}">`,
      risk.quote ? `**原文摘录**：“${risk.quote}”` : "",
      "",
      `**风险分析**：${risk.analysis}`,
      "",
      `**修改建议**：${risk.suggestion}`,
      `</risk>`,
    ]
      .filter(Boolean)
      .join("\n");
  });

  return [
    "## 巡检结论",
    "",
    `文档共 25 页，识别出 **${stats.total}** 项风险：高风险 **${stats.high}** 项、中风险 **${stats.medium}** 项、低风险 **${stats.low}** 项。`,
    "",
    "建议优先复核**技术参数倾向性、付款与违约条款、验收标准、知识产权归属**四类问题。点击下方任意风险可定位到原文页面。",
    "",
    "---",
    "",
    "### 风险明细",
    "",
    ...blocks,
    "",
    "### 处理建议",
    "",
    "以上风险已按严重程度排序。发标前建议由法务与业务部门联合复核，并将修改结果回写至采购文件。",
  ].join("\n");
}
