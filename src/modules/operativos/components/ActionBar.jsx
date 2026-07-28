export function ActionBar({ estadoTexto, citadosCount, onLimpiar, onCopiarUltima, onExportarCSV, onGuardar, guardando }) {
  return (
    <div className="op-action-bar">
      <div className="op-action-info">
        <span>{estadoTexto || 'Sin guardar'}</span> · <b>{citadosCount}</b> personas citadas
      </div>
      <div className="op-action-spacer" />
      <button className="btn" onClick={onLimpiar} title="Quitar a todas las personas del listado">
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
        Limpiar todo
      </button>
      <button className="btn" onClick={onCopiarUltima}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        Copiar última
      </button>
      <button className="btn" onClick={onExportarCSV}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Exportar CSV
      </button>
      <button className="btn btn-green" onClick={onGuardar} disabled={guardando}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
        {guardando ? 'Guardando…' : 'Guardar citación'}
      </button>
    </div>
  )
}
