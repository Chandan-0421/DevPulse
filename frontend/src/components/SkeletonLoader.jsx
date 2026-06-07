export default function SkeletonLoader() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '36px 20px' }}>

      {/* Nav skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="skeleton" style={{ width: 90, height: 22, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 36, height: 20, borderRadius: 6 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%' }} />
          <div className="skeleton" style={{ width: 90, height: 18, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 70, height: 34, borderRadius: 12 }} />
        </div>
      </div>

      {/* Hero text skeleton */}
      <div style={{ marginBottom: 32 }}>
        <div className="skeleton" style={{ width: 340, height: 32, borderRadius: 10, marginBottom: 10 }} />
        <div className="skeleton" style={{ width: 220, height: 16, borderRadius: 8 }} />
      </div>

      {/* Metric cards skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="clay-card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="skeleton" style={{ width: 80, height: 12, borderRadius: 6 }} />
              <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 10 }} />
            </div>
            <div className="skeleton" style={{ width: '60%', height: 36, borderRadius: 10 }} />
          </div>
        ))}
      </div>

      {/* Heatmap card skeleton */}
      <div className="glass-card" style={{ padding: '24px 28px', marginBottom: 20 }}>
        <div className="skeleton" style={{ width: 120, height: 12, borderRadius: 6, marginBottom: 20 }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {[...Array(90)].map((_, i) => (
            <div key={i} className="skeleton" style={{ width: 13, height: 13, borderRadius: 4, animationDelay: `${i * 0.008}s` }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <div className="skeleton" style={{ width: 160, height: 12, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: 200, height: 12, borderRadius: 6 }} />
        </div>
      </div>

      {/* Bar chart card skeleton */}
      <div className="glass-card" style={{ padding: '24px 28px' }}>
        <div className="skeleton" style={{ width: 160, height: 12, borderRadius: 6, marginBottom: 24 }} />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 200, padding: '0 8px' }}>
          {[85, 70, 68, 50, 38, 36, 30, 22, 18].map((h, i) => (
            <div
              key={i}
              className="skeleton"
              style={{
                flex: 1,
                height: `${h}%`,
                borderRadius: '8px 8px 4px 4px',
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12, padding: '0 8px' }}>
          {[...Array(9)].map((_, i) => (
            <div key={i} className="skeleton" style={{ flex: 1, height: 10, borderRadius: 4, animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
      </div>

    </div>
  )
}