import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { tipoPago } from './clasificacion'
import { TIPOS_PUESTO } from './tiposPuesto'

function turnoDe(d) {
  return d.turno_manana && d.turno_tarde ? 'Ambos' : d.turno_manana ? '07-12' : d.turno_tarde ? '12-16' : '—'
}

function fmtFechaLarga(fecha) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const COLUMNAS = ['Legajo', 'Apellido y nombre', 'Empresa', 'Puesto', 'Turno', 'Nº OT', 'Trabajo']

function filaDe(d) {
  return [
    d.legajo,
    d.apellido_y_nombre,
    d.empresa === 'CIMOMET' ? 'Cimomet' : 'Comoing',
    d.desc_puesto || '—',
    turnoDe(d),
    d.ot || 'Sin OT',
    d.trabajo || '',
  ]
}

// Mismo layout pactado que la planilla en blanco (PlanillaImprimible.jsx):
// quincenales a la izquierda, mensuales a la derecha, todo en una sola
// hoja A4 — no es negociable, es el formato que se manda por mail.
export function generarPdfListadoConvocados({ fecha, dia, tipo, detalle, mapaClasif }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 10
  const gap = 6
  const colWidth = (pageWidth - margin * 2 - gap) / 2
  const xIzq = margin
  const xDer = margin + colWidth + gap
  const startY = 34

  doc.setFontSize(9)
  doc.setFont(undefined, 'bold')
  doc.text('CIMOMET S.A. & CO.MO.ING S.R.L.', pageWidth / 2, 12, { align: 'center' })

  doc.setFontSize(15)
  doc.text('Listado de convocados', pageWidth / 2, 19, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  const tipoLabel = tipo === 'Sabado' ? 'Sábado' : tipo
  const cantidad = detalle.length + ' persona' + (detalle.length === 1 ? '' : 's')
  doc.text(`${fmtFechaLarga(fecha)} · ${dia} · ${tipoLabel} · ${cantidad}`, pageWidth / 2, 25, { align: 'center' })

  doc.setDrawColor(15, 23, 42)
  doc.line(margin, 28, pageWidth - margin, 28)

  // Dibuja una columna (grupo) en x/ancho dados y devuelve el Y donde
  // terminó, para poder ubicar debajo cualquier grupo extra (sin_asignar).
  function dibujarColumna(x, ancho, grupo) {
    if (!grupo || !grupo.items.length) return startY

    doc.setFontSize(9.5)
    doc.setFont(undefined, 'bold')
    doc.text(grupo.labelPlural.toUpperCase() + ' (' + grupo.items.length + ')', x, startY)

    autoTable(doc, {
      startY: startY + 2,
      margin: { left: x, right: pageWidth - (x + ancho) },
      tableWidth: ancho,
      head: [COLUMNAS],
      body: grupo.items.map(filaDe),
      styles: { fontSize: 6.5, cellPadding: 0.8, overflow: 'ellipsize' },
      headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold', fontSize: 6 },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: ancho * 0.3 },
        2: { cellWidth: ancho * 0.14 },
        3: { cellWidth: ancho * 0.22 },
        4: { cellWidth: 9 },
        5: { cellWidth: 8 },
        6: { cellWidth: 'auto' },
      },
    })

    return doc.lastAutoTable.finalY
  }

  const grupos = TIPOS_PUESTO.map((t) => ({
    ...t,
    items: detalle.filter((d) => tipoPago(d, mapaClasif) === t.key),
  })).filter((g) => g.items.length)

  const grupoQuincenal = grupos.find((g) => g.key === 'quincenal')
  const grupoMensual = grupos.find((g) => g.key === 'mensual')
  const grupoSinAsignar = grupos.find((g) => g.key === 'sin_asignar')

  const finIzq = dibujarColumna(xIzq, colWidth, grupoQuincenal)
  const finDer = dibujarColumna(xDer, colWidth, grupoMensual)

  // "Sin clasificar" no debería pasar en la práctica (todo puesto activo
  // ya tiene tipo de pago asignado), pero si aparece se agrega abajo, a
  // todo el ancho, para no perder gente del listado en silencio.
  if (grupoSinAsignar) {
    const y = Math.max(finIzq, finDer) + 8
    doc.setFontSize(9.5)
    doc.setFont(undefined, 'bold')
    doc.text(grupoSinAsignar.labelPlural.toUpperCase() + ' (' + grupoSinAsignar.items.length + ')', margin, y)
    autoTable(doc, {
      startY: y + 2,
      margin: { left: margin, right: margin },
      head: [COLUMNAS],
      body: grupoSinAsignar.items.map(filaDe),
      styles: { fontSize: 7.5, cellPadding: 1 },
      headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold' },
    })
  }

  // base64 puro (sin el prefijo "data:application/pdf;filename=...;base64,")
  return doc.output('datauristring').split(',')[1]
}
