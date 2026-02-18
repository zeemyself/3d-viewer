import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { centerGeometry } from '../model-utils'
import type { LoadedModel, ModelObject } from '../types'

export async function loadOBJ(
  file: File,
  normalizedName: string,
): Promise<LoadedModel> {
  return new Promise((resolve, reject) => {
    const loader = new OBJLoader()
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const object = loader.parse(text)

        const objects: ModelObject[] = []
        let combinedGeometry = (object.children[0] as any)?.geometry

        object.children.forEach((child, index) => {
          if ((child as any).geometry) {
            const geometry = (child as any).geometry.clone()
            centerGeometry(geometry)

            objects.push({
              id: `obj-mesh-${index}`,
              name: child.name || `Object ${index + 1}`,
              geometry,
              visible: true,
            })
          }
        })

        if (objects.length === 0) {
          reject(new Error('No geometry found in OBJ file'))
          return
        }

        if (objects.length === 1) {
          combinedGeometry = objects[0].geometry
        }

        resolve({
          name: normalizedName,
          geometry: combinedGeometry,
          objectCount: objects.length,
          objects,
          format: 'obj',
        })
      } catch (error) {
        reject(new Error(`Failed to parse OBJ: ${error}`))
      }
    }

    reader.onerror = () => reject(new Error('Failed to read OBJ file'))
    reader.readAsText(file)
  })
}
