import type * as THREE from "three";

export type SupportedFormat = "stl" | "obj" | "3mf";

export interface LoadedModel {
  name: string;
  geometry: THREE.BufferGeometry;
  objectCount: number;
  objects: ModelObject[];
  format: SupportedFormat;
  printerConfig?: PrinterConfig;
}

export interface ModelObject {
  id: string;
  name: string;
  geometry: THREE.BufferGeometry;
  mesh?: THREE.Mesh;
  visible: boolean;
}

export interface ModelInfo {
  dimensions: {
    x: number;
    y: number;
    z: number;
  };
  volume: number;
  triangleCount: number;
  vertexCount: number;
}

export interface PrinterConfig {
  printerName?: string;
  material?: string;
  layerHeight?: number;
  infill?: number;
  printTemp?: number;
  bedTemp?: number;
  printTime?: number;
  supportEnabled?: boolean;
  supportType?: string;
  allSettings?: Record<string, string | number | boolean>;
}

export interface ViewerState {
  model: LoadedModel | null;
  selectedObjectIndex: number;
  isLoading: boolean;
  error: string | null;
}
