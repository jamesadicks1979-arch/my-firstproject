import './App.css'

import { useMemo, useState, version as reactVersion } from 'react'

type EvalOk = {
  ok: true
  value: unknown
  valueType: string
  ms: number
}

type EvalErr = {
  ok: false
  error: string
  ms: number
}

type EvalResult = EvalOk | EvalErr

const EXAMPLES: Array<{ label: string; expression: string }> = [
  { label: 'Array map', expression: "['bunds', 'open', 'play'].map((s) => s.toUpperCase())" },
  { label: 'Object', expression: "({ project: 'bunds-open-play', ok: true, count: 3 })" },
  { label: 'Date', expression: 'new Date().toISOString()' },
  { label: 'Math', expression: 'Math.round((Math.random() * 100 + Number.EPSILON) * 100) / 100' },
]

function nowMs(): number {
  const perf = globalThis.performance
  if (perf && typeof perf.now === 'function') return perf.now()
  return Date.now()
}

function evalExpression(expression: string): EvalResult {
  const start = nowMs()
  try {
    // Local-only sandbox for quick experimenting.
    const fn = new Function(`"use strict"; return (${expression});`)
    const value = fn()
    return { ok: true, value, valueType: typeof value, ms: nowMs() - start }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: message, ms: nowMs() - start }
  }
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export default function App() {
  const [expression, setExpression] = useState(EXAMPLES[0]?.expression ?? '1 + 1')

  const result = useMemo(() => evalExpression(expression), [expression])

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1 className="title">bunds open play</h1>
          <div className="subtitle">
            Type a JavaScript expression. The result renders on the right.
          </div>
        </div>
        <div className="meta">
          <div>
            <span className="metaLabel">mode</span> {import.meta.env.MODE}
          </div>
          <div>
            <span className="metaLabel">runtime</span> React {reactVersion}
          </div>
        </div>
      </header>

      <div className="grid">
        <section className="panel">
          <div className="panelHeader">
            <div className="panelTitle">Editor</div>
            <div className="examples">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  className="exampleBtn"
                  onClick={() => setExpression(ex.expression)}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            className="editor"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            spellCheck={false}
            aria-label="Expression editor"
          />

          <div className="hint">
            Note: this uses <code>new Function()</code> for local-only experimenting. Don’t paste
            untrusted code.
          </div>
        </section>

        <section className="panel">
          <div className="panelHeader">
            <div className="panelTitle">Result</div>
            <div className="resultMeta">
              {result.ok ? (
                <>
                  <span className="pill ok">ok</span>
                  <span className="muted">{result.valueType}</span>
                </>
              ) : (
                <span className="pill err">error</span>
              )}
              <span className="muted">{result.ms.toFixed(1)}ms</span>
            </div>
          </div>

          {result.ok ? (
            <pre className="output">{formatValue(result.value)}</pre>
          ) : (
            <pre className="output outputErr">{result.error}</pre>
          )}
        </section>
      </div>

      <footer className="footer">
        <a href="https://vite.dev" target="_blank" rel="noreferrer">
          Vite docs
        </a>
        <span className="muted">·</span>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          React docs
        </a>
      </footer>
    </div>
  )
}
