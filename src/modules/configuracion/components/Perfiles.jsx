import { useState } from 'react'
import { moduleRegistry, GRUPOS_MODULO } from '../../../app/moduleRegistry'
import { useAuth } from '../../../app/auth/useAuth'

const PERFIL_VACIO = { id: null, nombre: '', descripcion: '', modulos: [] }

export function Perfiles({ perfiles, personas, onGuardar, onBorrar, mostrarToast }) {
  const { user } = useAuth()
  const [form, setForm] = useState(null) // null = formulario cerrado

  function contarPersonas(perfilId) {
    return personas.filter((p) => p.perfil_id === perfilId).length
  }

  function abrirNuevo() {
    setForm({ ...PERFIL_VACIO })
  }

  function abrirEditar(perfil) {
    setForm({ id: perfil.id, nombre: perfil.nombre, descripcion: perfil.descripcion || '', modulos: [...perfil.modulos] })
  }

  function toggleModulo(key) {
    setForm((f) => ({
      ...f,
      modulos: f.modulos.includes(key) ? f.modulos.filter((m) => m !== key) : [...f.modulos, key],
    }))
  }

  async function handleGuardar(e) {
    e.preventDefault()
    if (!form.nombre.trim()) {
      mostrarToast('El perfil necesita un nombre', 'error')
      return
    }
    try {
      await onGuardar(form, user)
      mostrarToast('Perfil guardado', 'ok')
      setForm(null)
    } catch (err) {
      mostrarToast(err.message, 'error')
    }
  }

  async function handleBorrar(perfil) {
    const cant = contarPersonas(perfil.id)
    if (cant > 0) {
      mostrarToast(`No se puede borrar: ${cant} persona(s) tienen este perfil asignado`, 'error')
      return
    }
    if (!confirm(`¿Borrar el perfil "${perfil.nombre}"?`)) return
    try {
      await onBorrar(perfil.id)
      mostrarToast('Perfil borrado', 'ok')
    } catch (err) {
      mostrarToast(err.message, 'error')
    }
  }

  return (
    <div className="cfg-perfiles">
      <div className="cfg-seccion-header">
        <p className="cfg-seccion-sub">Cada perfil agrupa qué módulos ve quien lo tenga asignado.</p>
        <button className="btn btn-primary" onClick={abrirNuevo}>
          + Nuevo perfil
        </button>
      </div>

      {form && (
        <form className="cfg-form-card" onSubmit={handleGuardar}>
          <h3 className="cfg-form-titulo">{form.id ? 'Editar perfil' : 'Nuevo perfil'}</h3>
          <label className="cfg-label">
            Nombre
            <input
              className="cfg-input"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              autoFocus
            />
          </label>
          <label className="cfg-label">
            Descripción (opcional)
            <input
              className="cfg-input"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </label>
          <div className="cfg-label">Módulos</div>
          {GRUPOS_MODULO.map((grupo) => {
            const deEsteGrupo = moduleRegistry.filter((mod) => mod.grupo === grupo.key)
            if (!deEsteGrupo.length) return null
            return (
              <div key={grupo.key} className="cfg-checklist-grupo">
                <div className="cfg-checklist-grupo-titulo">{grupo.label}</div>
                <div className="cfg-checklist">
                  {deEsteGrupo.map((mod) => (
                    <label key={mod.key} className="cfg-check-item">
                      <input type="checkbox" checked={form.modulos.includes(mod.key)} onChange={() => toggleModulo(mod.key)} />
                      {mod.label}
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
          <div className="cfg-form-acciones">
            <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar
            </button>
          </div>
        </form>
      )}

      <div className="cfg-perfiles-grid">
        {perfiles.map((perfil) => (
          <div className="cfg-perfil-card" key={perfil.id}>
            <div className="cfg-perfil-card-header">
              <h3>{perfil.nombre}</h3>
              <span className="cfg-perfil-personas-count">
                {contarPersonas(perfil.id)} persona{contarPersonas(perfil.id) === 1 ? '' : 's'}
              </span>
            </div>
            {perfil.descripcion && <p className="cfg-perfil-desc">{perfil.descripcion}</p>}
            <div className="cfg-perfil-modulos">
              {perfil.modulos.length === 0 ? (
                <span className="cfg-chip-vacio">Sin módulos</span>
              ) : (
                perfil.modulos.map((key) => (
                  <span className="cfg-chip" key={key}>
                    {moduleRegistry.find((m) => m.key === key)?.label || key}
                  </span>
                ))
              )}
            </div>
            <div className="cfg-perfil-acciones">
              <button className="btn btn-ghost" onClick={() => abrirEditar(perfil)}>
                Editar
              </button>
              <button className="btn btn-ghost cfg-btn-borrar" onClick={() => handleBorrar(perfil)}>
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
