import { useState } from 'react'
import { useEventosAuditoria } from './hooks/useEventosAuditoria'
import { VistaDia } from './components/VistaDia'
import { ErroresFuentes } from './components/ErroresFuentes'
import { cimometV2 } from '../../app/cimometV2Client'
import './auditoria.css'

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

function sumarDias(fechaISO, n) {
  const d = new Date(fechaISO + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function fechaLarga(fechaISO) {
  return new Date(fechaISO + 'T00:00:00').toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// Panel de auditoría de uso de cimomet-v2 — SOLO LECTURA. Ninguna función de
// este módulo escribe en la base de cimomet-v2 (ver useEventosAuditoria.js,
// useUsuariosCimometV2.js, useOtsCimometV2.js: todas las consultas son
// select-only). Visible solo para gerente_produccion/admin_sistema, ver
// src/app/moduleRegistry.jsx.
//
// Un día a la vez (registro diario, se navega con las flechas) en vez de un
// listado largo con filtros — pensado para que verificar "¿se usó cada
// sector hoy?" sea un vistazo, no una búsqueda.
export function AuditoriaPage() {
  const [fecha, setFecha] = useState(hoyISO)
  const { eventos, erroresPorFuente, cargando, recargar } = useEventosAuditoria({ fecha })
  const esHoy = fecha === hoyISO()

  if (!cimometV2) {
    return (
      <div className="wrap aud-vista">
        <div className="aud-vacio">
          Falta configurar la conexión a cimomet-v2 (VITE_CIMOMETV2_SUPABASE_URL /
          VITE_CIMOMETV2_SUPABASE_ANON_KEY) — sin eso este módulo no tiene de dónde leer.
        </div>
      </div>
    )
  }

  return (
    <div className="wrap aud-vista">
      <div className="aud-header">
        <div>
          <h1 className="aud-titulo">Auditoría de uso — cimomet-v2</h1>
          <div className="aud-sub">Solo lectura, no modifica nada en cimomet-v2.</div>
        </div>
      </div>

      <div className="aud-nav-dia">
        <button type="button" className="btn" onClick={() => setFecha((f) => sumarDias(f, -1))}>
          ← Día anterior
        </button>
        <div className="aud-fecha-actual">
          <input type="date" value={fecha} max={hoyISO()} onChange={(e) => setFecha(e.target.value)} />
          <span className="aud-fecha-label">
            {fechaLarga(fecha)}
            {esHoy ? ' · Hoy' : ''}
          </span>
        </div>
        <button type="button" className="btn" onClick={() => setFecha((f) => sumarDias(f, 1))} disabled={esHoy}>
          Día siguiente →
        </button>
        {!esHoy && (
          <button type="button" className="btn btn-ghost" onClick={() => setFecha(hoyISO())}>
            Volver a hoy
          </button>
        )}
        <button type="button" className="btn aud-btn-actualizar" onClick={recargar} disabled={cargando}>
          {cargando ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>

      <ErroresFuentes errores={erroresPorFuente} />

      <VistaDia eventos={eventos} cargando={cargando} />
    </div>
  )
}
