import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import { BufferAttribute, BufferGeometry } from "three";
import { centerGeometry } from "../model-utils";
import type { LoadedModel, ModelObject, PrinterConfig } from "../types";

interface Vertex {
  x: number;
  y: number;
  z: number;
}

interface Triangle {
  v1: number;
  v2: number;
  v3: number;
}

interface ParsedModel {
  name?: string;
  vertices: Vertex[];
  triangles: Triangle[];
}

export async function load3MF(
  file: File,
  normalizedName: string
): Promise<LoadedModel> {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);

  const modelFiles = Object.keys(zipContent.files).filter(
    (name) => name.endsWith(".model") && !name.startsWith("__MACOSX")
  );

  if (modelFiles.length === 0) {
    throw new Error("No .model file found in 3MF archive");
  }

  const modelFile = zipContent.file(modelFiles[0]);
  if (!modelFile) {
    throw new Error("Could not access model file");
  }

  const modelXml = await modelFile.async("text");
  const objects = parse3MFModel(modelXml);

  if (objects.length === 0) {
    throw new Error("No objects found in 3MF model");
  }

  const printerConfig = await parsePrinterConfig(zipContent);

  const combinedVertices: number[] = [];
  const combinedIndices: number[] = [];

  const modelObjects: ModelObject[] = objects.map((obj, index) => {
    const geometry = createGeometryFromParsed(obj);

    const startIndex = combinedVertices.length / 3;
    const posAttr = geometry.getAttribute("position");
    for (let i = 0; i < posAttr.count; i++) {
      combinedVertices.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
    }

    const indices = geometry.getIndex();
    if (indices) {
      for (let i = 0; i < indices.count; i++) {
        combinedIndices.push(indices.getX(i) + startIndex);
      }
    }

    centerGeometry(geometry);

    return {
      id: `3mf-object-${index}`,
      name: obj.name || `Object ${index + 1}`,
      geometry,
      visible: true,
    };
  });

  const combinedGeometry = new BufferGeometry();
  combinedGeometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(combinedVertices), 3)
  );
  if (combinedIndices.length > 0) {
    combinedGeometry.setIndex(combinedIndices);
  }
  combinedGeometry.computeVertexNormals();
  centerGeometry(combinedGeometry);

  return {
    name: normalizedName,
    geometry: combinedGeometry,
    objectCount: modelObjects.length,
    objects: modelObjects,
    format: "3mf",
    printerConfig,
  };
}

function parse3MFModel(xmlContent: string): ParsedModel[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => name === "object" || name === "mesh" || name === "vertices" || name === "triangles",
  });

  const parsed = parser.parse(xmlContent);
  const objects: ParsedModel[] = [];

  const model = parsed.model;
  if (!model) return objects;

  const resources = model.resources;
  if (!resources) return objects;

  const objArray = resources.object;
  if (!objArray) return objects;

  for (const obj of objArray) {
    const mesh = obj.mesh;
    if (!mesh) continue;

    const verticesList = mesh.vertices?.vertex || [];
    const trianglesList = mesh.triangles?.triangle || [];

    const vertices: Vertex[] = verticesList.map((v: any) => ({
      x: parseFloat(v["@_x"] || 0),
      y: parseFloat(v["@_y"] || 0),
      z: parseFloat(v["@_z"] || 0),
    }));

    const triangles: Triangle[] = trianglesList.map((t: any) => ({
      v1: parseInt(t["@_v1"] || 0),
      v2: parseInt(t["@_v2"] || 0),
      v3: parseInt(t["@_v3"] || 0),
    }));

    objects.push({
      vertices,
      triangles,
      name: obj["@_name"] || obj["@_id"],
    } as ParsedModel & { name: string });
  }

  return objects;
}

function createGeometryFromParsed(model: ParsedModel): BufferGeometry {
  const geometry = new BufferGeometry();

  const positions: number[] = [];
  const indices: number[] = [];

  model.vertices.forEach((v) => {
    positions.push(v.x, v.y, v.z);
  });

  model.triangles.forEach((t) => {
    indices.push(t.v1, t.v2, t.v3);
  });

  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(positions), 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

async function parsePrinterConfig(
  zipContent: JSZip
): Promise<PrinterConfig | undefined> {
  const configFiles = Object.keys(zipContent.files).filter(
    (name) =>
      (name.includes("slice") ||
        name.includes("config") ||
        name.includes("settings") ||
        name.includes(".gcode")) &&
      !name.startsWith("__MACOSX")
  );

  if (configFiles.length === 0) return undefined;

  const config: PrinterConfig = {
    allSettings: {},
  };

  const fileContents = await Promise.all(
    configFiles.map(async (configFile) => {
      const file = zipContent.file(configFile);
      if (!file) return { path: configFile, content: null };
      const content = await file.async("text");
      return { path: configFile, content };
    })
  );

  for (const { path, content } of fileContents) {
    if (!content) continue;
    if (path.endsWith(".xml")) {
      parseXmlConfig(content, config);
    } else {
      parseTextConfig(content, config);
    }
  }

  return Object.keys(config.allSettings || {}).length > 0 ||
    config.layerHeight !== undefined
    ? config
    : undefined;
}

function parseXmlConfig(xmlContent: string, config: PrinterConfig): void {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    textNodeName: "#text",
  });

  try {
    const parsed = parser.parse(xmlContent);
    extractSettingsFromObject(parsed, config);
  } catch {
    parseTextConfig(xmlContent, config);
  }
}

function extractSettingsFromObject(
  obj: any,
  config: PrinterConfig,
  depth = 0
): void {
  if (depth > 10) return;

  if (typeof obj === "object" && obj !== null) {
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      const lowerKey = key.toLowerCase();

      if (lowerKey.includes("layer_height") || lowerKey === "layerheight") {
        config.layerHeight = parseFloat(value) || value;
      } else if (lowerKey.includes("infill") || lowerKey === "infill_density") {
        config.infill = parseFloat(value) || value;
      } else if (
        lowerKey.includes("print_temp") ||
        lowerKey.includes("hotend") ||
        lowerKey === "temperature"
      ) {
        config.printTemp = parseFloat(value) || value;
      } else if (lowerKey.includes("bed_temp") || lowerKey.includes("bed_temperature")) {
        config.bedTemp = parseFloat(value) || value;
      } else if (lowerKey.includes("material") || lowerKey.includes("filament")) {
        config.material = String(value);
      } else if (lowerKey.includes("printer") && lowerKey.includes("name")) {
        config.printerName = String(value);
      } else if (lowerKey.includes("support")) {
        config.supportEnabled = value === "true" || value === true || value === "1";
        config.supportType = String(value);
      } else if (
        lowerKey.includes("time") &&
        (lowerKey.includes("print") || lowerKey.includes("estimated"))
      ) {
        config.printTime = parseFloat(value) || value;
      }

      if (typeof value !== "object") {
        config.allSettings = config.allSettings || {};
        config.allSettings![key] = value;
      } else {
        extractSettingsFromObject(value, config, depth + 1);
      }
    }
  }
}

function parseTextConfig(content: string, config: PrinterConfig): void {
  const lines = content.split("\n");
  const settings: Record<string, string | number | boolean> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(";") || trimmed.startsWith("#")) continue;

    const separatorIndex =
      trimmed.indexOf("=") > -1
        ? trimmed.indexOf("=")
        : trimmed.indexOf(":");
    if (separatorIndex === -1) continue;

    const key = trimmed.substring(0, separatorIndex).trim().toLowerCase();
    let value: string | number | boolean = trimmed
      .substring(separatorIndex + 1)
      .trim();

    if (/^\d+\.?\d*$/.test(value)) {
      value = parseFloat(value);
    } else if (value === "true" || value === "True") {
      value = true;
    } else if (value === "false" || value === "False") {
      value = false;
    }

    settings[key] = value;

    if (key.includes("layer_height") || key === "layerheight") {
      config.layerHeight = value as number;
    } else if (key.includes("infill") || key === "infill_density") {
      config.infill = value as number;
    } else if (
      key.includes("print_temp") ||
      key.includes("hotend") ||
      key === "temperature"
    ) {
      config.printTemp = value as number;
    } else if (key.includes("bed_temp") || key.includes("bed_temperature")) {
      config.bedTemp = value as number;
    } else if (key.includes("material") || key.includes("filament")) {
      config.material = String(value);
    } else if (key.includes("printer") && key.includes("name")) {
      config.printerName = String(value);
    } else if (key.includes("support")) {
      if (typeof value === "boolean") {
        config.supportEnabled = value;
      } else {
        config.supportEnabled = String(value).toLowerCase() !== "none" && String(value) !== "0";
        config.supportType = String(value);
      }
    } else if (key.includes("time") && key.includes("print")) {
      config.printTime = value as number;
    }
  }

  config.allSettings = { ...config.allSettings, ...settings };
}
