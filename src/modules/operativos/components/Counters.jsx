export function Counters({ citados, quincenal, mensual, sinClasificar, manana, tarde }) {
  return (
    <div className="op-counters">
      <div className="op-counter citados">
        <div className="op-counter-val">{citados}</div>
        <div className="op-counter-label">Citados</div>
      </div>
      <div className="op-counter quincenal">
        <div className="op-counter-val">{quincenal}</div>
        <div className="op-counter-label">Quincenal</div>
      </div>
      <div className="op-counter mensual">
        <div className="op-counter-val">{mensual}</div>
        <div className="op-counter-label">Mensual</div>
      </div>
      <div className="op-counter sinclasificar">
        <div className="op-counter-val">{sinClasificar}</div>
        <div className="op-counter-label">Sin clasif.</div>
      </div>
      <div className="op-counter manana">
        <div className="op-counter-val">{manana}</div>
        <div className="op-counter-label">07 a 12</div>
      </div>
      <div className="op-counter tarde">
        <div className="op-counter-val">{tarde}</div>
        <div className="op-counter-label">12 a 16</div>
      </div>
    </div>
  )
}
