import { useMemo } from 'react'
import * as THREE from 'three'
import {
  calculateModelInfo,
  formatNumber,
  formatVolume,
} from '../lib/model-utils'
import type { LoadedModel } from '../lib/types'

interface ModelInfoPanelProps {
  model: LoadedModel | null
  visibility: boolean[]
}

export function ModelInfoPanel({ model, visibility }: ModelInfoPanelProps) {
  const aggregatedInfo = useMemo(() => {
    if (!model) return null

    const visibleObjects = model.objects.filter((_, index) => visibility[index])
    if (visibleObjects.length === 0) return null

    if (visibleObjects.length === 1) {
      const info = calculateModelInfo(visibleObjects[0].geometry)
      return {
        isSingle: true,
        name: visibleObjects[0].name,
        ...info,
      }
    }

    const box = new THREE.Box3()
    let totalVolume = 0
    let totalTriangles = 0
    let totalVertices = 0

    for (const obj of visibleObjects) {
      const info = calculateModelInfo(obj.geometry)
      const mesh = new THREE.Mesh(obj.geometry.clone())
      box.expandByObject(mesh)
      totalVolume += info.volume
      totalTriangles += info.triangleCount
      totalVertices += info.vertexCount
    }

    const size = box.getSize(new THREE.Vector3())

    return {
      isSingle: false,
      objectCount: visibleObjects.length,
      dimensions: { x: size.x, y: size.y, z: size.z },
      volume: totalVolume,
      triangleCount: totalTriangles,
      vertexCount: totalVertices,
    }
  }, [model, visibility])

  if (!model) return null

  if (!aggregatedInfo) {
    return (
      <div className="panel-inner animate-slide-up">
        <h3
          className="mb-3 text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Geometry Data
        </h3>
        <div className="panel-surface p-3.5 text-center">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No objects selected
          </p>
        </div>
      </div>
    )
  }

  const displayName =
    'name' in aggregatedInfo
      ? aggregatedInfo.name
      : `${aggregatedInfo.objectCount} objects`
  const subtitle =
    'name' in aggregatedInfo ? 'Selected mesh details' : 'Combined geometry'

  return (
    <div className="panel-inner animate-slide-up">
      <h3
        className="mb-3 text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Geometry Data
      </h3>

      <div className="space-y-3">
        <div className="panel-surface p-3.5">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sm font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {displayName}
              </p>
              <p
                className="mt-0.5 text-xs"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {subtitle}
              </p>
            </div>
            <div
              className="ml-3 rounded-full px-2.5 py-1 text-xs font-bold"
              style={{
                background: 'var(--accent-cyan-dim)',
                color: 'var(--accent-cyan)',
                fontFamily: 'var(--font-mono)',
                border: '1px solid var(--border-accent)',
              }}
            >
              .{model.format}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            {
              label: 'X',
              value: aggregatedInfo.dimensions.x,
              axis: 'width',
              color: '#f47067',
            },
            {
              label: 'Y',
              value: aggregatedInfo.dimensions.y,
              axis: 'depth',
              color: '#3fb950',
            },
            {
              label: 'Z',
              value: aggregatedInfo.dimensions.z,
              axis: 'height',
              color: '#58a6ff',
            },
          ].map(({ label, value, axis, color }) => (
            <div key={label} className="metric-card p-3">
              <div className="mb-1 flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: color }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {label}
                </span>
              </div>
              <div
                className="text-lg font-semibold"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {formatNumber(value)}
              </div>
              <div
                className="text-xs"
                style={{ color: 'var(--text-tertiary)' }}
              >
                mm {axis}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="metric-card p-3.5">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4"
                style={{ color: 'var(--accent-cyan)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <span
                className="text-xs"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Volume
              </span>
            </div>
            <div
              className="mt-1.5 text-base font-semibold"
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {formatVolume(aggregatedInfo.volume)}
            </div>
          </div>

          <div className="metric-card p-3.5">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4"
                style={{ color: 'var(--accent-plum)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <span
                className="text-xs"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Objects
              </span>
            </div>
            <div
              className="mt-1.5 text-base font-semibold"
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {model.objectCount}
            </div>
          </div>
        </div>

        <div className="panel-surface p-3.5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Triangles
              </p>
              <p
                className="mt-1 text-lg font-semibold"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {aggregatedInfo.triangleCount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Vertices
              </p>
              <p
                className="mt-1 text-lg font-semibold"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {aggregatedInfo.vertexCount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
