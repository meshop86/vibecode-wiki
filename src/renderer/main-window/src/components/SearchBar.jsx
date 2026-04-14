import React, { useRef, useEffect } from 'react'

export default function SearchBar({ value, onChange }) {
  const inputRef = useRef(null)

  // Cmd+F focus
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
      if (e.key === 'Escape') inputRef.current?.blur()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div style={styles.wrap}>
      <span style={styles.icon}>🔍</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Tìm thuật ngữ... (⌘F)"
        style={styles.input}
        spellCheck={false}
      />
      {value && (
        <button onClick={() => onChange('')} style={styles.clear} title="Xóa">
          ✕
        </button>
      )}
    </div>
  )
}

const styles = {
  wrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    position: 'absolute',
    left: 10,
    fontSize: 13,
    color: '#64748b',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    background: '#0f172a',
    border: '1px solid rgba(148,163,184,0.15)',
    borderRadius: 10,
    padding: '9px 32px 9px 34px',
    color: '#f1f5f9',
    fontSize: 13,
    transition: 'border-color 0.15s ease',
  },
  clear: {
    position: 'absolute',
    right: 8,
    background: 'none',
    color: '#64748b',
    fontSize: 11,
    padding: '2px 4px',
    borderRadius: 4,
    lineHeight: 1,
  },
}
