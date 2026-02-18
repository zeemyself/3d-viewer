import { memo } from 'react'
import type { LoadedModel } from '../lib/types'

interface ObjectSelectorProps {
  model: LoadedModel | null
  visibility: boolean[]
  onVisibilityChange: (index: number, visible: boolean) => void
  onSelectAll: () => void
  onUnselectAll: () => void
}

export const ObjectSelector = memo(function ObjectSelector({
  model,
  visibility,
  onVisibilityChange,
  onSelectAll,
  onUnselectAll,
}: ObjectSelectorProps) {
  if (!model || model.objectCount <= 1) return null

  return (
    <div
      className="panel-inner"
      style={{ borderBottom: '1px solid var(--border-dim)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Mesh Objects
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onSelectAll}
            className="text-xs font-medium transition-colors hover:opacity-70"
            style={{ color: 'var(--accent-success)' }}
          >
            All
          </button>
          <span style={{ color: 'var(--text-tertiary)' }}>|</span>
          <button
            onClick={onUnselectAll}
            className="text-xs font-medium transition-colors hover:opacity-70"
            style={{ color: 'var(--text-tertiary)' }}
          >
            None
          </button>
          <span className="badge-chip ml-1">{model.objectCount}</span>
        </div>
      </div>

      <div className="space-y-2">
        {model.objects.map((obj, index) => {
          const isVisible = visibility[index]

          return (
            <div
              key={obj.id}
              onClick={() => onVisibilityChange(index, !isVisible)}
              className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors`}
              style={{
                background: isVisible
                  ? 'rgba(34, 197, 94, 0.1)'
                  : 'transparent',
                border: `1px solid ${
                  isVisible
                    ? 'rgba(34, 197, 94, 0.4)'
                    : 'rgba(201, 175, 136, 0.3)'
                }`,
              }}
            >
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-semibold"
                  style={{
                    color: isVisible
                      ? 'var(--accent-success)'
                      : 'var(--text-secondary)',
                  }}
                >
                  {obj.name}
                </p>
                <p
                  className="text-xs"
                  style={{
                    color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  mesh_{index.toString().padStart(2, '0')}
                </p>
              </div>

              {isVisible && (
                <div
                  className="h-2 w-2 rounded-full"
                  style={{
                    background: 'var(--accent-success)',
                    boxShadow: '0 0 8px var(--accent-success)',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})
