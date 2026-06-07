import { useEffect, useRef } from 'react'
import {
  Chart, LineController, LineElement, PointElement,
  CategoryScale, LinearScale, Tooltip, Filler
} from 'chart.js'

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler)

export default function ChurnChart({ weeklyChurn }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!weeklyChurn || Object.keys(weeklyChurn).length === 0) return

    // Sort by date, take last 12 weeks
    const sorted = Object.entries(weeklyChurn)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-12)

    const labels = sorted.map(([date]) => {
      const d = new Date(date)
      return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`
    })

    const added = sorted.map(([, v]) => v.added)
    const deleted = sorted.map(([, v]) => v.deleted)

    if (chartRef.current) chartRef.current.destroy()

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Lines added',
            data: added,
            borderColor: '#1a7a35',
            backgroundColor: 'rgba(26, 122, 53, 0.08)',
            borderWidth: 2.5,
            pointBackgroundColor: '#1a7a35',
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Lines deleted',
            data: deleted,
            borderColor: '#cf222e',
            backgroundColor: 'rgba(207, 34, 46, 0.06)',
            borderWidth: 2.5,
            pointBackgroundColor: '#cf222e',
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: 'rgba(0,0,0,0.5)',
              font: { size: 11, weight: '500' },
              boxWidth: 10,
              boxHeight: 10,
              borderRadius: 3,
              useBorderRadius: true,
              padding: 16,
            }
          },
          tooltip: {
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderColor: 'rgba(0,0,0,0.08)',
            borderWidth: 1,
            titleColor: '#1a1a1a',
            bodyColor: '#555',
            padding: 12,
            cornerRadius: 12,
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${ctx.raw.toLocaleString()} lines`,
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: 'rgba(0,0,0,0.3)',
              font: { size: 11 },
              callback: v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v,
            },
            grid: { color: 'rgba(0,0,0,0.05)' },
            border: { display: false },
          },
          x: {
            ticks: {
              color: 'rgba(0,0,0,0.4)',
              font: { size: 11 },
            },
            grid: { display: false },
            border: { display: false },
          }
        },
      },
    })

    return () => chartRef.current?.destroy()
  }, [weeklyChurn])

  if (!weeklyChurn || Object.keys(weeklyChurn).length === 0) {
    return (
      <div style={{
        height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(0,0,0,0.3)', fontSize: 13,
      }}>
        No churn data available for these repos yet
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', height: 240 }}>
      <canvas ref={canvasRef} />
    </div>
  )
}