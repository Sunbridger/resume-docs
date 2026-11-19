import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Html, Line } from "@react-three/drei";
import * as THREE from "three";
import {
  NODE_COLORS,
  PIPELINE_NODES,
  type PipelineNodeMeta,
} from "../data/pipeline";
import { MAIN_CURVE, RETRY_CURVE } from "./curves";

interface HeroSceneProps {
  lowPower: boolean;
  onReady: () => void;
}

export default function HeroScene({ lowPower, onReady }: HeroSceneProps) {
  return (
    <Canvas
      className="pipeline-stage__canvas"
      flat
      dpr={lowPower ? [1, 1.5] : [1, 2]}
      camera={{ position: [0, 0, 10], fov: 40, near: 0.1, far: 100 }}
      gl={{ alpha: true, antialias: !lowPower, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0, background: "transparent" }}
      onCreated={({ gl }) => {
        gl.setClearAlpha(0);
        requestAnimationFrame(() => onReady());
      }}
    >
      <SceneContent lowPower={lowPower} />
    </Canvas>
  );
}

function SceneContent({ lowPower }: { lowPower: boolean }) {
  const { viewport } = useThree();
  const scale =
    Math.min(1, viewport.width / 7.2, viewport.height / 7.6) * (lowPower ? 0.86 : 1);

  return (
    <>
      <ambientLight intensity={0.72} />
      <hemisphereLight args={["#fff4dd", "#8ea195", 1.05]} />
      <directionalLight position={[4, 6, 7]} intensity={2.1} color="#ffe9c4" />
      <directionalLight position={[-5, -2, -3]} intensity={0.5} color="#cfe3d7" />

      <group scale={scale}>
        <Backdrop />
        {!lowPower && (
          <ContactShadows
            position={[0, -2.7, 0]}
            scale={11}
            blur={3.2}
            opacity={0.28}
            far={4.2}
            resolution={256}
            color="#17251f"
            frames={60}
          />
        )}

        <TiltGroup>
          {/* drei Html 在 React 19 下首个实例的 portal 内容会丢失，用隐藏哨兵占位 */}
          <Html position={[0, 3.1, -1]} center style={{ pointerEvents: "none" }}>
            <span className="pipeline-sentinel" />
          </Html>

          <PipelineTube />

          <Line
            points={RETRY_CURVE.getPoints(140)}
            color="#b07a26"
            lineWidth={1.3}
            dashed
            dashSize={0.12}
            gapSize={0.1}
            transparent
            opacity={0.55}
          />

          {PIPELINE_NODES.map((node, index) => (
            <PipelineNode
              key={node.id}
              node={node}
              index={index}
              total={PIPELINE_NODES.length}
            />
          ))}

          <FlowDots count={lowPower ? 1 : 2} />

          <Html
            position={[-0.95, 2.78, -0.9]}
            center
            zIndexRange={[20, 0]}
            style={{ pointerEvents: "none" }}
          >
            <span className="pipeline-retry-label">质量不达标 · 回退重试 ≤ 2</span>
          </Html>
        </TiltGroup>
      </group>
    </>
  );
}

function TiltGroup({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null!);
  const { pointer, gl } = useThree();

  useFrame((_, delta) => {
    // 场景位于项目区中段，按画布相对视口中心的位置做视差
    const rect = gl.domElement.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const scroll = Math.min(1, Math.max(-1, (window.innerHeight / 2 - center) / window.innerHeight));
    const targetY = -0.12 + pointer.x * 0.16 + scroll * 0.08;
    const targetX = 0.05 - pointer.y * 0.11;
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      targetY,
      3.2,
      delta,
    );
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      targetX,
      3.2,
      delta,
    );
    group.current.position.y = THREE.MathUtils.damp(
      group.current.position.y,
      scroll * 0.35,
      3.4,
      delta,
    );
  });

  return (
    <group ref={group} rotation={[0.05, -0.12, 0]}>
      {children}
    </group>
  );
}

function PipelineTube() {
  const geometry = useRef<THREE.TubeGeometry>(null!);

  useFrame(({ clock }) => {
    const progress = Math.min(1, clock.elapsedTime / 1.3);
    const eased = 1 - (1 - progress) ** 3;
    const total = geometry.current.index?.count ?? 0;
    geometry.current.setDrawRange(0, Math.floor(total * eased));
  });

  return (
    <mesh>
      <tubeGeometry ref={geometry} args={[MAIN_CURVE, 180, 0.016, 8, false]} />
      <meshStandardMaterial color="#c3b28c" roughness={0.9} metalness={0.02} />
    </mesh>
  );
}

function Backdrop() {
  return (
    <group position={[0, 0, -2.6]}>
      <mesh>
        <circleGeometry args={[4.3, 96]} />
        <meshBasicMaterial
          color="#f3ecdb"
          transparent
          opacity={0.58}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[4.26, 4.3, 96]} />
        <meshBasicMaterial
          color="#d8ccb2"
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function FlowDots({ count }: { count: number }) {
  const dots = useRef<Array<THREE.Mesh | null>>([]);
  const offsets = useMemo(
    () => Array.from({ length: count }, (_, i) => i / count),
    [count],
  );

  useFrame(({ clock }) => {
    for (let i = 0; i < offsets.length; i += 1) {
      const dot = dots.current[i];
      if (!dot) continue;
      const t = (clock.elapsedTime * 0.07 + offsets[i]) % 1;
      MAIN_CURVE.getPointAt(t, dot.position);
    }
  });

  return (
    <>
      {offsets.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            dots.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.052, 16, 16]} />
          <meshBasicMaterial color="#c9932f" />
        </mesh>
      ))}
    </>
  );
}

function PipelineNode({
  node,
  index,
  total,
}: {
  node: PipelineNodeMeta;
  index: number;
  total: number;
}) {
  const core = useRef<THREE.Mesh>(null!);
  const halo = useRef<THREE.Mesh>(null!);
  const coreMaterial = useRef<THREE.MeshStandardMaterial>(null!);
  const haloMaterial = useRef<THREE.MeshBasicMaterial>(null!);
  const [hovered, setHovered] = useState(false);
  const color = NODE_COLORS[node.status];

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);

  useFrame(({ clock }, delta) => {
    const intro = Math.min(1, Math.max(0, (clock.elapsedTime - index * 0.08) / 0.5));
    const introEased = intro * intro * (3 - 2 * intro);
    const active = Math.floor((clock.elapsedTime * 0.55) % total) === index;
    const coreScale = (hovered ? 1.24 : active ? 1.1 : 1) * introEased;
    const haloScale =
      (hovered ? 1.55 : active ? 1.35 + Math.sin(clock.elapsedTime * 2.4) * 0.05 : 1) *
      introEased;
    const haloOpacity = (hovered ? 0.3 : active ? 0.2 : 0.07) * introEased;
    const glow = hovered
      ? 0.6
      : active
        ? 0.42
        : node.status === "live"
          ? 0.24
          : 0.06;

    core.current.scale.setScalar(
      THREE.MathUtils.damp(core.current.scale.x, coreScale, 5, delta),
    );
    halo.current.scale.setScalar(
      THREE.MathUtils.damp(halo.current.scale.x, haloScale, 4, delta),
    );
    haloMaterial.current.opacity = THREE.MathUtils.damp(
      haloMaterial.current.opacity,
      haloOpacity,
      4,
      delta,
    );
    coreMaterial.current.emissiveIntensity = THREE.MathUtils.damp(
      coreMaterial.current.emissiveIntensity,
      glow,
      4,
      delta,
    );
  });

  return (
    <group position={node.position}>
      <mesh
        ref={core}
        scale={0.001}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.26, 48, 48]} />
        <meshStandardMaterial
          ref={coreMaterial}
          color={color}
          roughness={0.78}
          metalness={0.03}
          emissive={color}
          emissiveIntensity={0.06}
        />
      </mesh>

      <mesh ref={halo} scale={0.001} renderOrder={-1}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshBasicMaterial
          ref={haloMaterial}
          color={color}
          transparent
          opacity={0.07}
          depthWrite={false}
        />
      </mesh>

      <Html
        position={[0, 0.48, 0]}
        center
        zIndexRange={[25, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div
          className={`pipeline-label pipeline-label--${node.status}${hovered ? " is-hovered" : ""}`}
          style={{ animationDelay: `${index * 70}ms` }}
        >
          <span className="pipeline-label__row">
            <span className="pipeline-label__index">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="pipeline-label__name">{node.label}</span>
          </span>
          {hovered && <span className="pipeline-label__detail">{node.detail}</span>}
        </div>
      </Html>
    </group>
  );
}
