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

// Mismo agrupamiento (Quincenal/Mensual/Sin clasificar) y mismas columnas
// que la vista imprimible de DetalleOperativoModal.jsx — acá se genera en
// PDF (en vez de vía window.print()) para poder adjuntarlo al mail que se
// manda al guardar la citación.
export function generarPdfListadoConvocados({ fecha, dia, tipo, detalle, mapaClasif }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 10

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

  let y = 34
  const grupos = TIPOS_PUESTO.map((t) => ({
    ...t,
    items: detalle.filter((d) => tipoPago(d, mapaClasif) === t.key),
  })).filter((g) => g.items.length)

  grupos.forEach((g) => {
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text(g.labelPlural.toUpperCase() + ' (' + g.items.length + ')', margin, y)

    autoTable(doc, {
      startY: y + 2,
      margin: { left: margin, right: margin },
      head: [['Legajo', 'Apellido y nombre', 'Empresa', 'Puesto', 'Turno', 'Nº OT', 'Trabajo']],
      body: g.items.map((d) => [
        d.legajo,
        d.apellido_y_nombre,
        d.empresa === 'CIMOMET' ? 'Cimomet' : 'Co.mo.ing',
        d.desc_puesto || '—',
        turnoDe(d),
        d.ot || '',
        d.trabajo || '',
      ]),
      styles: { fontSize: 7.5, cellPadding: 1.2, overflow: 'ellipsize' },
      headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold', fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 13 },
        1: { cellWidth: 48 },
        2: { cellWidth: 20 },
        3: { cellWidth: 34 },
        4: { cellWidth: 15 },
        5: { cellWidth: 18 },
        6: { cellWidth: 'auto' },
      },
    })

    y = doc.lastAutoTable.finalY + 6
  })

  // base64 puro (sin el prefijo "data:application/pdf;filename=...;base64,")
  return doc.output('datauristring').split(',')[1]
}
