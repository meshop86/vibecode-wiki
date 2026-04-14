import React, { useState, useEffect, useCallback } from 'react'
import SearchBar from './components/SearchBar.jsx'
import CategoryFilter from './components/CategoryFilter.jsx'
import TermList from './components/TermList.jsx'
import TermDetail from './components/TermDetail.jsx'
import { searchTerms, terms as localTerms, CATEGORIES, getCategoryStats } from '../../../data/terms.js'

export default function App() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTerm, setSelectedTerm] = useState(null)
  const [filteredTerms, setFilteredTerms] = useState(localTerms)
  const [stats, setStats] = useState([])
  const [activeView, setActiveView] = useState('terms') // 'terms' | 'about'
  const [importStatus, setImportStatus] = useState(null) // null | 'success' | 'error'
  const [importMsg, setImportMsg] = useState('')
  const [termCount, setTermCount] = useState(localTerms.length)

  // Init stats
  useEffect(() => {
    setStats(getCategoryStats())
  }, [])

  // Filter logic
  useEffect(() => {
    let results = searchTerms(query)
    if (selectedCategory !== 'all') {
      results = results.filter(t => t.category === selectedCategory)
    }
    setFilteredTerms(results)
    // Reset selection nếu term không còn trong kết quả
    if (selectedTerm && !results.find(t => t.id === selectedTerm.id)) {
      setSelectedTerm(null)
    }
  }, [query, selectedCategory])

  // Listen to navigate-to-term from main process
  useEffect(() => {
    if (!window.electronAPI) return
    const cleanup = window.electronAPI.onNavigateToTerm((termId) => {
      const term = localTerms.find(t => t.id === termId)
      if (term) setSelectedTerm(term)
    })
    return cleanup
  }, [])

  const handleSelectTerm = useCallback((term) => {
    setSelectedTerm(term)
    setActiveView('terms')
  }, [])

  const handleImportFile = useCallback(async () => {
    if (!window.electronAPI?.importTermsFile) {
      setImportStatus('error')
      setImportMsg('Tính năng này chỉ hoạt động trong Electron')
      setTimeout(() => setImportStatus(null), 3000)
      return
    }
    try {
      const result = await window.electronAPI.importTermsFile()
      if (result.cancelled) return
      if (result.success) {
        setImportStatus('success')
        setImportMsg(`✅ Thêm ${result.added} thuật ngữ mới!`)
        setTermCount(result.totalCount)
        setTimeout(() => { setImportStatus(null); window.location.reload() }, 2000)
      } else {
        setImportStatus('error')
        setImportMsg(`❌ ${result.error}`)
        setTimeout(() => setImportStatus(null), 4000)
      }
    } catch (err) {
      setImportStatus('error')
      setImportMsg(`❌ ${err.message}`)
      setTimeout(() => setImportStatus(null), 4000)
    }
  }, [])

  const totalCount = termCount

  return (
    <div style={styles.app}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>⚡</span>
            <div>
              <div style={styles.logoTitle}>Vibecode Wiki</div>
              <div style={styles.logoSub}>{termCount} thuật ngữ</div>
            </div>
          </div>
          <SearchBar value={query} onChange={(val) => { setQuery(val); setActiveView('terms') }} />
        </div>

        {/* Categories */}
        <CategoryFilter
          categories={CATEGORIES}
          stats={stats}
          selected={selectedCategory}
          onSelect={(cat) => { setSelectedCategory(cat); setActiveView('terms') }}
          totalCount={totalCount}
        />

        {/* Term List - always in DOM to preserve sidebar flex layout */}
        <div style={activeView === 'terms'
          ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
          : { flex: 1, minHeight: 0, overflow: 'hidden', pointerEvents: 'none', visibility: 'hidden' }
        }>
          <TermList
            terms={filteredTerms}
            selectedId={selectedTerm?.id}
            onSelect={handleSelectTerm}
            query={query}
          />
        </div>

        {/* Sidebar Footer */}
        <div style={styles.sidebarFooter}>
          {importStatus && (
            <div style={{
              ...styles.importToast,
              background: importStatus === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              borderColor: importStatus === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
            }}>
              {importMsg}
            </div>
          )}
          <div style={styles.footerButtons}>
            <button
              style={{ ...styles.footerBtn, ...(activeView === 'about' ? styles.footerBtnActive : {}) }}
              onClick={() => setActiveView(activeView === 'about' ? 'terms' : 'about')}
              title="Giới thiệu & Thông tin"
            >
              ℹ️ Giới thiệu
            </button>
            <button
              style={styles.footerBtnImport}
              onClick={handleImportFile}
              title="Thêm thuật ngữ từ file .js hoặc .json"
            >
              📂 Thêm file
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        {activeView === 'about' ? (
          <AboutPanel termCount={termCount} />
        ) : selectedTerm ? (
          <TermDetail term={selectedTerm} allTerms={localTerms} onSelectTerm={handleSelectTerm} />
        ) : (
          <EmptyState query={query} count={filteredTerms.length} />
        )}
      </main>
    </div>
  )
}

function EmptyState({ query, count }) {
  return (
    <div style={styles.empty}>
      {query && count === 0 ? (
        <>
          <div style={styles.emptyIcon}>🔍</div>
          <div style={styles.emptyTitle}>Không tìm thấy "{query}"</div>
          <div style={styles.emptyText}>Thử từ khóa khác hoặc tìm theo category</div>
        </>
      ) : (
        <>
          <div style={styles.emptyIcon}>⚡</div>
          <div style={styles.emptyTitle}>Chọn một thuật ngữ để xem chi tiết</div>
          <div style={styles.emptyText}>
            Hoặc nhấn <kbd style={styles.kbd}>⌘ Shift V</kbd> để tra từ trong clipboard
          </div>
          <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['prompt', 'closure', 'useeffect', 'docker', 'jwt', 'vibe-coding'].map(id => (
              <QuickChip key={id} termId={id} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function QuickChip({ termId }) {
  const term = localTerms.find(t => t.id === termId)
  if (!term) return null
  const cat = CATEGORIES.find(c => c.id === term.category)
  return (
    <span style={{ ...styles.chip, borderColor: cat?.color + '44', color: cat?.color }}>
      {term.term}
    </span>
  )
}

function AboutPanel({ termCount }) {
  const catCount = CATEGORIES.length
  return (
    <div style={aboutStyles.container}>
      <div style={aboutStyles.card}>
        {/* Hero */}
        <div style={aboutStyles.hero}>
          <div style={aboutStyles.heroIcon}>⚡</div>
          <h1 style={aboutStyles.heroTitle}>Vibecode Wiki</h1>
          <p style={aboutStyles.heroSub}>Từ điển thuật ngữ lập trình dành cho Vibe Coders</p>
          <div style={aboutStyles.badges}>
            <span style={aboutStyles.badge}>v1.0.0</span>
            <span style={{...aboutStyles.badge, background: 'rgba(34,197,94,0.15)', color: '#4ade80', borderColor: 'rgba(34,197,94,0.3)'}}>
              MIT License
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={aboutStyles.stats}>
          <div style={aboutStyles.statItem}>
            <div style={aboutStyles.statNum}>{termCount}</div>
            <div style={aboutStyles.statLabel}>Thuật ngữ</div>
          </div>
          <div style={aboutStyles.statDivider} />
          <div style={aboutStyles.statItem}>
            <div style={aboutStyles.statNum}>{catCount}</div>
            <div style={aboutStyles.statLabel}>Danh mục</div>
          </div>
          <div style={aboutStyles.statDivider} />
          <div style={aboutStyles.statItem}>
            <div style={aboutStyles.statNum}>100%</div>
            <div style={aboutStyles.statLabel}>Offline</div>
          </div>
        </div>

        {/* Author */}
        <div style={aboutStyles.section}>
          <h2 style={aboutStyles.sectionTitle}>👤 Tác giả</h2>
          <div style={aboutStyles.authorCard}>
            <div style={aboutStyles.authorRow}>
              <span style={aboutStyles.authorLabel}>Tên</span>
              <span style={aboutStyles.authorValue}>Lương Xuân Hoà</span>
            </div>
            <div style={aboutStyles.authorRow}>
              <span style={aboutStyles.authorLabel}>Điện thoại</span>
              <a
                href="tel:0797899666"
                style={aboutStyles.authorLink}
                onClick={e => { e.preventDefault(); window.electronAPI?.openExternal?.('tel:0797899666') }}
              >
                0797899666
              </a>
            </div>
            <div style={aboutStyles.authorRow}>
              <span style={aboutStyles.authorLabel}>Giấy phép</span>
              <span style={{...aboutStyles.authorValue, color: '#4ade80'}}>MIT License</span>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div style={aboutStyles.section}>
          <h2 style={aboutStyles.sectionTitle}>🛠 Công nghệ</h2>
          <div style={aboutStyles.techGrid}>
            {[['⚡', 'Electron', 'Desktop shell'],['⚛️', 'React 19', 'UI framework'],['🔥', 'Vite', 'Build tool'],['🎨', 'CSS-in-JS', 'Styling']].map(([icon, name, desc]) => (
              <div key={name} style={aboutStyles.techCard}>
                <div style={aboutStyles.techIcon}>{icon}</div>
                <div>
                  <div style={aboutStyles.techName}>{name}</div>
                  <div style={aboutStyles.techDesc}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div style={aboutStyles.section}>
          <h2 style={aboutStyles.sectionTitle}>✨ Tính năng</h2>
          <ul style={aboutStyles.featureList}>
            {[
              ['⌘⇧F', 'Spotlight search — tìm thuật ngữ siêu tốc'],
              ['⌘⇧V', 'Tra từ từ clipboard — copy xong tra ngay'],
              ['⌘⇧W', 'Bật/tắt cửa sổ chính nhanh'],
              ['🖱️', 'Chuột phải → Tìm định nghĩa trên text bôi đen'],
              ['🔔', 'System tray — chạy nền, luôn sẵn sàng'],
              ['📂', 'Import thuật ngữ từ file JS/JSON tùy chỉnh'],
            ].map(([icon, text]) => (
              <li key={text} style={aboutStyles.featureItem}>
                <span style={aboutStyles.featureIcon}>{icon}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* MIT License text */}
        <div style={aboutStyles.licenseBox}>
          <p style={aboutStyles.licenseText}>
            MIT License © 2024 Lương Xuân Hoà. Permission is hereby granted, free of charge, to any person obtaining a copy of this software to deal in the Software without restriction.
          </p>
        </div>
      </div>
    </div>
  )
}

const aboutStyles = {
  container: {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    padding: '32px 24px',
    background: '#0f172a',
  },
  card: {
    maxWidth: 640, margin: '0 auto',
  },
  hero: {
    textAlign: 'center', marginBottom: 32,
  },
  heroIcon: { fontSize: 64, lineHeight: 1, marginBottom: 12 },
  heroTitle: {
    fontSize: 32, fontWeight: 800, color: '#f1f5f9',
    margin: '0 0 8px', letterSpacing: '-0.5px',
  },
  heroSub: {
    fontSize: 15, color: '#64748b', margin: '0 0 16px', lineHeight: 1.5,
  },
  badges: { display: 'flex', gap: 8, justifyContent: 'center' },
  badge: {
    padding: '4px 12px', borderRadius: 20,
    fontSize: 12, fontWeight: 600,
    background: 'rgba(99,102,241,0.15)',
    color: '#a5b4fc',
    border: '1px solid rgba(99,102,241,0.3)',
  },
  stats: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(148,163,184,0.05)',
    border: '1px solid rgba(148,163,184,0.1)',
    borderRadius: 16, padding: '20px 40px',
    marginBottom: 32, gap: 32,
  },
  statItem: { textAlign: 'center' },
  statNum: { fontSize: 28, fontWeight: 800, color: '#a5b4fc' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statDivider: {
    width: 1, height: 40, background: 'rgba(148,163,184,0.15)',
  },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 14, fontWeight: 700, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.8px',
    margin: '0 0 12px',
  },
  authorCard: {
    background: 'rgba(148,163,184,0.05)',
    border: '1px solid rgba(148,163,184,0.1)',
    borderRadius: 12, overflow: 'hidden',
  },
  authorRow: {
    display: 'flex', alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(148,163,184,0.08)',
  },
  authorLabel: {
    fontSize: 13, color: '#64748b', width: 100, flexShrink: 0,
  },
  authorValue: { fontSize: 14, color: '#e2e8f0', fontWeight: 500 },
  authorLink: {
    fontSize: 14, color: '#60a5fa', fontWeight: 500,
    textDecoration: 'none', cursor: 'pointer',
  },
  techGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
  },
  techCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'rgba(148,163,184,0.05)',
    border: '1px solid rgba(148,163,184,0.1)',
    borderRadius: 10, padding: '12px 14px',
  },
  techIcon: { fontSize: 24 },
  techName: { fontSize: 14, fontWeight: 600, color: '#e2e8f0' },
  techDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  featureList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 },
  featureItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'rgba(148,163,184,0.03)',
    border: '1px solid rgba(148,163,184,0.08)',
    borderRadius: 8, padding: '10px 14px',
    fontSize: 13, color: '#94a3b8',
  },
  featureIcon: { fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 },
  licenseBox: {
    background: 'rgba(99,102,241,0.05)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: 10, padding: '14px 16px', marginTop: 8,
  },
  licenseText: {
    fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.7,
  },
}

const styles = {
  app: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    background: '#0f172a',
  },
  sidebar: {
    width: 320,
    minWidth: 280,
    maxWidth: 360,
    borderRight: '1px solid rgba(148,163,184,0.1)',
    display: 'flex',
    flexDirection: 'column',
    background: '#111827',
    overflow: 'hidden',
  },
  header: {
    padding: '20px 16px 12px',
    borderBottom: '1px solid rgba(148,163,184,0.08)',
    flexShrink: 0,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 28,
    lineHeight: 1,
  },
  logoTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#f1f5f9',
    letterSpacing: '-0.3px',
  },
  logoSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  main: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    textAlign: 'center',
    color: '#64748b',
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 1.6,
  },
  kbd: {
    background: 'rgba(148,163,184,0.1)',
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: 6,
    padding: '2px 8px',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 12,
    color: '#94a3b8',
  },
  chip: {
    padding: '6px 14px',
    borderRadius: 20,
    border: '1px solid',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'default',
    background: 'transparent',
  },
  sidebarFooter: {
    padding: '8px 12px 12px',
    borderTop: '1px solid rgba(148,163,184,0.08)',
    flexShrink: 0,
  },
  footerButtons: {
    display: 'flex',
    gap: 6,
  },
  footerBtn: {
    flex: 1,
    padding: '7px 0',
    borderRadius: 8,
    border: '1px solid rgba(148,163,184,0.15)',
    background: 'transparent',
    color: '#64748b',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
    WebkitAppRegion: 'no-drag',
  },
  footerBtnActive: {
    background: 'rgba(99,102,241,0.15)',
    borderColor: 'rgba(99,102,241,0.4)',
    color: '#a5b4fc',
  },
  footerBtnImport: {
    flex: 1,
    padding: '7px 0',
    borderRadius: 8,
    border: '1px solid rgba(148,163,184,0.15)',
    background: 'transparent',
    color: '#64748b',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
    WebkitAppRegion: 'no-drag',
  },
  importToast: {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid',
    fontSize: 12,
    marginBottom: 8,
    fontWeight: 500,
  },
}
