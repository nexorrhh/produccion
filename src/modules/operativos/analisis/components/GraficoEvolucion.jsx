import { useMemo, useState } from 'react'
import { fmtFechaCorta } from '../lib/formatoFecha'

const W = 640
const H = 220
const PAD_L = 34
const PAD_R = 12
const PAD_T = 14
const PAD_B = 26
const LINE_COLOR = '#2563eb' // var(--com)

export function GraficoEvolucion({ datos }) {
  const [hoverIdx, setHoverIdx] = useState(null)

  const ordenados = useMemo(() => [...datos].sort((a, b) => a.fecha.localeCompare(b.fecha)), [datos])

  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B

  const puntos = ordenados.map((d, i) => {
    const x = ordenados.length > 1 ? PAD_L + (i / (ordenados.length - 1)) * innerW : PAD_L + innerW / 2
    const y = PAD_T + innerH - (Math.min(100, Math.max(0, d.pct)) / 100) * innerH
    return { ...d, x, y }
  })

  const pathD = puntos.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')
  const areaD = puntos.length
    ? pathD + ` L${puntos[puntos.length - 1].x.toFixed(1)},${PAD_T + innerH} L${puntos[0].x.toFixed(1)},${PAD_T + innerH} Z`
    : ''

  const pasoLabel = Math.max(1, Math.ceil(puntos.length / 8))

  if (!ordenados.length) {
    return <div className="an-vacio">No hay operativos registrados para graficar.</div>
  }

  function handleMove(e) {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const xRel = ((e.clientX - rect.left) / rect.width) * W
    let mejor = 0
    let mejorDist = Infinity
    puntos.forEach((p, i) => {
      const d = Math.abs(p.x - xRel)
      if (d < mejorDist) {
        mejorDist = d
        mejor = i
      }
    })
    setHoverIdx(mejor)
  }

  const hover = hoverIdx !== null ? puntos[hoverIdx] : null

  return (
    <div className="an-grafico-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="an-grafico-svg"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {[0, 25, 50, 75, 100].map((v) => {
          const y = PAD_T + innerH - (v / 100) * innerH
          return (
            <g key={v}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} className="an-grid-line" />
              <text x={PAD_L - 6} y={y + 3} textAnchor="end" className="an-axis-label">
                {v}%
              </text>
            </g>
          )
        })}

        {puntos.map((p, i) =>
          i % pasoLabel === 0 ? (
            <text key={'l' + i} x={p.x} y={H - 6} textAnchor="middle" className="an-axis-label">
              {fmtFechaCorta(p.fecha)}
            </text>
          ) : null
        )}

        <path d={areaD} className="an-area" />
        <path d={pathD} className="an-linea" />

        {puntos.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === hoverIdx ? 5 : 3} className="an-punto" />
        ))}

        {hover && <line x1={hover.x} x2={hover.x} y1={PAD_T} y2={PAD_T + innerH} className="an-crosshair" />}
      </svg>

      {hover && (
        <div
          className="an-tooltip"
          style={{ left: (hover.x / W) * 100 + '%', top: (hover.y / H) * 100 + '%' }}
        >
          <div className="an-tooltip-fecha">{fmtFechaCorta(hover.fecha)}</div>
          <div className="an-tooltip-pct">{Math.round(hover.pct)}% cumplimiento</div>
        </div>
      )}
    </div>
  )
}
