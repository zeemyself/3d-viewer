import JSZip from 'jszip'
import { XMLParser } from 'fast-xml-parser'
import { BufferAttribute, BufferGeometry } from 'three'
import { centerGeometry } from '../model-utils'
import type { LoadedModel, ModelObject, PrinterConfig } from '../types'

interface Vertex {
  x: number
  y: number
  z: number
}

interface Triangle {
  v1: number
  v2: number
  v3: number
}

interface ParsedModel {
  name?: string
  vertices: Vertex[]
  triangles: Triangle[]
}

export async function load3MF(
  file: File,
  normalizedName: string,
): Promise<LoadedModel> {
  const zip = new JSZip()
  const zipContent = await zip.loadAsync(file)

  const modelFiles = Object.keys(zipContent.files).filter(
    (name) => name.endsWith('.model') && !name.startsWith('__MACOSX'),
  )

  if (modelFiles.length === 0) {
    throw new Error('No .model file found in 3MF archive')
  }

  const mainModelFile =
    zipContent.file('3D/3dmodel.model') || zipContent.file(modelFiles[0])
  if (!mainModelFile) {
    throw new Error('Could not access model file')
  }

  const modelXml = await mainModelFile.async('text')
  const { objects, componentPaths } = parse3MFModelWithComponents(modelXml)

  const componentObjects = await loadComponentModels(zipContent, componentPaths)

  const allObjects = [...objects, ...componentObjects]

  if (allObjects.length === 0) {
    throw new Error('No objects found in 3MF model')
  }

  const printerConfig = await parsePrinterConfig(zipContent)

  const combinedVertices: number[] = []
  const combinedIndices: number[] = []

  const modelObjects: ModelObject[] = allObjects.map((obj, index) => {
    const geometry = createGeometryFromParsed(obj)

    const startIndex = combinedVertices.length / 3
    const posAttr = geometry.getAttribute('position')
    for (let i = 0; i < posAttr.count; i++) {
      combinedVertices.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i))
    }

    const indices = geometry.getIndex()
    if (indices) {
      for (let i = 0; i < indices.count; i++) {
        combinedIndices.push(indices.getX(i) + startIndex)
      }
    }

    centerGeometry(geometry)

    return {
      id: `3mf-object-${index}`,
      name: obj.name || `Object ${index + 1}`,
      geometry,
      visible: true,
    }
  })

  const combinedGeometry = new BufferGeometry()
  combinedGeometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(combinedVertices), 3),
  )
  if (combinedIndices.length > 0) {
    combinedGeometry.setIndex(combinedIndices)
  }
  combinedGeometry.computeVertexNormals()
  centerGeometry(combinedGeometry)

  return {
    name: normalizedName,
    geometry: combinedGeometry,
    objectCount: modelObjects.length,
    objects: modelObjects,
    format: '3mf',
    printerConfig,
  }
}

function parse3MFModelWithComponents(xmlContent: string): {
  objects: ParsedModel[]
  componentPaths: string[]
} {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) =>
      name === 'object' ||
      name === 'mesh' ||
      name === 'vertex' ||
      name === 'triangle' ||
      name === 'component' ||
      name === 'components',
  })

  const parsed = parser.parse(xmlContent)
  const objects: ParsedModel[] = []
  const componentPaths: string[] = []

  const model = parsed.model
  if (!model) return { objects, componentPaths }

  const resources = model.resources
  if (!resources) return { objects, componentPaths }

  const objArray = resources.object
  if (!objArray) return { objects, componentPaths }

  for (const obj of objArray) {
    const meshData = Array.isArray(obj.mesh) ? obj.mesh[0] : obj.mesh
    if (meshData) {
      const verticesList = meshData.vertices?.vertex || []
      const trianglesList = meshData.triangles?.triangle || []

      const vertices: Vertex[] = verticesList.map(
        (v: Record<string, string>) => ({
          x: parseFloat(v['@_x'] ?? '0'),
          y: parseFloat(v['@_y'] ?? '0'),
          z: parseFloat(v['@_z'] ?? '0'),
        }),
      )

      const triangles: Triangle[] = trianglesList.map(
        (t: Record<string, string>) => ({
          v1: parseInt(t['@_v1'] || '0'),
          v2: parseInt(t['@_v2'] || '0'),
          v3: parseInt(t['@_v3'] || '0'),
        }),
      )

      objects.push({
        vertices,
        triangles,
        name: obj['@_name'] || obj['@_id'],
      } as ParsedModel & { name: string })
    }

    const comps = obj.components
    if (comps) {
      const compsArray = Array.isArray(comps) ? comps : [comps]
      for (const compWrapper of compsArray) {
        const innerComps = compWrapper.component
        if (innerComps) {
          const innerArray = Array.isArray(innerComps)
            ? innerComps
            : [innerComps]
          for (const comp of innerArray) {
            const path = comp['@_p:path']
            if (path) {
              componentPaths.push(path)
            }
          }
        }
      }
    }
  }

  return { objects, componentPaths }
}

async function loadComponentModels(
  zipContent: JSZip,
  componentPaths: string[],
): Promise<ParsedModel[]> {
  const objects: ParsedModel[] = []

  for (const path of componentPaths) {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path
    const file = zipContent.file(normalizedPath)
    if (!file) continue

    const xmlContent = await file.async('text')
    const { objects: componentObjects } =
      parse3MFModelWithComponents(xmlContent)
    objects.push(...componentObjects)
  }

  return objects
}

function createGeometryFromParsed(model: ParsedModel): BufferGeometry {
  const geometry = new BufferGeometry()

  const positions: number[] = []
  const indices: number[] = []

  model.vertices.forEach((v) => {
    positions.push(v.x, v.y, v.z)
  })

  model.triangles.forEach((t) => {
    indices.push(t.v1, t.v2, t.v3)
  })

  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(positions), 3),
  )
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}

async function parsePrinterConfig(
  zipContent: JSZip,
): Promise<PrinterConfig | undefined> {
  const configFiles = Object.keys(zipContent.files).filter(
    (name) =>
      (name.includes('slice') ||
        name.includes('config') ||
        name.includes('settings') ||
        name.includes('.gcode')) &&
      !name.startsWith('__MACOSX'),
  )

  if (configFiles.length === 0) return undefined

  const config: PrinterConfig = {
    allSettings: {},
  }

  const fileContents = await Promise.all(
    configFiles.map(async (configFile) => {
      const file = zipContent.file(configFile)
      if (!file) return { path: configFile, content: null }
      const content = await file.async('text')
      return { path: configFile, content }
    }),
  )

  for (const { path, content } of fileContents) {
    if (!content) continue
    if (path.endsWith('.xml') || path.includes('slice_info')) {
      parseXmlConfig(content, config, path)
    } else if (content.trim().startsWith('{')) {
      parseJsonConfig(content, config)
    } else {
      parseTextConfig(content, config)
    }
  }

  return Object.keys(config.allSettings || {}).length > 0 ||
    config.layerHeight !== undefined
    ? config
    : undefined
}

function parseXmlConfig(
  xmlContent: string,
  config: PrinterConfig,
  path?: string,
): void {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: '#text',
  })

  try {
    const parsed = parser.parse(xmlContent)
    if (path?.includes('slice_info')) {
      parseSliceInfo(parsed, config)
    } else {
      extractSettingsFromObject(parsed, config)
    }
  } catch {
    parseTextConfig(xmlContent, config)
  }
}

function parseSliceInfo(parsed: any, config: PrinterConfig): void {
  const plate = parsed.config?.plate
  if (!plate) return

  const prediction = plate.metadata?.find(
    (m: any) => m.key === 'prediction',
  )?.value
  if (prediction) {
    config.printTime = parseInt(prediction)
  }

  const filament = plate.filament
  if (filament) {
    const filamentArray = Array.isArray(filament) ? filament : [filament]
    const types = filamentArray.map((f: any) => f.type).filter(Boolean)
    if (types.length > 0) {
      config.material = [...new Set(types)].join(', ')
    }
  }

  const nozzleDiameters = plate.metadata?.find(
    (m: any) => m.key === 'nozzle_diameters',
  )?.value
  if (nozzleDiameters) {
    config.allSettings = config.allSettings || {}
    config.allSettings!['nozzle_diameter'] = nozzleDiameters
  }
}

function parseJsonConfig(content: string, config: PrinterConfig): void {
  try {
    const parsed = JSON.parse(content)
    extractSettingsFromObject(parsed, config)
  } catch {
    parseTextConfig(content, config)
  }
}

function parseFirstValue(value: unknown): number | undefined {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const cleaned = value.replace('%', '').trim()
    const num = parseFloat(cleaned)
    return isNaN(num) ? undefined : num
  }
  if (Array.isArray(value)) {
    return parseFirstValue(value[0])
  }
  return undefined
}

function extractFirstString(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && value.length > 0) {
    return extractFirstString(value[0])
  }
  return String(value)
}

function extractSettingsFromObject(
  obj: any,
  config: PrinterConfig,
  depth = 0,
): void {
  if (depth > 10) return

  if (typeof obj === 'object' && obj !== null) {
    for (const key of Object.keys(obj)) {
      const value = obj[key]
      const lowerKey = key.toLowerCase()

      if (lowerKey === 'layer_height' || lowerKey === 'layerheight') {
        config.layerHeight = parseFirstValue(value)
      } else if (
        lowerKey.includes('infill_density') ||
        lowerKey === 'sparse_infill_density'
      ) {
        config.infill = parseFirstValue(value)
      } else if (
        lowerKey === 'nozzle_temperature' ||
        lowerKey.includes('print_temp') ||
        lowerKey.includes('hotend')
      ) {
        config.printTemp = parseFirstValue(value)
      } else if (
        lowerKey === 'cool_plate_temp' ||
        lowerKey === 'bed_temperature' ||
        lowerKey.includes('bed_temp')
      ) {
        config.bedTemp = parseFirstValue(value)
      } else if (
        lowerKey === 'material' ||
        lowerKey === 'default_filament_profile'
      ) {
        if (!config.material) {
          config.material = extractFirstString(value)
        }
      } else if (lowerKey.includes('printer') && lowerKey.includes('name')) {
        config.printerName = extractFirstString(value)
      } else if (lowerKey === 'enable_support' || lowerKey === 'support_type') {
        if (typeof value === 'boolean') {
          config.supportEnabled = value
        } else {
          config.supportEnabled = value === 'true' || value === '1'
        }
        if (typeof value === 'string') {
          config.supportType = value
        }
      } else if (
        lowerKey.includes('time') &&
        (lowerKey.includes('print') || lowerKey.includes('prediction'))
      ) {
        config.printTime = parseFirstValue(value)
      }

      if (typeof value !== 'object') {
        config.allSettings = config.allSettings || {}
        config.allSettings![key] = value
      } else {
        extractSettingsFromObject(value, config, depth + 1)
      }
    }
  }
}

function parseTextConfig(content: string, config: PrinterConfig): void {
  const lines = content.split('\n')
  const settings: Record<string, string | number | boolean> = {}

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) continue

    const separatorIndex =
      trimmed.indexOf('=') > -1 ? trimmed.indexOf('=') : trimmed.indexOf(':')
    if (separatorIndex === -1) continue

    const key = trimmed.substring(0, separatorIndex).trim().toLowerCase()
    let value: string | number | boolean = trimmed
      .substring(separatorIndex + 1)
      .trim()

    if (/^\d+\.?\d*$/.test(value)) {
      value = parseFloat(value)
    } else if (value === 'true' || value === 'True') {
      value = true
    } else if (value === 'false' || value === 'False') {
      value = false
    }

    settings[key] = value

    if (key.includes('layer_height') || key === 'layerheight') {
      config.layerHeight = value as number
    } else if (key.includes('infill') || key === 'infill_density') {
      config.infill = value as number
    } else if (
      key.includes('print_temp') ||
      key.includes('hotend') ||
      key === 'temperature'
    ) {
      config.printTemp = value as number
    } else if (key.includes('bed_temp') || key.includes('bed_temperature')) {
      config.bedTemp = value as number
    } else if (key.includes('material') || key.includes('filament')) {
      config.material = String(value)
    } else if (key.includes('printer') && key.includes('name')) {
      config.printerName = String(value)
    } else if (key.includes('support')) {
      if (typeof value === 'boolean') {
        config.supportEnabled = value
      } else {
        config.supportEnabled =
          String(value).toLowerCase() !== 'none' && String(value) !== '0'
        config.supportType = String(value)
      }
    } else if (key.includes('time') && key.includes('print')) {
      config.printTime = value as number
    }
  }

  config.allSettings = { ...config.allSettings, ...settings }
}
