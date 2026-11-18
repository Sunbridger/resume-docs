/** 轻量中文分词：汉字按 bigram 切分，英文/数字按词切分。 */
export function tokenize(text: string): string[] {
  const normalized = text
    .toLowerCase()
    .replace(/[，。！？；：、“”‘’（）()《》【】\[\]{}<>/\\|]/g, " ");

  const tokens: string[] = [];
  const latin = normalized.match(/[a-z0-9][a-z0-9._-]*/g) ?? [];
  tokens.push(...latin);

  const hanRuns = normalized.match(/[一-鿿]+/g) ?? [];
  for (const run of hanRuns) {
    if (run.length === 1) {
      tokens.push(run);
      continue;
    }
    for (let i = 0; i < run.length - 1; i += 1) {
      tokens.push(run.slice(i, i + 2));
    }
  }
  return tokens;
}

const QUERY_STOP = new Set([
  "怎么",
  "么办",
  "如何",
  "一下",
  "帮我",
  "我们",
  "你们",
  "这个",
  "那个",
  "什么",
  "可以",
  "请问",
  "最近",
  "上次",
  "次有",
  "后来",
  "有人",
  "同事",
  "有同",
  "事反",
  "反馈",
  "来怎",
  "么解",
  "决的",
  "问题",
  "怎么",
  "处理",
  "解决",
  "的？",
  "之前",
  "然后",
  "就是",
  "一个",
  "能不能",
  "有没有",
]);

export function tokenizeQuery(text: string): string[] {
  return tokenize(text).filter((token) => !QUERY_STOP.has(token) && token.length > 0);
}

/** FNV-1a 32bit，用于把 n-gram 映射到固定维度。 */
export function hashToken(token: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
