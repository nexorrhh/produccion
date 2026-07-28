import { Counters } from './Counters'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function diaDeFecha(fecha) {
  if (!fecha) return '—'
  const d = new Date(fecha + 'T00:00:00')
  return DIAS[d.getDay()]
}

export function tipoSugerido(fecha) {
  if (!fecha) return 'Feriado'
  const diaIdx = new Date(fecha + 'T00:00:00').getDay()
  if (diaIdx === 6) return 'Sabado'
  if (diaIdx === 0) return 'Domingo'
  return 'Feriado'
}

export function SetupBar({ fecha, onFechaChange, tipo, onTipoChange, dia, counters }) {
  return (
    <div className="op-setup">
      <div className="op-setup-grid">
        <div className="op-field">
          <label>Fecha del operativo</label>
          <input type="date" value={fecha} onChange={(e) => onFechaChange(e.target.value)} />
        </div>
        <div className="op-field">
          <label>Tipo</label>
          <select value={tipo} onChange={(e) => onTipoChange(e.target.value)}>
            <option value="Sabado">Sábado</option>
            <option value="Domingo">Domingo</option>
            <option value="Feriado">Feriado</option>
          </select>
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
