import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Heatmap from './components/Heatmap'
import MetricCard from './components/MetricCard'
import CommitChart from './components/CommitChart'
import ChurnChart from './components/ChurnChart'
import SkeletonLoader from './components/SkeletonLoader'
import './index.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('gh_token'))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [wsLive, setWsLive] = useState(false)
  const wsRef = useRef(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (t) {
      localStorage.setItem('gh_token', t)
      setToken(t)
      window.history.replaceState({}, '', '/')
    }
  }, [])

  useEffect(() => {
    if (!token) return
    fetchMetrics()
    connectWebSocket()
  }, [token])

  async function fetchMetrics() {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setData(res.data)
    } catch (e) {
      if (e.response?.status === 401) logout()
    } finally {
      setLoading(false)
    }
  }

  function connectWebSocket() {
    const ws = new WebSocket(`ws://localhost:5000`)
    wsRef.current = ws
    ws.onopen = () => { ws.send(JSON.stringify({ token })); setWsLive(true) }
    ws.onmessage = (e) => { const msg = JSON.parse(e.data); if (msg.type === 'refresh') fetchMetrics() }
    ws.onclose = () => setWsLive(false)
    ws.onerror = () => setWsLive(false)
  }

  function logout() {
    localStorage.removeItem('gh_token')
    setToken(null)
    setData(null)
    if (wsRef.current) wsRef.current.close()
  }

  // ── Login page ──
  if (!token) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', position: 'relative',
        background: '#FAF5EF',
      }}>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 20px' }}>

          <div style={{
            width: 72, height: 72, borderRadius: 22, margin: '0 auto 28px',
            background: 'linear-gradient(145deg, #ffffff, #eee4d8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32,
            boxShadow: '8px 8px 24px rgba(180,140,100,0.2), -4px -4px 12px rgba(255,255,255,0.9), inset 0 1px 0 rgba(255,255,255,1)',
          }}>
            ⚡
          </div>

          <h1 style={{
            fontSize: 46, fontWeight: 700, letterSpacing: '-2px',
            color: '#1a1a1a', marginBottom: 12,
          }}>
            DevPulse
          </h1>
          <p style={{ color: 'rgba(0,0,0,0.4)', fontSize: 16, marginBottom: 44, fontWeight: 400, lineHeight: 1.6 }}>
            Your GitHub activity, beautifully visualised.<br />Real-time · Cached · Live.
          </p>

          <a href={`${API}/auth/login`} className="login-btn">
            Login with GitHub
          </a>

          <div style={{ marginTop: 52, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: '⚡', label: 'WebSocket live updates' },
              { icon: '🗄️', label: 'Redis cached' },
              { icon: '📊', label: 'Commit heatmap' },
              { icon: '🔥', label: 'Streak tracker' },
            ].map(f => (
              <div key={f.label} className="clay-card" style={{
                padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, color: 'rgba(0,0,0,0.55)', fontWeight: 500,
              }}>
                <span>{f.icon}</span> {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Skeleton loader ──
  if (loading || !data) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAF5EF', position: 'relative' }}>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SkeletonLoader />
        </div>
      </div>
    )
  }

  const { user, metrics } = data

  // ── Dashboard ──
  return (
    <div style={{ minHeight: '100vh', background: '#FAF5EF', position: 'relative' }}>
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div style={{
        position: 'relative', zIndex: 1, maxWidth: 960, margin: '0 auto',
        padding: 'clamp(20px, 4vw, 36px) clamp(16px, 4vw, 20px) 60px',
      }}>

        {/* Nav */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 40,
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', color: '#1a1a1a' }}>
              DevPulse
            </span>
            <span className="tag">Beta</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src={user.avatar}
                alt="avatar"
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.9)',
                  boxShadow: '0 2px 8px rgba(180,140,100,0.2)',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', lineHeight: 1 }}>
                  {user.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {wsLive
                    ? <div className="live-dot" />
                    : <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(0,0,0,0.2)' }} />
                  }
                  <span style={{
                    fontSize: 11, fontWeight: 500, lineHeight: 1,
                    color: wsLive ? '#1a7a35' : 'rgba(0,0,0,0.35)',
                  }}>
                    {wsLive ? 'Live' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{
            fontSize: 'clamp(20px, 4vw, 30px)',
            fontWeight: 700, letterSpacing: '-1px',
            color: '#1a1a1a', marginBottom: 6,
          }}>
            Good to see you, {user.name} 👋
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)', fontWeight: 400 }}>
            Here's your GitHub pulse — last 90 days
          </p>
        </div>

        {/* Metric cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14, marginBottom: 20,
        }}>
          <MetricCard label="Total commits" value={metrics.totalCommits} colorClass="metric-value-green" icon="📦" />
          <MetricCard label="Current streak" value={`${metrics.streak}d`} colorClass="metric-value-orange" icon="🔥" />
          <MetricCard label="Active repos" value={metrics.activeRepos} colorClass="metric-value-purple" icon="🗂️" />
          <MetricCard label="Top repo" value={metrics.topRepo || '—'} colorClass="metric-value" icon="⭐" />
        </div>

        {/* Heatmap */}
        <div className="glass-card heatmap-wrapper" style={{ padding: '24px 28px', marginBottom: 20, position: 'relative' }}>
          <div className="section-title">Commit activity</div>
          <Heatmap heatmap={metrics.heatmap} />
        </div>

        {/* Code churn — only shows when GitHub has computed the stats */}
        {metrics.weeklyChurn && Object.keys(metrics.weeklyChurn).length > 0 && (
          <div className="glass-card" style={{ padding: '24px 28px', marginBottom: 20 }}>
            <div className="section-title">Code churn — lines added vs deleted</div>
            <ChurnChart weeklyChurn={metrics.weeklyChurn} />
          </div>
        )}

        {/* Bar chart */}
        <div className="glass-card" style={{ padding: '24px 28px' }}>
          <div className="section-title">Commits per repository</div>
          <CommitChart commitsPerRepo={metrics.commitsPerRepo} />
        </div>

      </div>
    </div>
  )
}