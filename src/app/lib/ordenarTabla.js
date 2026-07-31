import { useState } from 'react'

// Estado de orden por columna (click en el encabezado alterna
// ascendente/descendente), reutilizable en cualquier tabla de personas.
export function useOrdenTabla() {
  const [campo, setCampo] = useState(null)
  const [direccion, setDireccion] = useState('asc')

  function alternar(nuevoCampo) {
    if (campo === nuevoCampo) {
      setDireccion(direccion === 'asc' ? 'desc' : 'asc')
    } else {
      setCampo(nuevoCampo)
      setDireccion('asc')
    }
  }

  return { campo, direccion, alternar }
}

function comparar(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a ?? '').localeCompare(String(b ?? ''), 'es', { sensitivity: 'base' })
}

// getValor(fila) -> valor a comparar para el campo activo. Si no hay
// campo elegido todavía, devuelve las filas sin tocar el orden que ya
// traían.
export function ordenarFilas(filas, campo, direccion, getValor) {
  if (!campo) return filas
  const ordenado = [...filas].sort((a, b) => comparar(getValor(a), getValor(b)))
  return direccion === 'desc' ? ordenado.reverse() : ordenado
}

export function flechaOrden(campoColumna, campoActivo, direccion) {
  if (campoColumna !== campoActivo) return ''
  return direccion === 'asc' ? ' ▲' : ' ▼'
}
