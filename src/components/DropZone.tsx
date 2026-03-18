import { useState, useCallback } from 'react'

interface DropZoneProps {
  onFileSelect: (file: File) => void
  isLoading: boolean
}

export function DropZone({ onFileSelect, isLoading }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      if (e.dataTransfer.files.length > 0) {
        onFileSelect(e.dataTransfer.files[0])
      }
    },
    [onFileSelect],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
        onFileSelect(e.target.files[0])
      }
    },
    [onFileSelect],
  )

  return (
    <div
      className={`dropzone-root ${isDragging ? 'is-dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`dropzone-card ${isDragging ? 'is-dragging' : ''}`}>
        {isLoading ? (
          <div className="flex flex-col items-center py-6 animate-fade-in">
            <div className="relative mb-6 h-16 w-16">
              <div
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: 'var(--border-dim)' }}
              />
              <div
                className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                style={{
                  borderTopColor: 'var(--accent-cyan)',
                  borderRightColor: 'var(--accent-cyan)',
                }}
              />
              <div
                className="absolute inset-2.5 rounded-full"
                style={{ background: 'var(--bg-tertiary)' }}
              />
            </div>
            <p
              className="text-lg font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Reading model
            </p>
            <p
              className="mt-1 text-sm"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Parsing geometry and metadata...
            </p>
          </div>
        ) : (
          <div className="animate-slide-up">
            <div
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
              style={{
                background:
                  'linear-gradient(140deg, var(--accent-cyan-glow), var(--accent-cyan-dim))',
                border: '1px solid var(--border-accent)',
                boxShadow: '0 0 40px -12px var(--accent-cyan-glow)',
              }}
            >
              <svg
                className="h-9 w-9"
                style={{ color: 'var(--accent-cyan)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>

            <h2
              className="text-center text-3xl font-bold"
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Bring In Your Model
            </h2>
            <p
              className="mx-auto mt-2 max-w-md text-center text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Drag and drop a file here or open the picker to inspect dimensions
              and mesh structure.
            </p>

            <div className="mt-7 text-center">
              <label className="primary-btn inline-flex cursor-pointer items-center gap-2">
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
                Select File
                <input
                  type="file"
                  className="hidden"
                  accept=".stl,.obj,.3mf"
                  onChange={handleFileInput}
                />
              </label>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {[
                { ext: 'STL', color: 'var(--accent-success)' },
                { ext: 'OBJ', color: 'var(--accent-warning)' },
                { ext: '3MF', color: 'var(--accent-plum)' },
              ].map(({ ext, color }) => (
                <div
                  key={ext}
                  className="rounded-full border px-3 py-1 text-xs"
                  style={{ borderColor: 'var(--border-dim)' }}
                >
                  <span
                    className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: color }}
                  />
                  <span
                    style={{
                      color: 'var(--text-tertiary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {ext}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
