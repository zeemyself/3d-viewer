import { useState, useMemo } from 'react'
import type { LoadedModel, PrinterConfig } from '../lib/types'

function formatValue(value: string | number | boolean | undefined): string {
  if (value === undefined || value === null) return '-'
  if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled'
  if (typeof value === 'number') return value.toString()
  return String(value)
}

function formatPrintTime(seconds: number | undefined): string {
  if (!seconds) return '-'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

function buildBasicSettings(config: PrinterConfig) {
  return [
    { label: 'Printer', value: config.printerName },
    { label: 'Material', value: config.material },
    {
      label: 'Layer Height',
      value: config.layerHeight ? `${config.layerHeight} mm` : undefined,
    },
    {
      label: 'Infill Density',
      value: config.infill ? `${config.infill}%` : undefined,
    },
    {
      label: 'Nozzle Temp',
      value: config.printTemp ? `${config.printTemp}°C` : undefined,
    },
    {
      label: 'Bed Temp',
      value: config.bedTemp ? `${config.bedTemp}°C` : undefined,
    },
    {
      label: 'Support',
      value: config.supportEnabled
        ? formatValue(config.supportType) || 'Enabled'
        : 'Disabled',
    },
    { label: 'Est. Time', value: formatPrintTime(config.printTime) },
  ]
}

interface PrinterConfigPanelProps {
  model: LoadedModel | null
}

export function PrinterConfigPanel({ model }: PrinterConfigPanelProps) {
  const [showAll, setShowAll] = useState(false)

  const config = model?.printerConfig

  const basicSettings = useMemo(
    () => (config ? buildBasicSettings(config) : []),
    [config],
  )

  const allSettings = useMemo(() => {
    if (!config?.allSettings) return []
    const basicLabels = new Set(basicSettings.map((s) => s.label.toLowerCase()))
    return Object.entries(config.allSettings)
      .filter(([key]) => !basicLabels.has(key.toLowerCase()))
      .sort((a, b) => a[0].localeCompare(b[0]))
  }, [config?.allSettings, basicSettings])

  if (!model || model.format !== '3mf' || !config) return null

  return (
    <div className="flex h-full flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              background:
                'linear-gradient(135deg, var(--accent-plum), #8957e5)',
              boxShadow: '0 0 24px -8px rgba(130, 80, 223, 0.4)',
              color: 'var(--brand-icon-color)',
            }}
          >
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
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
          </div>
          <div>
            <h3
              className="text-sm font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              Print Profile
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Slicer metadata
            </p>
          </div>
        </div>
      </div>

      <div className="panel-scroller p-4">
        <div className="space-y-2">
          {basicSettings.map(({ label, value }) => (
            <div
              key={label}
              className="panel-surface flex items-center justify-between px-3.5 py-2.5"
              style={{ borderRadius: '0.8rem' }}
            >
              <span
                className="text-xs"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {label}
              </span>
              <span
                className="text-sm font-semibold"
                style={{
                  color: value ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {formatValue(value)}
              </span>
            </div>
          ))}
        </div>

        {allSettings.length > 0 && (
          <div className="mt-3.5">
            <button
              onClick={() => setShowAll(!showAll)}
              className="panel-surface flex w-full items-center justify-between px-3.5 py-2.5 text-sm font-semibold"
              style={{ color: 'var(--accent-plum)', borderRadius: '0.8rem' }}
            >
              <span>{showAll ? 'Hide advanced' : 'Show all settings'}</span>
              <span className="flex items-center gap-2">
                <span
                  className="rounded-md px-1.5 py-0.5 text-xs"
                  style={{
                    background: 'var(--accent-plum-dim)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {allSettings.length}
                </span>
                <svg
                  className="h-4 w-4 transition-transform duration-200"
                  style={{
                    transform: showAll ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            </button>

            {showAll && (
              <div
                className="panel-surface mt-2 space-y-1.5 p-2.5"
                style={{ borderRadius: '0.8rem' }}
              >
                {allSettings.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg px-2 py-2"
                    style={{ background: 'var(--surface-inset)' }}
                  >
                    <span
                      className="max-w-[52%] truncate text-xs"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {key}
                    </span>
                    <span
                      className="max-w-[44%] truncate text-right text-xs"
                      style={{
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {formatValue(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
