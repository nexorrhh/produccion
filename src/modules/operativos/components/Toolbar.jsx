export function Toolbar({ filtros, onFiltrosChange, puestos, vista, onVistaChange }) {
  function set(campo, valor) {
    onFiltrosChange({ ...filtros, [campo]: valor })
  }

  return (
    <div className="op-toolbar">
      <div className="op-search-wrap">
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Buscar por legajo o nombre…"
          value={filtros.search}
          onChange={(e) => set('search', e.target.value)}
        />
      </div>
      <select className="op-filter" value={filtros.empresa} onChange={(e) => set('empresa', e.target.value)}>
        <option value="">Ambas empresas</option>
        <option value="CIMOMET">Cimomet</option>
        <option value="COMOING">Co.mo.ing</option>
      </select>
      <select className="op-filter" value={filtros.puesto} onChange={(e) => set('puesto', e.target.value)}>
        <option value="">Todos los puestos</option>
        {puestos.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <select className="op-filter" value={filtros.tipopago} onChange={(e) => set('tipopago', e.target.value)}>
        <option value="">Mensual y quincenal</option>
        <option value="quincenal">Solo quincenales</option>
        <option value="mensual">Solo mensuales</option>
        <option value="sin_asignar">Solo sin clasificar</option>
      </select>
      <div className="op-chip-toggle">
        <button className={vista === 'todos' ? 'active' : ''} onClick={() => onVistaChange('todos')}>
          Todos
        </button>
        <button className={vista === 'citados' ? 'active' : ''} onClick={() => onVistaChange('citados')}>
          Solo citados
        </button>
      </div>
    </div>
  )
}
