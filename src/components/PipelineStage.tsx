import {
  Component,
  Suspense,
  lazy,
  memo,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PIPELINE_DESCRIPTION } from "../data/pipeline";
import { useMediaQuery, usePrefersReducedMotion } from "../hooks/useMediaQuery";
import { PipelinePoster } from "./PipelinePoster";
import { TraceCard } from "./TraceCard";

const HeroScene = memo(lazy(() => import("../three/HeroScene")));

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("3D 场景初始化失败，已回退为 Trace 卡。", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function PipelineStage() {
  const reducedMotion = usePrefersReducedMotion();
  const lowPower = useMediaQuery("(max-width: 720px)");
  const webgl = useMemo(hasWebGL, []);
  const [ready, setReady] = useState(false);
  const handleReady = useCallback(() => setReady(true), []);

  if (reducedMotion || !webgl) {
    return <TraceCard />;
  }

  return (
    <SceneBoundary fallback={<TraceCard />}>
      <div
        className={`pipeline-stage${ready ? " is-ready" : ""}`}
        role="img"
        aria-label={PIPELINE_DESCRIPTION}
      >
        <div className="pipeline-stage__poster">
          <PipelinePoster />
        </div>
        <Suspense fallback={null}>
          <HeroScene lowPower={lowPower} onReady={handleReady} />
        </Suspense>
      </div>
    </SceneBoundary>
  );
}
