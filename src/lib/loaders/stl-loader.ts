import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { centerGeometry } from '../model-utils'
import type { LoadedModel, ModelObject } from '../types'

export async function loadSTL(
  file: File,
  normalizedName: string,
): Promise<LoadedModel> {
  return new Promise((resolve, reject) => {
    const loader = new STLLoader()
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer
        const geometry = loader.parse(arrayBuffer)

        geometry.computeVertexNormals()
        centerGeometry(geometry)

        const modelObject: ModelObject = {
          id: 'stl-mesh-0',
          name: normalizedName,
          geometry,
          visible: true,
        }

        resolve({
          name: normalizedName,
          geometry,
          objectCount: 1,
          objects: [modelObject],
          format: 'stl',
        })
      } catch (error) {
        reject(new Error(`Failed to parse STL: ${error}`))
      }
    }

    reader.onerror = () => reject(new Error('Failed to read STL file'))
    reader.readAsArrayBuffer(file)
  })
}
