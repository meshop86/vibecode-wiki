import React, { useState, useEffect, useRef, useCallback } from 'react'

const CATEGORY_COLORS = {
  'ai-llm':        '#6366f1',
  'vibe-workflow': '#f59e0b',
  'javascript':    '#eab308',
  'react':         '#38bdf8',
  'nodejs':        '#22c55e',
  'git':           '#f97316',
  'devops':        '#06b6d4',
  'patterns':      '#8b5cf6',
  'database':      '#ec4899',
  'css':           '#f43f5e',
  'testing':       '#10b981',
  'security':      '#ef4444',
  'build-tools':   '#64748b',
  'api':           '#0ea5e9',
}

export default function SearchApp() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)

  // Focus input when search opens
  useEffect(() => {
    const cleanup = window.electronAPI?.onSearchOpen?.(() => {
      setQuery('')
      setResults([])
      setSelectedIdx(0)
      setTimeout(() => inputRef.current?.focus(), 200)
    })
    setTimeout(() => inputRef.current?.focus(), 100)
    return cleanup
  }, [])

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return }
    setIsLoading(true)
    try {
      let res
      if (window.electronAPI?.searchTerms) {
        res = await window.electronAPI.searchTerms(q.trim())
      } else {
        // Browser fallback: import terms directly (path relative to Vite root)
        const mod = await import('../../../data/terms.js')
        res = mod.searchTerms(q.trim())
      }
      setResults((res || []).slice(0, 6))
      setSelectedIdx(0)
    } catch (e) {
      console.error('Search error:', e)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleInput = (e) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 120)
  }

  const selectTerm = (term) => {
    window.electronAPI?.showPopupFromSearch?.(term)
  }

  const openInMain = (e, termId) => {
    e.stopPropagation()
    window.electronAPI?.openSearchInMain?.(termId)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      window.electronAPI?.closeSearch?.()
      return
    }
    if (results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIdx]) selectTerm(results[selectedIdx])
    }
  }

  return (
    <div ref={containerRef} style={styles.container}>
      {/* Search bar */}
      <div style={styles.inputRow}>
        <span style={styles.searchIcon}>⌕</span>
        <input
          ref={inputRef}
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Tìm thuật ngữ...  Esc để đóng"
          style={styles.input}
          spellCheck={false}
          autoComplete="off"
        />
        {isLoading && <span style={styles.spinner}>◌</span>}
        {query && !isLoading && (
          <button style={styles.clearBtn} onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}>✕</button>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div style={styles.resultsList}>
          {results.map((term, idx) => (
            <div
              key={term.id}
              style={{ ...styles.resultItem, ...(idx === selectedIdx ? styles.resultItemActive : {}) }}
              onClick={() => selectTerm(term)}
              onMouseEnter={() => setSelectedIdx(idx)}
            >
              <div style={styles.resultLeft}>
                <span style={{ ...styles.catDot, background: CATEGORY_COLORS[term.category] || '#94a3b8' }} />
                <div>
                  <div style={styles.termName}>{term.term}</div>
                  <div style={styles.termDef}>{(term.shortDef || term.definition || '').slice(0, 72)}{(term.shortDef || term.definition || '').length > 72 ? '…' : ''}</div>
                </div>
              </div>
              <button
                style={styles.openBtn}
                onClick={(e) => openInMain(e, term.id)}
                title="Mở trong cửa sổ chính"
              >↗</button>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {query.trim() && results.length === 0 && !isLoading && (
        <div style={styles.noResults}>Không tìm thấy "{query}"</div>
      )}
    </div>
  )
}

const styles = {
  container: {
    width: '100%',
    borderRadius: 14,
    background: 'rgba(15, 20, 35, 0.92)',
    backdropFilter: 'blur(28px) saturate(180%)',
    WebkitBackdropFilter: 'blur(28px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.10)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(255,255,255,0.06)',
    overflow: 'hidden',
    fontFamily: "'Inter', system-ui, sans-serif",
    // Height is handled by the 420px window - transparent bg fills the rest
    maxHeight: 420,
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    height: 64,
    padding: '0 16px',
    gap: 10,
  },
  searchIcon: {
    fontSize: 22,
    color: 'rgba(148,163,184,0.7)',
    lineHeight: 1,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#f1f5f9',
    fontSize: 17,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontWeight: 400,
    letterSpacing: '-0.01em',
    '::placeholder': { color: 'rgba(148,163,184,0.5)' },
  },
  spinner: {
    color: 'rgba(148,163,184,0.5)',
    fontSize: 16,
    animation: 'spin 1s linear infinite',
    flexShrink: 0,
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'rgba(148,163,184,0.5)',
    fontSize: 13,
    padding: '2px 4px',
    borderRadius: 4,
    flexShrink: 0,
    lineHeight: 1,
  },
  resultsList: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: 6,
    paddingTop: 2,
  },
  resultItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    cursor: 'pointer',
    transition: 'background 0.1s',
    minHeight: 58,
  },
  resultItemActive: {
    background: 'rgba(99,102,241,0.18)',
  },
  resultLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
    marginTop: 5,
  },
  termName: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.3,
    marginBottom: 2,
  },
  termDef: {
    color: 'rgba(148,163,184,0.75)',
    fontSize: 12,
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 440,
  },
  openBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    color: 'rgba(148,163,184,0.7)',
    fontSize: 13,
    cursor: 'pointer',
    padding: '3px 7px',
    flexShrink: 0,
    marginLeft: 8,
    transition: 'all 0.15s',
  },
  noResults: {
    padding: '14px 20px',
    color: 'rgba(148,163,184,0.55)',
    fontSize: 13,
    borderTop: '1px solid rgba(255,255,255,0.06)',
    textAlign: 'center',
  },
}
