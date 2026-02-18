import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { DropZone } from '../components/DropZone'
import { Viewer3D } from '../components/Viewer3D'
import { ObjectSelector } from '../components/ObjectSelector'
import { ModelInfoPanel } from '../components/ModelInfoPanel'
import { PrinterConfigPanel } from '../components/PrinterConfigPanel'
import { loadModel, detectFormat } from '../lib/loaders'
import type { LoadedModel } from '../lib/types'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const [model, setModel] = useState<LoadedModel | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedObjectIndex, setSelectedObjectIndex] = useState(0)
  const [objectVisibility, setObjectVisibility] = useState<boolean[]>([])

  const handleFileSelect = useCallback(async (file: File) => {
    const format = detectFormat(file.name)
    if (!format) {
      setError(`Unsupported file format: ${file.name}`)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const loadedModel = await loadModel(file)
      setModel(loadedModel)
      setSelectedObjectIndex(0)
      setObjectVisibility(
        Array.from({ length: loadedModel.objectCount }, () => true),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model')
      setModel(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleObjectSelect = useCallback((index: number) => {
    setSelectedObjectIndex(index)
  }, [])

  const handleVisibilityChange = useCallback(
    (index: number, visible: boolean) => {
      setObjectVisibility((prev) => {
        const next = [...prev]
        next[index] = visible
        return next
      })
    },
    [],
  )

  const handleReset = useCallback(() => {
    setModel(null)
    setError(null)
    setSelectedObjectIndex(0)
    setObjectVisibility([])
  }, [])

  const showDropZone = !model && !error
  const showRightPanel = model?.format === '3mf' && model.printerConfig

  return (
    <div className="app-shell">
      <div className={`workspace ${showRightPanel ? 'has-right-panel' : ''}`}>
        <aside className="sidebar-panel left-sidebar">
          <div className="panel-header">
            <div className="flex items-center gap-3">
              <div className="brand-icon">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
                  />
                </svg>
              </div>
              <div>
                <h1
                  className="text-base font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Foundry View
                </h1>
                <p
                  className="text-xs"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  3D Model Workbench
                </p>
              </div>
            </div>
            {model && (
              <button
                onClick={handleReset}
                className="ghost-icon-btn"
                title="Load new file"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            )}
          </div>

          <div className="panel-scroller">
            {!model && !isLoading && !error && (
              <div className="panel-inner animate-fade-in">
                <div className="subtle-card mb-3">
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Drop a printable model and inspect dimensions, mesh makeup,
                    and slicing profile details in one workspace.
                  </p>
                </div>

                <div className="subtle-card">
                  <h3
                    className="mb-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Supported Inputs
                  </h3>
                  <div className="space-y-2">
                    {[
                      { ext: 'STL', desc: 'Stereolithography' },
                      { ext: 'OBJ', desc: 'Wavefront' },
                      { ext: '3MF', desc: 'Manufacturing package' },
                    ].map(({ ext, desc }) => (
                      <div key={ext} className="format-row">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: 'var(--accent-cyan)' }}
                        >
                          .{ext.toLowerCase()}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="panel-inner animate-fade-in">
                <div
                  className="subtle-card"
                  style={{
                    borderColor: 'rgba(180, 35, 56, 0.35)',
                    background: 'rgba(255, 236, 239, 0.9)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: 'rgba(180, 35, 56, 0.1)',
                        color: 'var(--accent-error)',
                      }}
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: 'var(--accent-error)' }}
                      >
                        Import failed
                      </p>
                      <p
                        className="mt-1 text-xs leading-relaxed"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {error}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="secondary-btn mt-4 w-full"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {model && (
              <div className="animate-slide-up">
                <ObjectSelector
                  model={model}
                  selectedIndex={selectedObjectIndex}
                  visibility={objectVisibility}
                  onSelect={handleObjectSelect}
                  onVisibilityChange={handleVisibilityChange}
                />
                <ModelInfoPanel
                  model={model}
                  selectedIndex={selectedObjectIndex}
                />
              </div>
            )}
          </div>
        </aside>

        <main className="main-viewer">
          {showDropZone ? (
            <DropZone onFileSelect={handleFileSelect} isLoading={isLoading} />
          ) : error ? (
            <div className="flex h-full items-center justify-center px-6">
              <div className="subtle-card max-w-sm text-center">
                <div
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{
                    background: 'rgba(180, 35, 56, 0.12)',
                    color: 'var(--accent-error)',
                  }}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <p
                  className="mb-3 text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {error}
                </p>
                <button
                  onClick={() => setError(null)}
                  className="secondary-btn"
                >
                  Try another file
                </button>
              </div>
            </div>
          ) : (
            <Viewer3D
              model={model}
              selectedObjectIndex={selectedObjectIndex}
              objectVisibility={objectVisibility}
            />
          )}

          {model && !showDropZone && (
            <label className="floating-upload cursor-pointer px-3 py-2 text-sm font-semibold">
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Import New
              </span>
              <input
                type="file"
                className="hidden"
                accept=".stl,.obj,.3mf"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileSelect(e.target.files[0])
                }}
              />
            </label>
          )}
        </main>

        {showRightPanel && (
          <aside className="sidebar-panel right-sidebar">
            <PrinterConfigPanel model={model} />
          </aside>
        )}
      </div>
    </div>
  )
}
