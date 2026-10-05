import { colorAusentismo, fmtPct, fmtHoras } from '../lib/calculoIndicadores'

function Kpi({ valor, label, colorVar }) {
  return (
    <div className="hp-kpi" style={{ borderLeftColor: colorVar }}>
      <p className="hp-kpi-label">{label}</p>
      <p className="hp-kpi-valor" style={{ color: colorVar }}>
        {valor}
      </p>
    </div>
  )
}

// Fila de KPIs de presentismo/horas — la usan Indicadores (por sección) y
// Ficha (individual y grupo), mismo cálculo (lib/calculoIndicadores.js).
export function KpisBloque({ kpis }) {
  return (
    <div className="hp-kpis">
      <Kpi valor={fmtHoras(kpis.hs_esperadas)} label="Hs. esperadas" colorVar="var(--text)" />
      <Kpi valor={fmtHoras(kpis.hs_normales)} label="Hs. trabajadas" colorVar="var(--com)" />
      <Kpi valor={fmtPct(kpis.pctCumplimiento)} label="Cumplimiento" colorVar="var(--com)" />
      <Kpi valor={fmtPct(kpis.pctAusentismo)} label="Ausentismo" colorVar={colorAusentismo(kpis.pctAusentismo)} />
      <Kpi valor={fmtPct(kpis.pctPresentismo)} label="Presentismo (días)" colorVar="var(--green)" />
      <Kpi valor={fmtHoras(kpis.hs_extra50)} label="Extra 50%" colorVar="#7c3aed" />
      <Kpi valor={fmtHoras(kpis.hs_extra100)} label="Extra 100%" colorVar="#dc2626" />
      <Kpi valor={kpis.cantTardanzas} label="Tardanzas" colorVar="var(--amber)" />
      <Kpi valor={fmtPct(kpis.pctPuntualidad)} label="Puntualidad" colorVar="var(--green)" />
    </div>
  )
}
