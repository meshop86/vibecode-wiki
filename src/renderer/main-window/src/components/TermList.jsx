import React, { useRef, useEffect } from 'react'
import { CATEGORIES } from '../../../../data/terms.js'

export default function TermList({ terms, selectedId, onSelect, query }) {
  const listRef = useRef(null)

  // Auto-scroll selected term vào view
  useEffect(() => {
    if (selectedId && listRef.current) {
      const el = listRef.current.querySelector(`[data-id="${selectedId}"]`)
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedId])

  // Arrow key navigation
  useEffect(() => {
    const handler = (e) => {
      if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) return
      const idx = terms.findIndex(t => t.id === selectedId)
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = terms[Math.min(idx + 1, terms.length - 1)]
        if (next) onSelect(next)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = terms[Math.max(idx - 1, 0)]
        if (prev) onSelect(prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [terms, selectedId, onSelect])

  if (terms.length === 0) {
    return (
      <div style={styles.empty}>
        <div>Không có kết quả</div>
      </div>
    )
  }

  return (
    <div ref={listRef} style={styles.list}>
      {terms.length > 0 && (
        <div style={styles.resultCount}>
          {terms.length} thuật ngữ {query ? `cho "${query}"` : ''}
        </div>
      )}
      {terms.map(term => (
        <TermListItem
          key={term.id}
          term={term}
          isSelected={term.id === selectedId}
          onClick={() => onSelect(term)}
          query={query}
        />
      ))}
    </div>
  )
}

function TermListItem({ term, isSelected, onClick, query }) {
  const cat = CATEGORIES.find(c => c.id === term.category)
  const highlightedTerm = highlight(term.term, query)

  return (
    <button
      data-id={term.id}
      onClick={onClick}
      style={{
        ...styles.item,
        ...(isSelected ? styles.itemActive : {}),
      }}
    >
      <div style={styles.itemHeader}>
        <span
          style={styles.termName}
          dangerouslySetInnerHTML={{ __html: highlightedTerm }}
        />
        <span
          style={{ ...styles.catBadge, background: cat?.color + '22', color: cat?.color }}
        >
          {cat?.label.split(' ')[0]}
        </span>
      </div>
      <div style={styles.termDef}>
        {truncate(term.definition, 80)}
      </div>
    </button>
  )
}

function highlight(text, query) {
  if (!query) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(
    new RegExp(`(${escaped})`, 'gi'),
    '<mark style="background:rgba(99,102,241,0.3);color:#a5b4fc;border-radius:2px;padding:0 1px">$1</mark>'
  )
}

function truncate(str, len) {
  if (str.length <= len) return str
  return str.slice(0, len) + '...'
}

const styles = {
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 8px 16px',
  },
  resultCount: {
    fontSize: 10,
    color: '#475569',
    padding: '8px 8px 4px',
    fontWeight: 500,
    letterSpacing: '0.03em',
  },
  item: {
    width: '100%',
    textAlign: 'left',
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: 10,
    padding: '10px 10px',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
    marginBottom: 2,
    color: '#94a3b8',
  },
  itemActive: {
    background: 'rgba(99,102,241,0.12)',
    borderColor: 'rgba(99,102,241,0.3)',
    color: '#f1f5f9',
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 3,
  },
  termName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#e2e8f0',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  catBadge: {
    fontSize: 14,
    borderRadius: 6,
    padding: '1px 4px',
    flexShrink: 0,
  },
  termDef: {
    fontSize: 11.5,
    color: '#64748b',
    lineHeight: 1.45,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  empty: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    color: '#475569',
    fontSize: 13,
  },
}
