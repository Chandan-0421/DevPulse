import { useState, useRef } from 'react'

export default function Heatmap({ heatmap, peakDay }) {
  const [tooltip, setTooltip] = useState(null)
  const wrapperRef = useRef(null)

  const days = []
  const today = new Date()

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days.push({ date: key, count: heatmap[key] || 0 })
  }

  function getColor(count) {
    if (count === 0) return 'rgba(0,0,0,0.07)'
    if (count <= 2) return 'rgba(26, 122, 53, 0.3)'
    if (count <= 5) return 'rgba(26, 122, 53, 0.55)'
    if (count <= 9) return 'rgba(26, 122, 53, 0.8)'
    return '#1a7a35'
  }

  function getGlow(count) {
    if (count <= 2) return 'none'
    if (count <= 5) return '0 0 5px rgba(26,122,53,0.25)'
    return '0 0 8px rgba(26,122,53,0.45)'
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function handleMouseEnter(e, date, count) {
    if (!wrapperRef.current) return
    const cellRect = e.currentTarget.getBoundingClientRect()
    const wrapperRect = wrapperRef.current.getBoundingClientRect()

    const tooltipWidth = 170
    const tooltipHeight = 68

    // X: position relative to wrapper, flip left if near right edge
    let x = cellRect.left - wrapperRect.left
    if (x + tooltipWidth > wrapperRect.width) {
      x = wrapperRect.width - tooltipWidth - 4
    }
    if (x < 0) x = 0

    // Y: above the cell, flip below if near top
    let y = cellRect.top - wrapperRect.top - tooltipHeight - 8
    if (y < 0) {
      y = cellRect.top - wrapperRect.top + 20
    }

    setTooltip({ date, count, x, y })
  }

  const totalCommits = Object.values(heatmap).reduce((a, b) => a + b, 0)

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {days.map(({ date, count }) => (
          <div
            key={date}
            className="heatmap-cell"
            style={{ background: getColor(count), boxShadow: getGlow(count) }}
            onMouseEnter={(e) => handleMouseEnter(e, date, count)}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: tooltip.x,
          top: tooltip.y,
          background: 'rgba(255,255,255,0.98)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 12,
          padding: '10px 14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          pointerEvents: 'none',
          zIndex: 100,
          width: 170,
        }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a', marginBottom: 5 }}>
            {formatDate(tooltip.date)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 10, height: 10, borderRadius: 3, flexShrink: 0,
              background: tooltip.count > 0 ? '#1a7a35' : 'rgba(0,0,0,0.1)',
            }} />
            <span style={{ fontSize: 12, color: '#555' }}>
              {tooltip.count} commit{tooltip.count !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 6 }}>
        <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)' }}>
          {totalCommits} commits · last 90 days
        </span>
        {peakDay && (
          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)' }}>
            peak daily commits: {peakDay.count} on {formatDate(peakDay.date)}
          </span>
        )}
      </div>
    </div>
  )
}