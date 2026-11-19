import * as THREE from "three";
import { PIPELINE_NODES } from "../data/pipeline";

export const MAIN_CURVE = new THREE.CatmullRomCurve3(
  PIPELINE_NODES.map((node) => new THREE.Vector3(...node.position)),
  false,
  "catmullrom",
  0.4,
);

const judge = new THREE.Vector3(...PIPELINE_NODES[4].position);
const rewrite = new THREE.Vector3(...PIPELINE_NODES[1].position);

/** 质量判定 → Query 改写 的回退支线，向上绕出一道弧 */
export const RETRY_CURVE = new THREE.CatmullRomCurve3(
  [
    judge,
    new THREE.Vector3(1.5, 2.4, -0.9),
    new THREE.Vector3(-0.45, 2.2, -1.1),
    new THREE.Vector3(-1.7, 1.25, -0.9),
    rewrite,
  ],
  false,
  "catmullrom",
  0.5,
);
