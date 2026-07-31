function colorPct(pct) {
  return pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--amber)' : 'var(--red)'
}

// Barra de % de cumplimiento con una tarjeta al pasar el mouse (CSS puro,
// sin estado de React) que desglosa de dónde sale ese número. Se usa en
// Operativos > Citar y en las dos tablas de Análisis.
export function CumplimientoBarra({ pct, presentes, ausentes, noConvocados, totalLabel, total, tituloContexto }) {
  const color = colorPct(pct)
  return (
    <div className="cmp-tooltip-wrap">
      <div className="op-cmp-bar">
        <div className="op-cmp-track">
          <div className="op-cmp-fill" style={{ width: pct + '%', background: color }} />
        </div>
        <span className="op-cmp-pct" style={{ color }}>
          {pct}%
        </span>
      </div>

      <div className="cmp-tooltip-card">
        {tituloContexto && <div className="cmp-tooltip-header">{tituloContexto}</div>}
        <div className="cmp-tooltip-row">
          <span className="cmp-dot cmp-dot-verde" />
          Presentes
          <b>{presentes}</b>
        </div>
        <div className="cmp-tooltip-row">
          <span className="cmp-dot cmp-dot-rojo" />
          Ausentes
          <b>{ausentes}</b>
        </div>
        <div className="cmp-tooltip-row">
          <span className="cmp-dot cmp-dot-gris" />
          Sin ser convocados
          <b>{noConvocados}</b>
        </div>
        <div className="cmp-tooltip-divider" />
        <div className="cmp-tooltip-total">
          {totalLabel}
          <b>{total}</b>
        </div>
      </div>
    </div>
  )
}
