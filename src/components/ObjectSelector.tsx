import type { LoadedModel } from '../lib/types'

interface ObjectSelectorProps {
  model: LoadedModel | null
  selectedIndex: number
  visibility: boolean[]
  onSelect: (index: number) => void
  onVisibilityChange: (index: number, visible: boolean) => void
}

export function ObjectSelector({
  model,
  selectedIndex,
  visibility,
  onSelect,
  onVisibilityChange,
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
        <span className="badge-chip">{model.objectCount}</span>
      </div>

      <div className="space-y-2">
        {model.objects.map((obj, index) => {
          const isSelected = index === selectedIndex
          const isVisible = visibility[index]

          return (
            <div
              key={obj.id}
              className={`object-row flex items-center gap-3 p-3 ${isSelected ? 'is-selected' : ''}`}
              onClick={() => onSelect(index)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onVisibilityChange(index, !isVisible)
                }}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border transition-colors"
                style={{
                  borderColor: isVisible
                    ? 'rgba(201, 175, 136, 0.9)'
                    : 'rgba(201, 175, 136, 0.5)',
                  background: isVisible
                    ? 'rgba(255, 255, 255, 0.6)'
                    : 'transparent',
                }}
                title={isVisible ? 'Hide object' : 'Show object'}
              >
                {isVisible ? (
                  <svg
                    className="h-3.5 w-3.5"
                    style={{ color: 'var(--text-secondary)' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-3.5 w-3.5"
                    style={{ color: 'var(--text-tertiary)' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                )}
              </button>

              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-semibold"
                  style={{
                    color: isSelected
                      ? 'var(--accent-cyan)'
                      : 'var(--text-primary)',
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

              {isSelected && (
                <div
                  className="h-2 w-2 rounded-full"
                  style={{
                    background: 'var(--accent-cyan)',
                    boxShadow: '0 0 8px var(--accent-cyan)',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
