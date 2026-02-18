import type { SupportedFormat, LoadedModel } from '../types'
import { loadSTL } from './stl-loader'
import { loadOBJ } from './obj-loader'
import { load3MF } from './threemf-loader'

export { loadSTL } from './stl-loader'
export { loadOBJ } from './obj-loader'
export { load3MF } from './threemf-loader'

export function detectFormat(filename: string): SupportedFormat | null {
  const ext = filename.toLowerCase().split('.').pop()
  if (ext === 'stl') return 'stl'
  if (ext === 'obj') return 'obj'
  if (ext === '3mf') return '3mf'
  return null
}

export async function loadModel(file: File): Promise<LoadedModel> {
  const format = detectFormat(file.name)

  if (!format) {
    throw new Error(`Unsupported file format: ${file.name}`)
  }

  const normalizedName = file.name.replace(/\.[^.]+$/, '')

  switch (format) {
    case 'stl':
      return loadSTL(file, normalizedName)
    case 'obj':
      return loadOBJ(file, normalizedName)
    case '3mf':
      return load3MF(file, normalizedName)
  }
}
