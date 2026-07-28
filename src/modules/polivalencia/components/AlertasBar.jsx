export function AlertasBar({ vencidas, pendientesNuevas }) {
  if (!vencidas && !pendientesNuevas) {
    return (
      <div className="pv-alertas pv-alertas-ok">
        Toda la polivalencia del personal activo está al día.
      </div>
    )
  }

  return (
    <div className="pv-alertas">
      {vencidas > 0 && (
        <span className="pv-alerta-chip pv-alerta-vencida">
          {vencidas} vencida{vencidas > 1 ? 's' : ''}
        </span>
      )}
      {pendientesNuevas > 0 && (
        <span className="pv-alerta-chip pv-alerta-nueva">
          {pendientesNuevas} nueva{pendientesNuevas > 1 ? 's' : ''} — pendiente
        </span>
      )}
    </div>
  )
}
