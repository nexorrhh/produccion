import { useState } from 'react'
import { AgregarPuestoInline } from './AgregarPuestoInline'

function fmtFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR')
}

export function MatrizPersonaPanel({
  fila,
  filasDetalle,
  puestos,
  niveles,
  onCerrar,
  onCrearPuesto,
  onAgregarPuesto,
  onCambiarNivel,
  onQuitarPuesto,
  onConfirmarVigencia,
}) {
  const [ocupado, setOcupado] = useState(false)
  const { empleado, estado } = fila

  const yaAsignados = new Set(filasDetalle.map((d) => d.puesto_id))

  async function handleConfirmar() {
    setOcupado(true)
    try {
      await onConfirmarVigencia()
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="pv-overlay" onClick={onCerrar}>
      <div className="pv-panel" onClick={(e) => e.stopPropagation()}>
        <div className="pv-panel-header">
          <div>
            <div className="pv-panel-nombre">{empleado.apellido_y_nombre}</div>
            <div className="pv-panel-sub">
              Legajo {empleado.legajo} · {empleado.empresa === 'CIMOMET' ? 'Cimomet' : 'Co.mo.ing'} ·{' '}
              {empleado.desc_puesto || '—'}
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onCerrar}>
            Cerrar
          </button>
        </div>

        <div className="pv-panel-estado">
          <span className={'pv-estado-badge pv-' + estado.estado}>{estado.label}</span>
          <span className="pv-panel-fecha">Última confirmación: {fmtFecha(fila.persona?.fecha_confirmacion)}</span>
          <button className="btn btn-green" onClick={handleConfirmar} disabled={ocupado}>
            {ocupado ? 'Confirmando…' : 'Confirmar vigencia'}
          </button>
        </div>

        <div className="pv-panel-lista">
          {filasDetalle.length === 0 && (
            <div className="pv-vacio">Todavía no tiene puestos/tareas asignados.</div>
          )}
          {filasDetalle.map((d) => (
            <div className="pv-detalle-fila" key={d.id}>
              <span className="pv-detalle-puesto">{d.puestoNombre}</span>
              <select value={d.nivel_id} onChange={(e) => onCambiarNivel(d.id, e.target.value)}>
                {niveles.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.nombre}
                  </option>
                ))}
              </select>
              <button className="btn btn-ghost" onClick={() => onQuitarPuesto(d.id)}>
                Quitar
              </button>
            </div>
          ))}
        </div>

        <AgregarPuestoInline
          puestos={puestos}
          niveles={niveles}
          yaAsignados={yaAsignados}
          onCrearPuesto={onCrearPuesto}
          onAgregar={onAgregarPuesto}
        />
      </div>
    </div>
  )
}
