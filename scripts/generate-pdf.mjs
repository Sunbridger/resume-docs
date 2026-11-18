/**
 * 生成 25 页中文招标文件（合成数据，仅用于 Demo）。
 * 依赖本机 Google Chrome 的 headless 打印能力，生成后写入 src/assets/tender.pdf。
 * 用法：npm run gen:pdf
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument } from "pdf-lib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "src", "assets");
const outPdf = path.join(outDir, "tender.pdf");
const tmpHtml = path.join(__dirname, ".tender-print.html");

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error("未找到 Chrome，可通过 CHROME_PATH 指定可执行路径。");
  process.exit(1);
}

const head = (chapter) =>
  `<div class="run-head"><span>智慧园区信息化系统采购项目 · 招标文件</span><span>${chapter}</span></div>`;

const foot = (n) =>
  `<div class="page-foot"><span>采购编号 ZC-2026-0118</span><span>第 ${n} 页 / 共 25 页</span></div>`;

const pages = [];

/* 1 封面 */
pages.push(`
<div class="cover">
  <div class="cover__org">某市产业园区管理委员会</div>
  <h1 class="cover__title">智慧园区信息化系统<br/>采购项目</h1>
  <div class="cover__sub">招 标 文 件</div>
  <div class="cover__meta">
    采购编号：ZC-2026-0118<br/>
    采购方式：公开招标<br/>
    采购预算：人民币 1,280 万元<br/>
    招标代理：某工程咨询有限公司<br/>
    二〇二六年一月
  </div>
  <div class="cover__seal">正本</div>
</div>
${foot(1)}`);

/* 2 目录 */
pages.push(`
${head("目录")}
<h2 class="doc-h1">目 录</h2>
<ul class="toc">
  <li><span>第一章　招标公告</span><span>3</span></li>
  <li><span>第二章　投标人须知</span><span>4</span></li>
  <li><span>第三章　采购需求</span><span>6</span></li>
  <li><span>第四章　评标办法</span><span>9</span></li>
  <li><span>第五章　合同主要条款</span><span>13</span></li>
  <li><span>第六章　技术规格要求</span><span>17</span></li>
  <li><span>第七章　项目实施与验收</span><span>21</span></li>
  <li><span>第八章　投标文件格式</span><span>24</span></li>
</ul>
<p class="doc-note">本招标文件共 25 页，投标人应完整阅读全部内容。文件中的“★”条款为实质性要求，不满足将导致投标无效。</p>
${foot(2)}`);

/* 3 招标公告 */
pages.push(`
${head("第一章 招标公告")}
<h2 class="doc-h1">第一章　招标公告</h2>
<h3 class="doc-h2">一、项目概况</h3>
<p class="doc-p">项目名称：智慧园区信息化系统采购项目；采购编号：ZC-2026-0118；采购方式：公开招标；资金来源：财政资金，已落实。</p>
<table class="doc-table">
  <tr><th style="width:32%">采购内容</th><td>园区综合管理平台、物联网接入平台、数据中台及配套硬件采购与实施服务</td></tr>
  <tr><th>建设周期</th><td>合同签订后 180 个日历日内完成交付与验收</td></tr>
  <tr><th>质保期</th><td>终验合格之日起 3 年</td></tr>
</table>
<div class="risk-anchor" data-risk="R-07">
<h3 class="doc-h2">二、采购需求概述</h3>
<p class="doc-p">本项目拟建设覆盖园区运营管理、企业服务、能耗监测与安全防控的一体化信息系统，实现园区数据的统一采集、治理与呈现，并为园区管理方与入驻企业提供统一的线上服务入口。系统需与市级政务服务平台完成对接。</p>
</div>
<h3 class="doc-h2">三、投标人资格要求</h3>
<p class="doc-p">投标人须满足《中华人民共和国政府采购法》第二十二条规定的条件，并具备本项目所需的专业技术能力与项目实施经验，具体以第三章资格要求为准。</p>
<h3 class="doc-h2">四、时间安排</h3>
<table class="doc-table">
  <tr><th style="width:32%">事项</th><th>时间</th></tr>
  <tr><td>获取招标文件</td><td>2026 年 1 月 20 日至 1 月 27 日</td></tr>
  <tr><td>投标截止与开标</td><td>2026 年 2 月 10 日 09:30</td></tr>
</table>
${foot(3)}`);

/* 4 投标人须知 1 */
pages.push(`
${head("第二章 投标人须知")}
<h2 class="doc-h1">第二章　投标人须知</h2>
<h3 class="doc-h2">一、适用范围</h3>
<p class="doc-p">本须知适用于本次招标文件的编制、投标、评标、定标及合同签订等全部环节。投标人提交投标文件即视为接受本文件全部条款。</p>
<h3 class="doc-h2">二、定义</h3>
<p class="doc-p">“采购人”指某市产业园区管理委员会；“招标代理机构”指某工程咨询有限公司；“投标人”指响应本次招标并提交投标文件的法人或其他组织。</p>
<h3 class="doc-h2">三、投标费用</h3>
<p class="doc-p">投标人应自行承担其参加本次招标活动所涉及的一切费用。无论投标结果如何，采购人与招标代理机构均不承担上述费用。</p>
<h3 class="doc-h2">四、投标文件的构成</h3>
<p class="doc-p">投标文件由资格证明文件、商务文件、技术文件三部分组成，应按照第八章规定的格式编制，并加盖投标人公章及法定代表人签章。</p>
<p class="doc-p">投标文件正本一份、副本四份，电子文件一份（U 盘，PDF 格式）。正本与副本不一致时，以正本为准。</p>
${foot(4)}`);

/* 5 投标人须知 2 */
pages.push(`
${head("第二章 投标人须知")}
<h3 class="doc-h2">五、投标报价</h3>
<p class="doc-p">投标报价为完成本项目全部内容的总价，包含软件、硬件、实施、培训、质保期内运维及税费等一切费用。投标人不得以任何理由追加费用。</p>
<p class="doc-p">投标报价不得超过采购预算，否则其投标将被否决。报价单位为人民币元，保留至小数点后两位。</p>
<h3 class="doc-h2">六、投标有效期</h3>
<p class="doc-p">投标有效期为自投标截止之日起 90 个日历日。在投标有效期内，投标人不得撤销或修改其投标文件。</p>
<h3 class="doc-h2">七、投标文件的递交</h3>
<p class="doc-p">投标文件应在投标截止时间前密封递交至开标地点。逾期送达或未按要求密封的投标文件，采购人将不予接收。</p>
<h3 class="doc-h2">八、开标与评标</h3>
<p class="doc-p">开标由招标代理机构主持，邀请所有投标人代表参加。评标委员会由采购人代表与评审专家共五人组成，其中技术、经济专家不少于三分之二。</p>
<h3 class="doc-h2">九、质疑与投诉</h3>
<p class="doc-p">投标人对招标文件、采购过程及中标结果有异议的，可在法定期限内以书面形式提出质疑。采购人应在收到质疑后七个工作日内作出答复。</p>
${foot(5)}`);

/* 6 第三章 采购需求 */
pages.push(`
${head("第三章 采购需求")}
<h2 class="doc-h1">第三章　采购需求</h2>
<h3 class="doc-h2">一、项目背景</h3>
<p class="doc-p">园区现有信息系统由多个厂商分期建设，数据分散、标准不一，运营管理仍依赖人工统计与线下流程。为提升园区数字化治理水平，拟建设统一的智慧园区信息化系统。</p>
<h3 class="doc-h2">二、建设目标</h3>
<p class="doc-p">构建“一平台、一中心、多应用”的总体架构：建设统一的园区管理平台，汇聚运营数据形成数据中台，面向管理方与入驻企业提供多类业务应用。</p>
<ul class="doc-list">
  <li>实现园区核心业务线上化率不低于 90%；</li>
  <li>实现主要设备运行数据分钟级采集与呈现；</li>
  <li>打通与市级政务服务平台的数据交换通道。</li>
</ul>
<h3 class="doc-h2">三、总体要求</h3>
<p class="doc-p">系统应采用微服务架构，支持容器化部署与横向扩展；数据库、中间件等基础软件须使用采购人认可的国产化产品。投标人应提供完整的部署方案与运维手册。</p>
<p class="doc-p">系统需支持不低于 5000 名用户的并发访问，核心服务年可用率不低于 99.9%。</p>
${foot(6)}`);

/* 7 资格要求 1 */
pages.push(`
${head("第三章 采购需求 · 资格要求")}
<h3 class="doc-h2">四、投标人资格要求</h3>
<p class="doc-p">（一）符合《中华人民共和国政府采购法》第二十二条规定的条件；</p>
<p class="doc-p">（二）具有独立法人资格，持有有效的营业执照；</p>
<p class="doc-p">（三）具有履行合同所必需的设备和专业技术能力。</p>
<div class="risk-anchor" data-risk="R-03">
<h3 class="doc-h2">（四）业绩要求</h3>
<p class="doc-p">投标人须提供近三年（2023 年 1 月 1 日至今）已完成验收的同类项目业绩证明，<strong>单项合同金额不低于人民币 800 万元</strong>，且数量不少于 2 个。业绩证明须包含合同关键页与验收报告复印件。</p>
<p class="doc-p">上述业绩须为智慧园区、产业园区或同类区域信息化项目，其他类型项目不予认可。</p>
</div>
<h3 class="doc-h2">（五）财务要求</h3>
<p class="doc-p">投标人应提供近一年度经审计的财务报告，资产负债率不高于 70%，且近三年无连续亏损。</p>
<h3 class="doc-h2">（六）其他要求</h3>
<p class="doc-p">本项目不接受联合体投标，不允许转包与分包。单位负责人为同一人或者存在直接控股、管理关系的不同投标人，不得同时参加本项目投标。</p>
${foot(7)}`);

/* 8 资格要求 2 */
pages.push(`
${head("第三章 采购需求 · 资格要求")}
<div class="risk-anchor" data-risk="R-11">
<h3 class="doc-h2">五、项目团队要求</h3>
<p class="doc-p">拟投入本项目的项目经理须同时具备 PMP 证书与信息系统项目管理师（高级）证书，且具有三年以上同类项目管理经验；技术负责人须具备系统架构设计师证书。</p>
<p class="doc-p">项目实施期间，项目经理与技术负责人不得更换；确需更换的，须经采购人书面同意，且替换人员资质不得低于原人员。</p>
</div>
<h3 class="doc-h2">六、信誉要求</h3>
<p class="doc-p">投标人未被列入“信用中国”网站失信被执行人、重大税收违法案件当事人名单，未被列入政府采购严重违法失信行为记录名单。</p>
<h3 class="doc-h2">七、资格证明材料</h3>
<ul class="doc-list">
  <li>营业执照副本复印件；</li>
  <li>相关资质证书复印件；</li>
  <li>近一年度审计报告；</li>
  <li>同类项目业绩证明；</li>
  <li>拟投入人员证书及社保证明。</li>
</ul>
<p class="doc-note">以上材料均须加盖投标人公章，原件备查。</p>
${foot(8)}`);

/* 9 评标办法 1 */
pages.push(`
${head("第四章 评标办法")}
<h2 class="doc-h1">第四章　评标办法</h2>
<h3 class="doc-h2">一、评标方法</h3>
<p class="doc-p">本项目采用综合评分法，满分 100 分，其中价格分 30 分、技术分 45 分、商务分 25 分。评标委员会按得分由高到低推荐中标候选人。</p>
<h3 class="doc-h2">二、评分构成</h3>
<div class="risk-anchor" data-risk="R-01">
<table class="doc-table">
  <tr><th style="width:34%">评分项</th><th style="width:16%">分值</th><th>评分说明</th></tr>
  <tr><td>投标报价</td><td>30</td><td>低价优先法计算，详见本章第五节</td></tr>
  <tr><td>技术参数响应</td><td>20</td><td>根据技术规格偏离情况评分</td></tr>
  <tr><td>技术方案</td><td>25</td><td>架构、安全、实施与运维方案</td></tr>
  <tr><td>企业业绩</td><td>8</td><td>同类项目数量与金额</td></tr>
  <tr><td>项目团队</td><td>6</td><td>人员资质与经验</td></tr>
  <tr><td>本地化服务能力</td><td>6</td><td>根据投标人本地服务能力综合评定</td></tr>
  <tr><td>售后服务承诺</td><td>5</td><td>响应时效与服务保障</td></tr>
</table>
</div>
<h3 class="doc-h2">三、评分说明</h3>
<p class="doc-p">评标委员会成员独立评分。各评委评分汇总后取算术平均值，保留两位小数。评分中出现畸高畸低情形的，评标委员会应集体讨论并说明理由。</p>
${foot(9)}`);

/* 10 技术评分 */
pages.push(`
${head("第四章 评标办法")}
<h3 class="doc-h2">四、技术评分细则</h3>
<p class="doc-p">（一）技术参数响应（20 分）：根据投标产品对第六章技术规格的响应情况进行评分，全部满足得 20 分，每出现一项负偏离扣 2 分，扣完为止；★条款出现负偏离的，投标无效。</p>
<p class="doc-p">（二）平台架构（10 分）：考察微服务划分、高可用设计、容量规划与扩展能力，架构合理、论证充分得 8–10 分。</p>
<div class="risk-anchor" data-risk="R-02">
<p class="doc-p">（三）视频接入要求：<strong>视频接入模块须兼容海康威视 iVMS-8700 平台协议，并支持该平台私有协议接入</strong>。投标人须提供由原厂出具的兼容性证明，未提供者本项不得分。</p>
</div>
<p class="doc-p">（四）数据处理（8 分）：考察数据采集、清洗、治理与共享能力，方案完整可行得 6–8 分。</p>
<p class="doc-p">（五）安全设计（7 分）：考察等保三级合规设计、数据加密与访问控制，措施完备得 5–7 分。</p>
<h3 class="doc-h2">五、评分原则</h3>
<p class="doc-p">技术评分以投标文件载明的内容为准，投标人自行提供的演示、口头承诺等不作为评分依据。评标委员会有权要求投标人对含糊表述进行澄清，但不得改变投标文件的实质性内容。</p>
${foot(10)}`);

/* 11 商务评分 */
pages.push(`
${head("第四章 评标办法")}
<h3 class="doc-h2">六、商务评分细则</h3>
<div class="risk-anchor" data-risk="R-09">
<table class="doc-table">
  <tr><th style="width:30%">评分项</th><th style="width:14%">分值</th><th>评分标准</th></tr>
  <tr><td>企业业绩</td><td>8</td><td>每提供 1 个符合条件的业绩得 2 分，最高 8 分</td></tr>
  <tr><td>项目团队</td><td>6</td><td>人员数量、资质与项目经验综合评分</td></tr>
  <tr><td>本地化服务能力</td><td>6</td><td>评委根据投标人本地服务机构、人员配置及响应能力综合评定</td></tr>
  <tr><td>售后服务</td><td>5</td><td>服务承诺、响应时效与备件保障综合评分</td></tr>
</table>
<p class="doc-p">商务评分中“本地化服务能力”“售后服务”由评标委员会根据投标人提供的材料主观评定，各评委可结合自身判断在分值区间内自由裁量。</p>
</div>
<p class="doc-p">投标人应提供本地服务机构证明材料，包括但不限于营业执照分支、办公场所租赁合同及本地服务人员名单。</p>
<h3 class="doc-h2">七、评分汇总</h3>
<p class="doc-p">商务与技术的合计得分低于 42 分的投标人，不得推荐为中标候选人。得分相同的，按投标报价由低到高排序；仍相同的，由评标委员会投票确定。</p>
${foot(11)}`);

/* 12 价格评分 */
pages.push(`
${head("第四章 评标办法")}
<h3 class="doc-h2">八、价格评分办法</h3>
<p class="doc-p">采用低价优先法计算：满足招标文件要求且投标价格最低的投标报价为评标基准价，其价格分为满分 30 分。其他投标人的价格分按下式计算：</p>
<p class="doc-formula">投标报价得分 =（评标基准价 ÷ 投标报价）× 30</p>
<p class="doc-p">计算结果保留两位小数。投标报价明显低于成本价且不能合理说明的，评标委员会有权否决其投标。</p>
<h3 class="doc-h2">九、评标程序</h3>
<ul class="doc-list">
  <li>资格性与符合性审查；</li>
  <li>技术文件评审；</li>
  <li>商务文件评审；</li>
  <li>价格评审与汇总排序；</li>
  <li>出具评标报告并推荐中标候选人。</li>
</ul>
<h3 class="doc-h2">十、保密要求</h3>
<p class="doc-p">评标委员会成员及工作人员不得泄露评审情况、投标文件内容及评审过程中的任何信息。评审结束后，投标文件不予退还。</p>
${foot(12)}`);

/* 13 合同支付 */
pages.push(`
${head("第五章 合同主要条款")}
<h2 class="doc-h1">第五章　合同主要条款</h2>
<h3 class="doc-h2">一、合同价款</h3>
<p class="doc-p">合同价款为中标价，包含完成本项目全部内容所需的一切费用。合同履行期间不因市场材料价格、汇率等变化而调整。</p>
<div class="risk-anchor" data-risk="R-04">
<h3 class="doc-h2">二、付款方式</h3>
<p class="doc-p">（一）合同签订后 15 个工作日内，采购人支付合同价款的 <strong>10%</strong> 作为预付款；</p>
<p class="doc-p">（二）项目终验合格后，支付合同价款的 <strong>30%</strong>；</p>
<p class="doc-p">（三）剩余 <strong>60%</strong> 价款自终验合格之日起，分三年平均支付，每年经审计确认后支付 20%。</p>
<p class="doc-p">投标人应在每次付款前提供等额有效发票。因财政资金拨付进度导致的付款延迟，采购人不承担违约责任。</p>
</div>
<h3 class="doc-h2">三、质量保证</h3>
<p class="doc-p">质量保证期为终验合格之日起 3 年。质保期内因产品质量或实施问题导致的故障，中标人应免费修复；造成损失的，应承担相应赔偿责任。</p>
${foot(13)}`);

/* 14 交付与验收条款 */
pages.push(`
${head("第五章 合同主要条款")}
<h3 class="doc-h2">四、交付</h3>
<p class="doc-p">中标人应在合同签订后 7 个工作日内提交详细实施方案与进度计划，经采购人确认后实施。交付地点为采购人指定地点。</p>
<h3 class="doc-h2">五、验收程序</h3>
<p class="doc-p">（一）初验：中标人完成全部部署后，向采购人提交初验申请，采购人在 10 个工作日内组织初验；</p>
<p class="doc-p">（二）试运行：初验合格后进入不少于 30 个日历日的试运行期，试运行期间系统应保持稳定运行；</p>
<p class="doc-p">（三）终验：试运行结束后，采购人组织终验，终验合格后签署验收报告。</p>
<h3 class="doc-h2">六、培训</h3>
<p class="doc-p">中标人应提供不少于 40 人次的现场培训，覆盖系统管理员、业务操作人员与运维人员，并提供培训教材与操作手册。</p>
<h3 class="doc-h2">七、售后服务</h3>
<p class="doc-p">质保期内提供 7×24 小时技术支持，一般故障 4 小时内响应、24 小时内解决；重大故障 1 小时内响应、8 小时内恢复。</p>
${foot(14)}`);

/* 15 违约责任 */
pages.push(`
${head("第五章 合同主要条款")}
<div class="risk-anchor" data-risk="R-05">
<h3 class="doc-h2">八、违约责任</h3>
<p class="doc-p">（一）中标人逾期交付的，每逾期一日按合同总价款的 <strong>千分之五</strong>向采购人支付违约金；逾期超过 30 日的，采购人有权解除合同并要求赔偿损失。</p>
<p class="doc-p">（二）中标人交付成果不符合约定的，应在采购人指定期限内无偿整改；逾期未整改的，采购人有权委托第三方整改，费用由中标人承担。</p>
<p class="doc-p">（三）采购人逾期付款的，每逾期一日按应付未付款项的 <strong>万分之零点五</strong>向中标人支付违约金。</p>
<p class="doc-p">（四）因中标人原因造成采购人被第三方追责的，中标人应承担全部赔偿责任。</p>
</div>
<h3 class="doc-h2">九、合同解除</h3>
<p class="doc-p">除法定解除情形外，采购人有权在提前 15 日书面通知后解除合同，中标人应配合完成工作交接，已支付款项不予退还。</p>
<h3 class="doc-h2">十、争议解决</h3>
<p class="doc-p">合同履行中发生争议的，双方应协商解决；协商不成的，提交采购人所在地人民法院诉讼解决。</p>
${foot(15)}`);

/* 16 保密 */
pages.push(`
${head("第五章 合同主要条款")}
<h3 class="doc-h2">十一、保密条款</h3>
<p class="doc-p">中标人及其人员应对项目实施过程中知悉的采购人业务数据、技术资料及其他未公开信息承担保密义务，保密期限自合同签订之日起至相关信息公开之日止，且不少于五年。</p>
<p class="doc-p">未经采购人书面同意，中标人不得将上述信息用于本项目以外的任何目的，不得向任何第三方披露。</p>
<h3 class="doc-h2">十二、人员管理</h3>
<p class="doc-p">中标人派驻现场的人员应遵守采购人的管理制度，采购人有权要求更换不称职的项目人员，中标人应在 10 个工作日内完成更换。</p>
<h3 class="doc-h2">十三、不可抗力</h3>
<p class="doc-p">因不可抗力不能履行合同的，根据不可抗力的影响部分或全部免除责任。受影响一方应在事件发生后 5 日内书面通知对方，并提供有效证明。</p>
<h3 class="doc-h2">十四、合同生效</h3>
<p class="doc-p">合同经双方法定代表人或授权代表签字并加盖公章后生效。合同一式陆份，采购人执肆份，中标人执贰份，具有同等法律效力。</p>
${foot(16)}`);

/* 17 技术规格 */
pages.push(`
${head("第六章 技术规格要求")}
<h2 class="doc-h1">第六章　技术规格要求</h2>
<h3 class="doc-h2">一、总体架构要求</h3>
<p class="doc-p">系统应采用分层架构，至少包含接入层、应用层、服务层与数据层，各层之间通过标准接口通信，支持独立部署与升级。</p>
<p class="doc-p">系统应支持容器化部署，具备服务注册发现、配置管理、链路追踪与日志聚合能力。关键服务应支持多副本部署与自动故障转移。</p>
<h3 class="doc-h2">二、性能指标</h3>
<table class="doc-table">
  <tr><th style="width:44%">指标</th><th>要求</th></tr>
  <tr><td>并发用户数</td><td>≥ 5000</td></tr>
  <tr><td>核心页面响应时间</td><td>≤ 2 秒（95 分位）</td></tr>
  <tr><td>数据采集频率</td><td>主要设备 ≤ 1 分钟</td></tr>
  <tr><td>系统可用率</td><td>≥ 99.9%</td></tr>
  <tr><td>数据备份</td><td>每日全量、每小时增量</td></tr>
</table>
<h3 class="doc-h2">三、安全要求</h3>
<p class="doc-p">系统须满足网络安全等级保护三级要求，具备身份认证、权限控制、操作审计与数据加密能力。★系统须通过第三方安全测评并提供测评报告。</p>
${foot(17)}`);

/* 18 接口要求 */
pages.push(`
${head("第六章 技术规格要求")}
<div class="risk-anchor" data-risk="R-06">
<h3 class="doc-h2">四、接口要求</h3>
<p class="doc-p">（一）★系统须与市级统一身份认证平台对接，支持 OAuth 2.0 协议与单点登录；</p>
<p class="doc-p">（二）系统须与园区数据中台对接，按约定格式推送运营数据；</p>
<p class="doc-p">（三）系统须与现有视频平台、门禁系统、能耗采集系统对接，提供统一设备接入接口；</p>
<p class="doc-p">（四）系统应提供开放 API 网关，支持接口鉴权、限流与调用审计。</p>
<p class="doc-p">投标人应提供完整的接口清单、字段说明与联调方案。接口对接涉及第三方厂商配合的，由中标人自行协调，相关费用包含在投标报价中。</p>
</div>
<h3 class="doc-h2">五、数据要求</h3>
<p class="doc-p">系统应建立统一的数据标准与主数据管理机制，支持数据质量管理、血缘追踪与共享交换。历史数据迁移范围与方式由双方在实施阶段另行确认。</p>
<h3 class="doc-h2">六、兼容性要求</h3>
<p class="doc-p">系统应兼容主流浏览器及移动端访问，支持国产操作系统与国产数据库环境运行。</p>
${foot(18)}`);

/* 19 功能清单 */
pages.push(`
${head("第六章 技术规格要求")}
<h3 class="doc-h2">七、软件功能清单</h3>
<div class="risk-anchor" data-risk="R-10">
<table class="doc-table doc-table--dense">
  <tr><th style="width:7%">序号</th><th style="width:26%">功能模块</th><th>主要内容</th></tr>
  <tr><td>1</td><td>统一门户</td><td>工作台、待办中心、消息通知、统一登录</td></tr>
  <tr><td>2</td><td>园区运营管理</td><td>企业服务、合同管理、收费管理、统计分析</td></tr>
  <tr><td>3</td><td>资产与设备管理</td><td>资产台账、巡检计划、报修工单、维保记录</td></tr>
  <tr><td>4</td><td>能耗监测</td><td>水电气采集、用能分析、告警管理，采集频率 ≤ 1 分钟</td></tr>
  <tr><td>5</td><td>安全防控</td><td>视频巡查、门禁管理、访客预约、事件联动</td></tr>
  <tr><td>6</td><td>访客与通行</td><td>访客预约、二维码通行、通行记录查询，支持访客预约与二维码通行</td></tr>
  <tr><td>7</td><td>数据报表</td><td>运营看板、自定义报表、数据导出</td></tr>
  <tr><td>8</td><td>移动端</td><td>移动审批、巡检上报、消息推送</td></tr>
</table>
</div>
<p class="doc-p">以上功能为最低要求，投标人可根据自身产品能力提供更完整的功能方案，但不得低于清单所列内容。</p>
${foot(19)}`);

/* 20 硬件参数 */
pages.push(`
${head("第六章 技术规格要求")}
<h3 class="doc-h2">八、硬件与部署要求</h3>
<table class="doc-table doc-table--dense">
  <tr><th style="width:26%">设备</th><th>主要参数</th><th style="width:16%">数量</th></tr>
  <tr><td>应用服务器</td><td>2U 机架式，≥ 32 核 CPU，≥ 256GB 内存，双电源</td><td>4 台</td></tr>
  <tr><td>数据库服务器</td><td>2U 机架式，≥ 32 核 CPU，≥ 512GB 内存，NVMe 存储</td><td>2 台</td></tr>
  <tr><td>存储阵列</td><td>可用容量 ≥ 200TB，支持 RAID 6 与双活</td><td>1 套</td></tr>
  <tr><td>边缘网关</td><td>≥ 4 核 CPU，≥ 8GB 内存，支持 4G/5G 回传</td><td>20 台</td></tr>
  <tr><td>备份一体机</td><td>可用容量 ≥ 100TB，支持定时与异地备份</td><td>1 台</td></tr>
</table>
<h3 class="doc-h2">九、部署环境</h3>
<p class="doc-p">系统部署于园区自建机房，网络环境为政务外网。投标人应提供完整的网络拓扑设计、安全域划分与部署实施计划。</p>
<p class="doc-p">硬件设备须提供三年原厂质保，投标时提供原厂授权函与售后服务承诺函。</p>
${foot(20)}`);

/* 21 实施计划 */
pages.push(`
${head("第七章 项目实施与验收")}
<h2 class="doc-h1">第七章　项目实施与验收</h2>
<h3 class="doc-h2">一、实施原则</h3>
<p class="doc-p">项目应按照“统一规划、分步实施、持续优化”的原则推进，中标人须建立项目管理机制，定期向采购人汇报进展。</p>
<h3 class="doc-h2">二、里程碑计划</h3>
<table class="doc-table">
  <tr><th style="width:20%">阶段</th><th style="width:22%">时间节点</th><th>主要交付物</th></tr>
  <tr><td>需求与设计</td><td>合同签订后 30 日内</td><td>需求规格说明书、概要设计、实施方案</td></tr>
  <tr><td>开发与集成</td><td>合同签订后 90 日内</td><td>系统开发完成、接口联调报告</td></tr>
  <tr><td>部署与试运行</td><td>合同签订后 150 日内</td><td>部署文档、试运行报告、培训记录</td></tr>
  <tr><td>终验</td><td>合同签订后 180 日内</td><td>测试报告、验收报告、全套文档</td></tr>
</table>
<h3 class="doc-h2">三、项目管理要求</h3>
<p class="doc-p">中标人应每周提交周报，每月召开项目例会；重大风险应在 24 小时内书面报告采购人。项目文档应使用中文编写，并随项目进度同步提交。</p>
${foot(21)}`);

/* 22 验收标准 */
pages.push(`
${head("第七章 项目实施与验收")}
<div class="risk-anchor" data-risk="R-08">
<h3 class="doc-h2">四、验收标准</h3>
<p class="doc-p">系统应满足招标文件及合同约定的功能与性能要求，运行稳定，用户使用体验良好，采购人满意。验收时中标人应提交完整的验收资料。</p>
<p class="doc-p">验收内容包括功能验收、性能验收、安全验收与文档验收，各项验收均应通过评审。</p>
</div>
<h3 class="doc-h2">五、验收资料</h3>
<ul class="doc-list">
  <li>需求规格说明书与设计文档；</li>
  <li>测试方案、测试用例与测试报告；</li>
  <li>部署文档、运维手册与应急预案；</li>
  <li>培训记录与用户手册；</li>
  <li>第三方安全测评报告。</li>
</ul>
<h3 class="doc-h2">六、验收组织</h3>
<p class="doc-p">验收由采购人组织，邀请相关专家参加。验收未通过的，中标人应在 20 个工作日内完成整改并重新申请验收。整改期间不计入质保期。</p>
${foot(22)}`);

/* 23 知识产权 */
pages.push(`
${head("第七章 项目实施与验收")}
<div class="risk-anchor" data-risk="R-12">
<h3 class="doc-h2">七、知识产权</h3>
<p class="doc-p">本项目定制开发部分的软件著作权归采购人所有，中标人应在终验前完成著作权登记并交付全部源代码、设计文档与部署脚本。</p>
<p class="doc-p">中标人用于本项目的第三方软件与组件，应提供合法授权证明，并在投标文件中列明名称、版本、授权方式及费用。</p>
<p class="doc-p">项目产生的数据归采购人所有。<strong>数据的使用、加工与对外共享须经采购人书面同意。</strong></p>
</div>
<h3 class="doc-h2">八、数据安全责任</h3>
<p class="doc-p">中标人应建立数据安全管理制度，明确数据访问权限与操作审计要求；项目人员离场时应及时回收账号与权限，不得留存任何项目数据副本。</p>
<h3 class="doc-h2">九、文档交付</h3>
<p class="doc-p">中标人应交付完整的项目文档，包括需求、设计、测试、部署、运维与培训材料，文档应为可编辑格式，并与系统实际状态保持一致。</p>
${foot(23)}`);

/* 24 附件格式 */
pages.push(`
${head("第八章 投标文件格式")}
<h2 class="doc-h1">第八章　投标文件格式</h2>
<h3 class="doc-h2">一、投标文件组成</h3>
<ul class="doc-list">
  <li>附件一：投标函（格式）；</li>
  <li>附件二：开标一览表与分项报价表；</li>
  <li>附件三：法定代表人身份证明及授权委托书；</li>
  <li>附件四：资格证明文件；</li>
  <li>附件五：业绩证明材料；</li>
  <li>附件六：技术方案与实施计划；</li>
  <li>附件七：售后服务承诺函；</li>
  <li>附件八：廉洁投标承诺书。</li>
</ul>
<h3 class="doc-h2">二、编制要求</h3>
<p class="doc-p">投标文件应按上述顺序装订成册，编制目录并标注页码。所有复印件应清晰可辨并加盖公章，涂改处应加盖公章或由法定代表人签字确认。</p>
<h3 class="doc-h2">三、密封与标记</h3>
<p class="doc-p">投标文件应密封包装，封口处加盖投标人公章，外包装上应注明项目名称、采购编号、投标人名称及“开标时启封”字样。</p>
${foot(24)}`);

/* 25 声明 */
pages.push(`
${head("声明")}
<h2 class="doc-h1">声　明</h2>
<p class="doc-p">本招标文件由采购人委托招标代理机构编制，仅用于本次采购活动。未经书面许可，任何单位或个人不得复制、传播或用于其他用途。</p>
<p class="doc-p">本招标文件的解释权归采购人所有。招标文件如有澄清或修改，将以书面形式通知所有获取招标文件的潜在投标人，澄清或修改内容为招标文件的组成部分。</p>
<p class="doc-p">投标人应自行踏勘项目现场并充分了解实施条件，因未踏勘或了解不充分导致的报价风险由投标人自行承担。</p>
<div class="doc-sign">
  <p>采购人：某市产业园区管理委员会</p>
  <p>招标代理机构：某工程咨询有限公司</p>
  <p>二〇二六年一月</p>
</div>
${foot(25)}`);

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>智慧园区信息化系统采购项目招标文件</title>
<style>
  @page { size: A4; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page {
    width: 210mm;
    height: 297mm;
    padding: 18mm 20mm 16mm;
    position: relative;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
    box-sizing: border-box;
    font-family: "Songti SC", "STSong", "SimSun", serif;
    font-size: 10.5pt;
    line-height: 1.92;
    color: #1d1d1d;
  }
  .page:last-child { page-break-after: auto; break-after: auto; }
  .run-head {
    display: flex;
    justify-content: space-between;
    gap: 20pt;
    font-size: 8.5pt;
    color: #666;
    letter-spacing: 0.03em;
    border-bottom: 0.6pt solid #999;
    padding-bottom: 5pt;
    margin-bottom: 14pt;
  }
  .risk-anchor { display: flow-root; }
  .doc-h1 {
    font-size: 17pt;
    text-align: center;
    letter-spacing: 0.12em;
    margin: 6pt 0 14pt;
    font-weight: 700;
  }
  .doc-h2 {
    font-size: 11.5pt;
    margin: 12pt 0 6pt;
    font-weight: 700;
  }
  .doc-p { margin: 0 0 6pt; text-indent: 2em; text-align: justify; }
  .doc-note {
    margin: 10pt 0 0;
    padding: 7pt 10pt;
    background: #f4f4f2;
    border-left: 2.4pt solid #888;
    font-size: 9.5pt;
    color: #444;
    line-height: 1.75;
  }
  .doc-list { margin: 4pt 0 8pt; padding-left: 2.2em; }
  .doc-list li { margin-bottom: 3pt; text-align: justify; }
  .doc-table {
    width: 100%;
    border-collapse: collapse;
    margin: 8pt 0 12pt;
    font-size: 9.5pt;
    line-height: 1.65;
  }
  .doc-table th, .doc-table td {
    border: 0.6pt solid #666;
    padding: 4pt 6pt;
    vertical-align: top;
    text-align: left;
  }
  .doc-table th { background: #efefec; font-weight: 700; }
  .doc-table--dense td, .doc-table--dense th { padding: 3pt 6pt; }
  .doc-formula {
    margin: 8pt 0;
    text-align: center;
    font-family: "Songti SC", serif;
    font-size: 11pt;
  }
  .toc { list-style: none; margin: 12pt 0 0; padding: 0; }
  .toc li {
    display: flex;
    justify-content: space-between;
    padding: 7pt 2pt;
    border-bottom: 0.5pt dotted #aaa;
    font-size: 11pt;
  }
  .doc-sign { margin-top: 60pt; text-align: right; line-height: 2.4; }
  .page-foot {
    position: absolute;
    left: 20mm;
    right: 20mm;
    bottom: 9mm;
    display: flex;
    justify-content: space-between;
    font-size: 8pt;
    color: #777;
    border-top: 0.5pt solid #bbb;
    padding-top: 4pt;
  }
  .cover {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 32mm;
    position: relative;
  }
  .cover__org {
    font-size: 12pt;
    letter-spacing: 0.28em;
    color: #333;
    margin-top: 18mm;
  }
  .cover__title {
    font-size: 30pt;
    line-height: 1.55;
    letter-spacing: 0.08em;
    margin: 26mm 0 10mm;
    text-align: center;
    font-weight: 700;
  }
  .cover__sub {
    font-size: 24pt;
    letter-spacing: 0.7em;
    text-indent: 0.7em;
    margin-bottom: 30mm;
    font-weight: 700;
  }
  .cover__meta {
    font-size: 11pt;
    line-height: 2.3;
    text-align: center;
    color: #222;
    margin-top: auto;
    margin-bottom: 6mm;
  }
  .cover__seal {
    position: absolute;
    right: 20mm;
    bottom: 40mm;
    width: 20mm;
    height: 20mm;
    border: 1.2pt solid #999;
    border-radius: 2mm;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9pt;
    color: #777;
    letter-spacing: 0.1em;
    transform: rotate(-4deg);
  }
  .cover + .page-foot { display: flex; }
</style>
</head>
<body>
${pages.map((body) => `<div class="page">${body}</div>`).join("\n")}
</body>
</html>`;

mkdirSync(outDir, { recursive: true });
writeFileSync(tmpHtml, html, "utf8");

console.log("printing pdf via chrome…");
execFileSync(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    "--run-all-compositor-stages-before-draw",
    "--virtual-time-budget=4000",
    `--print-to-pdf=${outPdf}`,
    `file://${tmpHtml}`,
  ],
  { stdio: "inherit" },
);

const bytes = readFileSync(outPdf);
const pdf = await PDFDocument.load(bytes);
const count = pdf.getPageCount();
console.log(`generated ${outPdf} · ${(bytes.length / 1024).toFixed(1)} KB · ${count} pages`);
if (count !== 25) {
  console.error(`期望 25 页，实际 ${count} 页。请检查内容溢出。`);
  process.exit(1);
}
