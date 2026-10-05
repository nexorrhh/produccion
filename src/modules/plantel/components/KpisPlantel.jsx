function Kpi({ valor, label, sub, colorVar }) {
  return (
    <div className="pl-kpi" style={{ borderLeftColor: colorVar }}>
      <p className="pl-kpi-label">{label}</p>
      <p className="pl-kpi-valor" style={{ color: colorVar }}>
        {valor}
      </p>
      <p className="pl-kpi-sub">{sub}</p>
    </div>
  )
}

export function KpisPlantel({ total, cimomet, comoing, mensuales, quincenales, sinClasificar }) {
  return (
    <div className="pl-kpis">
      <Kpi valor={total} label="Plantel activo" sub="total" colorVar="var(--text)" />
      <Kpi valor={cimomet} label="Cimomet S.A." sub="personas" colorVar="var(--cim)" />
      <Kpi valor={comoing} label="Co.mo.ing S.R.L." sub="personas" colorVar="var(--com)" />
      <Kpi valor={mensuales} label="Mensuales" sub="personas" colorVar="#7c3aed" />
      <Kpi valor={quincenales} label="Quincenales" sub="personas" colorVar="var(--amber)" />
      {sinClasificar > 0 && <Kpi valor={sinClasificar} label="Sin clasificar" sub="a definir" colorVar="var(--red)" />}
    </div>
  )
}
