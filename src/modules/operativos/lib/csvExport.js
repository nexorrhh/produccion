import { key, tipoPago } from './clasificacion'
import { labelTipoPuesto, ordenTipoPuesto } from './tiposPuesto'

export function exportarCSV(seleccion, empleados, mapaClasif, fecha, dia) {
  const sels = Object.keys(seleccion)
  if (!sels.length) throw new Error('No hay nadie citado')

  const rows = [['Personal', 'Tipo', 'Horario', 'Nº OT', 'Trabajo', 'Situación']]
  const ordenados = sels.slice().sort((a, b) => {
    const ea = empleados.find((x) => key(x) === a)
    const eb = empleados.find((x) => key(x) === b)
    const ta = tipoPago(ea, mapaClasif)
    const tb = tipoPago(eb, mapaClasif)
    if (ta !== tb) return ordenTipoPuesto(ta) - ordenTipoPuesto(tb)
    return (ea.apellido_y_nombre || '').localeCompare(eb.apellido_y_nombre || '')
  })

  ordenados.forEach((k) => {
    const e = empleados.find((x) => key(x) === k)
    const s = seleccion[k]
    let horario = ''
    if (s.manana && s.tarde) horario = 'Ambos'
    else if (s.manana) horario = '07 a 12'
    else if (s.tarde) horario = '12 a 16'
    const tipo = labelTipoPuesto(tipoPago(e, mapaClasif))
    rows.push([e.apellido_y_nombre, tipo, horario, s.ot || '', s.trabajo || '', 'Convocado'])
  })

  const csv = rows
    .map((r) => r.map((c) => `"${(c || '').toString().replace(/"/g, '""')}"`).join(';'))
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Informe (${dia} ${fecha}).csv`
  a.click()
  URL.revokeObjectURL(url)
}
