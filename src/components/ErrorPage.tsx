import { useEffect, useState } from 'react'

interface ErrorInfo {
  message: string
  stack?: string
  componentStack?: string
  timestamp: string
  url: string
  userAgent: string
}

interface ErrorPageProps {
  error: Error
  reset?: () => void
}

function captureErrorInfo(error: Error): ErrorInfo {
  return {
    message: error.message || 'Unknown error',
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  }
}

function formatErrorReport(info: ErrorInfo): string {
  const sections = [
    `**Error Message:**\n${info.message}`,
    '',
    `**When:** ${info.timestamp}`,
    `**URL:** ${info.url}`,
    '',
    '**Browser:**',
    '```',
    info.userAgent,
    '```',
  ]

  if (info.stack) {
    sections.push('', '**Stack Trace:**', '```', info.stack, '```')
  }

  sections.push(
    '',
    '---',
    '_Please describe what you were doing when this error occurred:_',
  )

  return sections.join('\n')
}

function buildGitHubIssueUrl(info: ErrorInfo): string {
  const title = encodeURIComponent(`Bug: ${info.message.slice(0, 80)}`)
  const body = encodeURIComponent(formatErrorReport(info))
  return `https://github.com/zeemyself/3d-viewer/issues/new?labels=bug&template=bug_report.md&title=${title}&body=${body}`
}

export function ErrorPage({ error, reset }: ErrorPageProps) {
  const [copied, setCopied] = useState(false)
  const [errorInfo] = useState(() => captureErrorInfo(error))
  const [showStack, setShowStack] = useState(false)

  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  const handleCopyError = async () => {
    try {
      await navigator.clipboard.writeText(formatErrorReport(errorInfo))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error('Failed to copy')
    }
  }

  const githubUrl = buildGitHubIssueUrl(errorInfo)

  return (
    <div className="error-shell">
      <div className="error-card">
        <div className="error-icon-wrap">
          <div className="error-icon-inner">
            <svg
              className="h-10 w-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <h1 className="error-title">Something went wrong</h1>
        <p className="error-subtitle">
          An unexpected error occurred. Help us improve by reporting this issue.
        </p>

        <div className="error-message-box">
          <div className="error-message-header">
            <span className="error-label">Error</span>
            <span className="error-timestamp">{errorInfo.timestamp}</span>
          </div>
          <p className="error-message-text">{errorInfo.message}</p>
        </div>

        <button
          onClick={() => setShowStack((v) => !v)}
          className="error-toggle-stack"
        >
          <svg
            className={`h-4 w-4 transition-transform ${showStack ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span>{showStack ? 'Hide' : 'Show'} technical details</span>
        </button>

        {showStack && errorInfo.stack && (
          <div className="error-stack-box">
            <pre className="error-stack-content">{errorInfo.stack}</pre>
          </div>
        )}

        <div className="error-actions">
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="error-btn error-btn-primary"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Report on GitHub
          </a>

          <button
            onClick={handleCopyError}
            className="error-btn error-btn-secondary"
          >
            <svg
              className={`h-4 w-4 ${copied ? 'text-green-600' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {copied ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              )}
            </svg>
            {copied ? 'Copied!' : 'Copy details'}
          </button>
        </div>

        {reset && (
          <button onClick={reset} className="error-retry-btn">
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try again
          </button>
        )}
      </div>
    </div>
  )
}
