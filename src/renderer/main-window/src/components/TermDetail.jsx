import React, { useState } from 'react'
import { CATEGORIES, getRelatedTerms } from '../../../../data/terms.js'

export default function TermDetail({ term, allTerms, onSelectTerm }) {
  const [copied, setCopied] = useState(false)
  const cat = CATEGORIES.find(c => c.id === term.category)
  const related = getRelatedTerms(term.id, 4)

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={styles.wrap} className="fade-in" key={term.id}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <div style={styles.termName}>{term.term}</div>
            <div style={{ ...styles.catLabel, color: cat?.color }}>
              {cat?.label}
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(term.term)}
            style={styles.copyBtn}
            title="Copy tên thuật ngữ"
          >
            {copied ? '✓ Đã copy' : '📋 Copy'}
          </button>
        </div>

        {/* Tags */}
        {term.tags?.length > 0 && (
          <div style={styles.tags}>
            {term.tags.map(tag => (
              <span key={tag} style={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Definition */}
        <Section icon="📖" title="Định nghĩa" color={cat?.color}>
          <p style={styles.text}>{term.definition}</p>
        </Section>

        {/* Usage */}
        {term.usage && (
          <Section icon="⚡" title="Tác dụng & Khi nào dùng" color={cat?.color}>
            <p style={styles.text}>{term.usage}</p>
          </Section>
        )}

        {/* Example */}
        {term.example && (
          <Section icon="💡" title="Ví dụ thực tiễn" color={cat?.color}>
            {term.example.includes('\n') || term.example.startsWith('//') || term.example.startsWith('#') || term.example.includes('(') ? (
              <div style={styles.codeWrap}>
                <button
                  onClick={() => copyToClipboard(term.example)}
                  style={styles.codeCopyBtn}
                  title="Copy code"
                >
                  {copied ? '✓' : '📋'}
                </button>
                <pre><code>{term.example}</code></pre>
              </div>
            ) : (
              <p style={{ ...styles.text, fontStyle: 'italic', color: '#94a3b8' }}>
                "{term.example}"
              </p>
            )}
          </Section>
        )}

        {/* Related */}
        {related.length > 0 && (
          <Section icon="🔗" title="Thuật ngữ liên quan" color="#64748b">
            <div style={styles.relatedList}>
              {related.map(rt => {
                const rcat = CATEGORIES.find(c => c.id === rt.category)
                return (
                  <button
                    key={rt.id}
                    onClick={() => onSelectTerm(rt)}
                    style={styles.relatedItem}
                  >
                    <span style={{ ...styles.relatedDot, background: rcat?.color }} />
                    <span style={styles.relatedName}>{rt.term}</span>
                    <span style={styles.relatedCat}>{rcat?.label.split(' ')[0]}</span>
                  </button>
                )
              })}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ icon, title, color, children }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <span style={{ ...styles.sectionDot, background: color || '#6366f1' }} />
        <span style={styles.sectionIcon}>{icon}</span>
        <span style={styles.sectionTitle}>{title}</span>
      </div>
      <div style={styles.sectionBody}>{children}</div>
    </div>
  )
}

const styles = {
  wrap: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '24px 32px 20px',
    borderBottom: '1px solid rgba(148,163,184,0.1)',
    flexShrink: 0,
    background: 'linear-gradient(180deg, rgba(99,102,241,0.05) 0%, transparent 100%)',
  },
  headerTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 12,
  },
  termName: {
    fontSize: 28,
    fontWeight: 700,
    color: '#f1f5f9',
    letterSpacing: '-0.5px',
    lineHeight: 1.2,
    marginBottom: 6,
  },
  catLabel: {
    fontSize: 13,
    fontWeight: 500,
  },
  copyBtn: {
    background: 'rgba(148,163,184,0.08)',
    color: '#94a3b8',
    border: '1px solid rgba(148,163,184,0.15)',
    borderRadius: 8,
    padding: '7px 14px',
    fontSize: 12,
    fontWeight: 500,
    flexShrink: 0,
    marginTop: 4,
  },
  tags: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    background: 'rgba(148,163,184,0.08)',
    color: '#64748b',
    border: '1px solid rgba(148,163,184,0.12)',
    borderRadius: 20,
    padding: '3px 10px',
    fontSize: 11,
    fontWeight: 500,
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 32px 32px',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionDot: {
    width: 3,
    height: 20,
    borderRadius: 2,
    flexShrink: 0,
  },
  sectionIcon: {
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.06em',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  sectionBody: {
    paddingLeft: 11,
  },
  text: {
    fontSize: 14.5,
    color: '#cbd5e1',
    lineHeight: 1.75,
  },
  codeWrap: {
    position: 'relative',
  },
  codeCopyBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    background: 'rgba(148,163,184,0.1)',
    border: '1px solid rgba(148,163,184,0.15)',
    borderRadius: 6,
    color: '#94a3b8',
    fontSize: 11,
    padding: '3px 8px',
    zIndex: 1,
  },
  relatedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  relatedItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(148,163,184,0.05)',
    border: '1px solid rgba(148,163,184,0.1)',
    borderRadius: 8,
    padding: '9px 12px',
    color: '#94a3b8',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.1s',
    textAlign: 'left',
    width: '100%',
  },
  relatedDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  relatedName: {
    flex: 1,
    fontWeight: 500,
    color: '#e2e8f0',
  },
  relatedCat: {
    fontSize: 14,
  },
}
