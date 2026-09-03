import { useMemo, useState } from 'react'
import { useEventosAuditoria } from './hooks/useEventosAuditoria'
import { SECTORES } from './lib/fuentesAuditoria'
import { ResumenDiario } from './components/ResumenDiario'
import { TablaEventos } from './components/TablaEventos'
import { ErroresFuentes } from './components/ErroresFuentes'
import { cimometV2 } from '../../app/cimometV2Client'
import './auditoria.css'

// Panel de auditoría de uso de cimomet-v2 — SOLO LECTURA. Ninguna función de
// este módulo escribe en la base de cimomet-v2 (ver useEventosAuditoria.js,
// useUsuariosCimometV2.js, useOtsCimometV2.js: todas las consultas son
// select-only). Visible solo para gerente_produccion/admin_sistema, ver
// src/app/moduleRegistry.jsx.
export function AuditoriaPage() {
  const [tab, setTab] = useState('resumen')
  const [diasRango, setDiasRango] = useState(30)
  const [sectorFiltro, setSectorFiltro] = useState('')
  const { eventos, erroresPorFuente, cargando, recargar } = useEventosAuditoria({ diasRango })

  const eventosFiltrados = useMemo(
    () => (sectorFiltro ? eventos.filter((e) => e.sector === sectorFiltro) : eventos),
    [eventos, sectorFiltro]
  )

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
        <div className="aud-controles">
          <select value={diasRango} onChange={(e) => setDiasRango(Number(e.target.value))}>
            <option value={7}>Últimos 7 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 90 días</option>
          </select>
          <button type="button" className="btn" onClick={recargar} disabled={cargando}>
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>
      </div>

      <ErroresFuentes errores={erroresPorFuente} />

      <div className="aud-tabs">
        <button className={tab === 'resumen' ? 'active' : ''} onClick={() => setTab('resumen')}>
          Resumen diario
        </button>
        <button className={tab === 'eventos' ? 'active' : ''} onClick={() => setTab('eventos')}>
          Eventos
        </button>
      </div>

      {tab === 'resumen' ? (
        <ResumenDiario eventos={eventos} diasRango={diasRango} cargando={cargando} />
      ) : (
        <>
          <div className="aud-filtros">
            <select value={sectorFiltro} onChange={(e) => setSectorFiltro(e.target.value)}>
              <option value="">Todos los sectores</option>
              {SECTORES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <TablaEventos eventos={eventosFiltrados} cargando={cargando} />
        </>
      )}
    </div>
  )
}
