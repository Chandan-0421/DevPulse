export default function MetricCard({ label, value, colorClass = 'metric-value', icon }) {
  const isLong = typeof value === 'string' && value.length > 10

  return (
    <div className="clay-card" style={{ padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{
          fontSize: 11, color: 'rgba(0,0,0,0.4)', fontWeight: 600,
          letterSpacing: '0.06em', textTransform: 'uppercase'
        }}>
          {label}
        </div>
        {icon && (
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>
            {icon}
          </div>
        )}
      </div>
      <div
        className={colorClass}
        title={String(value)}
        style={{
          fontSize: isLong ? 17 : 34,
          fontWeight: 700,
          letterSpacing: isLong ? '-0.3px' : '-1.5px',
          lineHeight: 1.15,
          wordBreak: 'break-word',
        }}
      >
        {value}
      </div>
    </div>
  )
}