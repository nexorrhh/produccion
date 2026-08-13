import { Counters } from './Counters'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function diaDeFecha(fecha) {
  if (!fecha) return '—'
  const d = new Date(fecha + 'T00:00:00')
  return DIAS[d.getDay()]
}

// Solo dos tipos: Sábado (si el día cae sábado) o Feriado (cualquier otro
// día). No es un valor que el usuario elija — se deriva de la fecha, así
// no puede quedar desalineado con el día real.
export function tipoSugerido(fecha) {
  if (!fecha) return 'Feriado'
  const diaIdx = new Date(fecha + 'T00:00:00').getDay()
  return diaIdx === 6 ? 'Sabado' : 'Feriado'
}

function tipoLabel(tipo) {
  return tipo === 'Sabado' ? 'Sábado' : 'Feriado'
}

export function SetupBar({ fecha, onFechaChange, tipo, dia, counters }) {
  return (
    <div className="op-setup">
      <div className="op-setup-grid">
        <div className="op-field">
          <label>Fecha del operativo</label>
          <input type="date" value={fecha} onChange={(e) => onFechaChange(e.target.value)} />
        </div>
        <div className="op-field">
          <label>Tipo</label>
          <div className="op-day-label">{tipoLabel(tipo)}</div>
        </div>
        <div className="op-field">
          <label>Día</label>
          <div className="op-day-label">{dia}</div>
        </div>
        <Counters {...counters} />
      </div>
    </div>
  )
}
