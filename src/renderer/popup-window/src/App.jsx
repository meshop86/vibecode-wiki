import React, { useState, useEffect } from 'react'
import { CATEGORIES } from '../../../data/terms.js'

export default function PopupApp() {
  const [termData, setTermData] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!window.electronAPI) {
      // Dev mode fallback
      setTermData({
        term: 'Prompt',
        category: 'ai-llm',
        definition: 'Câu lệnh hoặc đoạn văn bản bạn gửi cho AI để yêu cầu nó thực hiện một nhiệm vụ.',
        usage: 'Dùng để ra lệnh, đặt câu hỏi, hoặc cung cấp ngữ cảnh cho AI trước khi nó sinh ra kết quả.',
        example: '"Viết một hàm JavaScript tính tổng mảng số nguyên"',
        tags: ['prompt engineering', 'LLM'],
      })
      setVisible(true)
      return
    }

    const cleanup = window.electronAPI.onShowTerm((data) => {
      setTermData(data)
      setVisible(true)
    })
    return cleanup
  }, [])

  // Escape key để đóng
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleClose = () => {
    setVisible(false)
    window.electronAPI?.closePopup()
  }

  const handleOpenInMain = () => {
    window.electronAPI?.openInMain(termData?.id)
  }

  if (!visible || !termData) return null

  if (termData.notFound) {
    return <NotFoundPopup query={termData.query} onClose={handleClose} />
  }

  const cat = CATEGORIES.find(c => c.id === termData.category)

  return (
    <div style={styles.container}>
      {/* Glass card */}
      <div style={styles.card}>
        {/* Top bar */}
        <div style={styles.topBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ ...styles.catDot, background: cat?.color || '#6366f1' }} />
            <span style={{ ...styles.catLabel, color: cat?.color || '#6366f1' }}>
              {cat?.label || termData.category}
            </span>
          </div>
          <div style={styles.actions}>
            <button onClick={handleOpenInMain} style={styles.openBtn} title="Mở trong Wiki">
              📖
            </button>
            <button onClick={handleClose} style={styles.closeBtn} title="Đóng (Esc)">
              ✕
            </button>
          </div>
        </div>

        {/* Term name */}
        <div style={styles.termName}>{termData.term}</div>

        {/* Definition */}
        <div style={styles.definition}>{termData.definition}</div>

        {/* Usage tip */}
        {termData.usage && (
          <div style={styles.usageBadge}>
            <span style={styles.usageIcon}>⚡</span>
            <span style={styles.usageText}>{truncate(termData.usage, 120)}</span>
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.tags}>
            {termData.tags?.slice(0, 3).map(t => (
              <span key={t} style={styles.tag}>{t}</span>
            ))}
          </div>
          <button onClick={handleOpenInMain} style={styles.moreBtn}>
            Xem chi tiết →
          </button>
        </div>
      </div>
    </div>
  )
}

function NotFoundPopup({ query, onClose }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.topBar}>
          <span style={{ color: '#64748b', fontSize: 12 }}>Vibecode Wiki</span>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>
        <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
          <div style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
            Không tìm thấy
          </div>
          <div style={{ color: '#64748b', fontSize: 12 }}>
            "{query}" chưa có trong từ điển
          </div>
        </div>
      </div>
    </div>
  )
}

function truncate(str, len) {
  if (!str || str.length <= len) return str
  return str.slice(0, len) + '...'
}

const styles = {
  container: {
    width: '100%',
    height: '100%',
    padding: 8,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  card: {
    width: '100%',
    background: 'rgba(15, 23, 42, 0.97)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: 16,
    padding: '14px 16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
    animation: 'popIn 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  catLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.04em',
  },
  actions: {
    display: 'flex',
    gap: 4,
  },
  openBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    padding: '2px 6px',
    borderRadius: 6,
    opacity: 0.7,
    transition: 'opacity 0.1s',
  },
  closeBtn: {
    background: 'rgba(148,163,184,0.1)',
    border: '1px solid rgba(148,163,184,0.15)',
    borderRadius: 6,
    color: '#64748b',
    fontSize: 11,
    padding: '3px 7px',
    cursor: 'pointer',
    lineHeight: 1,
  },
  termName: {
    fontSize: 20,
    fontWeight: 700,
    color: '#f1f5f9',
    letterSpacing: '-0.3px',
    marginBottom: 8,
    lineHeight: 1.2,
  },
  definition: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 1.6,
    marginBottom: 12,
  },
  usageBadge: {
    background: 'rgba(99,102,241,0.1)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: 8,
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  usageIcon: {
    fontSize: 13,
    flexShrink: 0,
    marginTop: 1,
  },
  usageText: {
    fontSize: 12,
    color: '#818cf8',
    lineHeight: 1.55,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  tags: {
    display: 'flex',
    gap: 4,
    flex: 1,
    overflow: 'hidden',
  },
  tag: {
    fontSize: 10,
    color: '#475569',
    background: 'rgba(148,163,184,0.06)',
    border: '1px solid rgba(148,163,184,0.1)',
    borderRadius: 4,
    padding: '2px 6px',
    whiteSpace: 'nowrap',
  },
  moreBtn: {
    background: 'rgba(99,102,241,0.15)',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: 8,
    color: '#818cf8',
    fontSize: 11,
    fontWeight: 600,
    padding: '5px 10px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.1s',
  },
}

// Inject animation keyframe
const styleEl = document.createElement('style')
styleEl.textContent = `
  @keyframes popIn {
    from { opacity: 0; transform: scale(0.92) translateY(-4px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
`
document.head.appendChild(styleEl)
