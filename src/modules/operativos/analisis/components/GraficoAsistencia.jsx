// Colores validados con la skill dataviz (scripts/validate_palette.js,
// triplete de las 3 primeras posiciones de la paleta categórica — pasan
// todos los chequeos CVD en modo "all pairs"). La identidad nunca depende
// solo del color: cada porción tiene su etiqueta de texto en la leyenda.
const SEGMENTOS = [
  { key: 'presentes', label: 'Presentes', color: '#1baf7a' },
  { key: 'ausentes', label: 'Ausentes', color: '#eb6834' },
  { key: 'noConvocados', label: 'No convocados', color: '#2a78d6' },
]

const R = 70
const STROKE = 26
const C = 2 * Math.PI * R
const SIZE = (R + STROKE) * 2

export function GraficoAsistencia({ presentes, ausentes, noConvocados }) {
  const valores = { presentes, ausentes, noConvocados }
  const total = presentes + ausentes + noConvocados

  if (!total) {
    return <div className="an-vacio">Todavía no hay asistencia registrada.</div>
  }

  let acumulado = 0
  const arcos = SEGMENTOS.map((s) => {
    const valor = valores[s.key]
    const frac = valor / total
    const dash = frac * C
    const offset = -acumulado * C
    acumulado += frac
    return { ...s, valor, dash, offset }
  })

  return (
    <div className="an-dona-wrap">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="an-dona-svg" width={SIZE} height={SIZE}>
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
        <text x={SIZE / 2} y={SIZE / 2 - 4} textAnchor="middle" className="an-dona-total">
          {total}
        </text>
        <text x={SIZE / 2} y={SIZE / 2 + 16} textAnchor="middle" className="an-dona-total-label">
          personas
        </text>
      </svg>

      <div className="an-dona-leyenda">
        {arcos.map((a) => (
          <div className="an-dona-item" key={a.key}>
            <span className="an-dona-dot" style={{ background: a.color }} />
            <span>{a.label}</span>
            <b>{a.valor}</b>
          </div>
        ))}
      </div>
    </div>
  )
}
