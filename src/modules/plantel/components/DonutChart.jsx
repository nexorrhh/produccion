const R = 70
const STROKE = 26
const C = 2 * Math.PI * R
const SIZE = (R + STROKE) * 2

// Dona genérica (segmentos = [{ key, label, color, valor }]), misma técnica
// que GraficoAsistencia.jsx de Operativos pero reutilizable para cualquier
// set de categorías — cada módulo mantiene su propia copia a propósito
// (CLAUDE.md, sección 6: no acoplar un módulo a componentes de otro).
export function DonutChart({ segmentos, totalLabel = 'personas' }) {
  const total = segmentos.reduce((s, x) => s + x.valor, 0)

  if (!total) {
    return <div className="pl-vacio">Sin datos para graficar.</div>
  }

  let acumulado = 0
  const arcos = segmentos.map((s) => {
    const frac = s.valor / total
    const dash = frac * C
    const offset = -acumulado * C
    acumulado += frac
    return { ...s, dash, offset }
  })

  return (
    <div className="pl-dona-wrap">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="pl-dona-svg" width={SIZE} height={SIZE}>
        <g transform={`translate(${SIZE / 2},${SIZE / 2}) rotate(-90)`}>
          <circle r={R} fill="none" stroke="var(--bg-soft)" strokeWidth={STROKE} />
          {arcos.map(
            (a) =>
              a.valor > 0 && (
                <circle
                  key={a.key}
                  r={R}
                  fill="none"
                  stroke={a.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${a.dash} ${C - a.dash}`}
                  strokeDashoffset={a.offset}
                />
              )
          )}
        </g>
        <text x={SIZE / 2} y={SIZE / 2 - 4} textAnchor="middle" className="pl-dona-total">
          {total}
        </text>
        <text x={SIZE / 2} y={SIZE / 2 + 16} textAnchor="middle" className="pl-dona-total-label">
          {totalLabel}
        </text>
      </svg>

      <div className="pl-dona-leyenda">
        {arcos.map((a) => (
          <div className="pl-dona-item" key={a.key}>
            <span className="pl-dona-dot" style={{ background: a.color }} />
            <span>{a.label}</span>
            <b>{a.valor}</b>
            <span className="pl-dona-pct">{Math.round((a.valor / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
