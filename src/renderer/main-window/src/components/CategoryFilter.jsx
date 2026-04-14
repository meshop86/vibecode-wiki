import React from 'react'

export default function CategoryFilter({ categories, stats, selected, onSelect, totalCount }) {
  const getCount = (catId) => stats.find(s => s.id === catId)?.count ?? 0

  return (
    <div style={styles.wrap}>
      <div style={styles.label}>DANH MỤC</div>
      <div style={styles.list}>
        {/* All */}
        <button
          onClick={() => onSelect('all')}
          style={{ ...styles.item, ...(selected === 'all' ? styles.active : {}) }}
        >
          <span style={styles.icon}>📚</span>
          <span style={styles.name}>Tất cả</span>
          <span style={styles.count}>{totalCount}</span>
        </button>

        {categories.map(cat => {
          const isActive = selected === cat.id
          const count = getCount(cat.id)
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              style={{
                ...styles.item,
                ...(isActive ? { ...styles.active, background: cat.color + '18', borderColor: cat.color + '44' } : {})
              }}
            >
              <span style={styles.icon}>{cat.label.split(' ')[0]}</span>
              <span style={{ ...styles.name, ...(isActive ? { color: cat.color } : {}) }}>
                {cat.label.split(' ').slice(1).join(' ')}
              </span>
              <span style={{ ...styles.count, ...(isActive ? { background: cat.color + '22', color: cat.color } : {}) }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    padding: '8px 8px 0',
    flexShrink: 0,
  },
  label: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.08em',
    color: '#475569',
    padding: '4px 8px 6px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    maxHeight: 200,
    overflowY: 'auto',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 8px',
    borderRadius: 8,
    background: 'transparent',
    border: '1px solid transparent',
    color: '#94a3b8',
    fontSize: 12.5,
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.1s ease',
    cursor: 'pointer',
  },
  active: {
    background: 'rgba(99,102,241,0.12)',
    borderColor: 'rgba(99,102,241,0.3)',
    color: '#f1f5f9',
  },
  icon: { fontSize: 14, flexShrink: 0 },
  name: { flex: 1, fontSize: 12.5 },
  count: {
    fontSize: 11,
    fontWeight: 600,
    background: 'rgba(148,163,184,0.1)',
    color: '#64748b',
    padding: '1px 6px',
    borderRadius: 10,
    minWidth: 22,
    textAlign: 'center',
  },
}
