import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { tipoPago } from '../lib/clasificacion'
import { TIPOS_PUESTO } from '../lib/tiposPuesto'

// Solo quincenal/mensual — el "sin clasificar" no aplica acá (pedido del
// usuario: planilla en papel para que el supervisor tilde en el campo).
const GRUPOS_PLANILLA = TIPOS_PUESTO.filter((t) => t.key !== 'sin_asignar')

function armarGrupos(empleados, mapaClasif) {
  return GRUPOS_PLANILLA.map((t) => ({
    ...t,
    items: [...empleados]
      .filter((e) => tipoPago(e, mapaClasif) === t.key)
      .sort((a, b) => (a.apellido_y_nombre || '').localeCompare(b.apellido_y_nombre || '')),
  })).filter((g) => g.items.length)
}

function Columna({ grupo }) {
  if (!grupo) return null
  return (
    <table className="op-print-tabla">
      <thead>
        <tr>
          <th className="op-print-th-casilla"></th>
          <th>Legajo</th>
          <th>Apellido y nombre</th>
          <th>Empresa</th>
          <th>Puesto</th>
        </tr>
      </thead>
      <tbody>
        <tr className="op-print-grupo-fila">
          <td colSpan={5}>
            {grupo.labelPlural} ({grupo.items.length})
          </td>
        </tr>
        {grupo.items.map((e) => (
          <tr key={e.legajo + '|' + e.empresa}>
            <td className="op-print-td-casilla">
              <span className="op-print-casilla" />
            </td>
            <td>{e.legajo}</td>
            <td>{e.apellido_y_nombre}</td>
            <td>{e.empresa === 'CIMOMET' ? 'Cimomet' : 'Comoing'}</td>
            <td>{e.desc_puesto || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// Portal a document.body + window.print(), mismo patrón que el listado de
// convocados de DetalleOperativoModal.jsx: se monta solo mientras se
// imprime y se desmonta solo en "afterprint" (evita que dos vistas
// imprimibles queden montadas juntas a la vez).
export function PlanillaImprimible({ empleados, mapaClasif, onListo }) {
  useEffect(() => {
    function handleAfterPrint() {
      onListo()
    }
    window.addEventListener('afterprint', handleAfterPrint)
    const id = setTimeout(() => window.print(), 50)
    return () => {
      clearTimeout(id)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [onListo])

  const grupos = useMemo(() => armarGrupos(empleados, mapaClasif), [empleados, mapaClasif])
  const grupoQuincenal = grupos.find((g) => g.key === 'quincenal')
  const grupoMensual = grupos.find((g) => g.key === 'mensual')

  return createPortal(
    <div className="op-print-only">
      <div className="op-print-header">
        <div className="op-print-empresa">Cimomet S.A. &amp; Co.mo.ing S.R.L.</div>
        <h1>Planilla para citar</h1>
        <div className="op-print-sub">Personal quincenal y mensual activo — para completar a mano en planta</div>
      </div>

      <div className="op-print-columnas">
        <div className="op-print-columna">
          <Columna grupo={grupoQuincenal} />
        </div>
        <div className="op-print-columna">
          <Columna grupo={grupoMensual} />
        </div>
      </div>
    </div>,
    document.body
  )
}
