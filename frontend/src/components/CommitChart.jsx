import { useEffect, useRef } from 'react'
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip)

export default function CommitChart({ commitsPerRepo }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    const entries = Object.entries(commitsPerRepo).sort((a, b) => b[1] - a[1])
    const labels = entries.map(([repo]) => repo)
    const values = entries.map(([, count]) => count)

    if (chartRef.current) chartRef.current.destroy()

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: values.map((_, i) =>
            i === 0
              ? 'rgba(26, 122, 53, 0.85)'
              : `rgba(26, 122, 53, ${Math.max(0.2, 0.6 - i * 0.05)})`
          ),
          borderRadius: 10,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderColor: 'rgba(0,0,0,0.08)',
            borderWidth: 1,
            titleColor: '#1a1a1a',
            bodyColor: '#555',
            padding: 10,
            cornerRadius: 10,
            callbacks: {
              label: ctx => ` ${ctx.raw} commits`,
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: 'rgba(0,0,0,0.3)', font: { size: 11 } },
            grid: { color: 'rgba(0,0,0,0.05)' },
            border: { display: false },
          },
          x: {
            ticks: {
              color: 'rgba(0,0,0,0.4)',
              font: { size: 10 },
              maxRotation: 35,
              minRotation: 35,
              callback: function(val) {
                const label = this.getLabelForValue(val)
                return label.length > 14 ? label.slice(0, 14) + '…' : label
              }
            },
            grid: { display: false },
            border: { display: false },
          }
        },
      },
    })

    return () => chartRef.current?.destroy()
  }, [commitsPerRepo])

  return (
    <div style={{ position: 'relative', height: 260 }}>
      <canvas ref={canvasRef} />
    </div>
  )
}