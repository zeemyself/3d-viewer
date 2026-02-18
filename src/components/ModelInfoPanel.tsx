import { useMemo } from 'react'
import {
  calculateModelInfo,
  formatNumber,
  formatVolume,
} from '../lib/model-utils'
import type { LoadedModel } from '../lib/types'

interface ModelInfoPanelProps {
  model: LoadedModel | null
  selectedIndex: number
}

export function ModelInfoPanel({ model, selectedIndex }: ModelInfoPanelProps) {
  const modelInfo = useMemo(() => {
    if (!model) return null
    const selectedObject = model.objects[selectedIndex]
    if (!selectedObject) return null
    return calculateModelInfo(selectedObject.geometry)
  }, [model, selectedIndex])

  if (!model || !modelInfo) return null

  return (
    <div className="panel-inner">
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
                {model.name}
              </p>
              <p
                className="mt-0.5 text-xs"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Selected mesh details
              </p>
            </div>
            <div
              className="ml-3 rounded-full px-2.5 py-1 text-xs font-bold"
              style={{
                background: 'var(--accent-cyan-dim)',
                color: 'var(--accent-cyan)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              .{model.format}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'X', value: modelInfo.dimensions.x, axis: 'width' },
            { label: 'Y', value: modelInfo.dimensions.y, axis: 'depth' },
            { label: 'Z', value: modelInfo.dimensions.z, axis: 'height' },
          ].map(({ label, value, axis }) => (
            <div key={label} className="metric-card p-3">
              <div className="mb-1 flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: 'var(--accent-cyan)' }}
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
                style={{ color: 'var(--accent-success)' }}
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
              {formatVolume(modelInfo.volume)}
            </div>
          </div>

          <div className="metric-card p-3.5">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4"
                style={{ color: 'var(--accent-warning)' }}
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
                {modelInfo.triangleCount.toLocaleString()}
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
                {modelInfo.vertexCount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
