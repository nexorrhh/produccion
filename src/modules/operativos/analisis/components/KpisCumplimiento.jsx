function Kpi({ valor, label, sub, colorVar }) {
  return (
    <div className="an-kpi" style={{ borderLeftColor: colorVar }}>
      <p className="an-kpi-label">{label}</p>
      <p className="an-kpi-valor" style={{ color: colorVar }}>
        {valor}
      </p>
      <p className="an-kpi-sub">{sub}</p>
    </div>
  )
}

export function KpisCumplimiento({
  totalOperativos,
  cantSabados,
  cantDomFer,
  totalConvocatorias,
  totalPresentes,
  totalAusentes,
  totalNoConvocados,
  pctGlobal,
}) {
  const colorGlobal = pctGlobal >= 80 ? 'var(--green)' : pctGlobal >= 60 ? 'var(--amber)' : 'var(--red)'

  return (
    <div className="an-kpis">
      <Kpi valor={totalOperativos} label="Operativos" sub={`${cantSabados} sáb. · ${cantDomFer} dom/fer.`} colorVar="#7c3aed" />
      <Kpi valor={totalConvocatorias} label="Convocatorias" sub="total acumulado" colorVar="var(--com)" />
      <Kpi valor={totalPresentes} label="Presentes" sub="total acumulado" colorVar="var(--green)" />
      <Kpi valor={totalAusentes} label="Ausentes" sub="total acumulado" colorVar="var(--red)" />
      <Kpi valor={totalNoConvocados} label="No convocados" sub="vinieron sin citar" colorVar="var(--amber)" />
      <Kpi valor={pctGlobal + '%'} label="Cumplimiento global" sub="presentes / convocados" colorVar={colorGlobal} />
    </div>
  )
}
