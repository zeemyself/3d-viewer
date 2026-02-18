import * as THREE from "three";
import type { ModelInfo } from "./types";

export function calculateModelInfo(geometry: THREE.BufferGeometry): ModelInfo {
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const bbox = geometry.boundingBox!;
  const dimensions = {
    x: Math.abs(bbox.max.x - bbox.min.x),
    y: Math.abs(bbox.max.y - bbox.min.y),
    z: Math.abs(bbox.max.z - bbox.min.z),
  };

  const volume = calculateVolume(geometry);

  const index = geometry.index;
  const position = geometry.attributes.position;
  const triangleCount = index ? index.count / 3 : position.count / 3;
  const vertexCount = position.count;

  return {
    dimensions,
    volume,
    triangleCount: Math.round(triangleCount),
    vertexCount,
  };
}

function calculateVolume(geometry: THREE.BufferGeometry): number {
  const index = geometry.index;
  const position = geometry.attributes.position;
  const vertexCount = position.count;

  let volume = 0;

  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  const pC = new THREE.Vector3();

  const triangles = index ? index.count / 3 : vertexCount / 3;

  for (let i = 0; i < triangles; i++) {
    let iA, iB, iC;

    if (index) {
      iA = index.getX(i * 3);
      iB = index.getX(i * 3 + 1);
      iC = index.getX(i * 3 + 2);
    } else {
      iA = i * 3;
      iB = i * 3 + 1;
      iC = i * 3 + 2;
    }

    pA.fromBufferAttribute(position, iA);
    pB.fromBufferAttribute(position, iB);
    pC.fromBufferAttribute(position, iC);

    volume += signedVolumeOfTriangle(pA, pB, pC);
  }

  return Math.abs(volume);
}

function signedVolumeOfTriangle(
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  p3: THREE.Vector3
): number {
  return (
    (p1.x * (p2.y * p3.z - p3.y * p2.z) -
      p2.x * (p1.y * p3.z - p3.y * p1.z) +
      p3.x * (p1.y * p2.z - p2.y * p1.z)) /
    6.0
  );
}

export function centerGeometry(geometry: THREE.BufferGeometry): void {
  geometry.computeBoundingBox();
  geometry.center();
}

export function normalizeGeometry(geometry: THREE.BufferGeometry, targetSize = 100): void {
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox!;
  const size = new THREE.Vector3();
  bbox.getSize(size);

  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = targetSize / maxDim;

  geometry.scale(scale, scale, scale);
  geometry.center();
}

export function formatNumber(num: number, decimals = 2): string {
  return num.toFixed(decimals);
}

export function formatVolume(volumeMm3: number): string {
  if (volumeMm3 < 1000) {
    return `${formatNumber(volumeMm3)} mm³`;
  }
  return `${formatNumber(volumeMm3 / 1000)} cm³`;
}
