import { PIPELINE_NODES, NODE_COLORS, type PipelineNodeMeta } from "../data/pipeline";

const toX = (x: number) => 260 + x * 62;
const toY = (y: number) => 285 - y * 62;

function PosterNode({ node, index }: { node: PipelineNodeMeta; index: number }) {
  const x = toX(node.position[0]);
  const y = toY(node.position[1]);
  const color = NODE_COLORS[node.status];

  return (
    <g>
      <circle cx={x} cy={y} r={16} fill={color} opacity={0.12} />
      <circle cx={x} cy={y} r={8} fill={color} />
      <g transform={`translate(${x}, ${y - 36})`}>
        <rect x={-46} y={-11} width={92} height={22} rx={9} />
        <text x={0} y={0} textAnchor="middle" dominantBaseline="middle">
          {String(index + 1).padStart(2, "0")} · {node.label}
        </text>
      </g>
    </g>
  );
}

export function PipelinePoster() {
  return (
    <svg
      className="pipeline-poster"
      viewBox="0 0 520 560"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="pipeline-poster-glow" cx="50%" cy="46%" r="52%">
          <stop offset="0%" stopColor="#f7f1e2" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#f7f1e2" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="260" cy="280" r="235" fill="url(#pipeline-poster-glow)" />
      <circle className="pipeline-poster__disc" cx="260" cy="280" r="218" />

      <path
        className="pipeline-poster__path"
        d="M93 394 Q119 330 145 313 Q185 270 226 251 Q267 220 307 195 Q355 205 393 239 Q425 280 437 325"
      />
      <path
        className="pipeline-poster__retry"
        d="M393 239 C340 100 110 120 145 313"
      />

      {PIPELINE_NODES.map((node, index) => (
        <PosterNode key={node.id} node={node} index={index} />
      ))}

      <text className="pipeline-poster__retry-text" x="290" y="112">
        质量不达标 · 回退重试 ≤ 2
      </text>
    </svg>
  );
}
