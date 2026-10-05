import { useState } from 'react'
import { useAuth } from '../../../app/auth/useAuth'
import { ROLES } from '../lib/roles'

const PERSONA_VACIA = { nombreApellido: '', rol: 'gerente_produccion', perfilId: '' }

export function Personas({ personas, perfiles, onCrear, onActualizar, onEliminar, mostrarToast }) {
  const { user } = useAuth()
  const [form, setForm] = useState(null)

  async function handleCrear(e) {
    e.preventDefault()
    if (!form.nombreApellido.trim()) {
      mostrarToast('Hace falta nombre y apellido', 'error')
      return
    }
    try {
      await onCrear({ ...form, perfilId: form.perfilId || null }, user)
      mostrarToast('Persona creada — todavía no tiene PIN, lo define ella sola al entrar', 'ok')
      setForm(null)
    } catch (err) {
      mostrarToast(err.message, 'error')
    }
  }

  async function handleCambiarRol(persona, rol) {
    try {
      await onActualizar(persona.id, { rol, perfilId: persona.perfil_id, activo: persona.activo }, user)
      mostrarToast('Rol actualizado', 'ok')
    } catch (err) {
      mostrarToast(err.message, 'error')
    }
  }

  async function handleCambiarPerfil(persona, perfilId) {
    try {
      await onActualizar(persona.id, { rol: persona.rol, perfilId: perfilId || null, activo: persona.activo }, user)
      mostrarToast('Perfil actualizado', 'ok')
    } catch (err) {
      mostrarToast(err.message, 'error')
    }
  }

  async function handleToggleActivo(persona) {
    try {
      await onActualizar(persona.id, { rol: persona.rol, perfilId: persona.perfil_id, activo: !persona.activo }, user)
      mostrarToast(persona.activo ? 'Persona desactivada' : 'Persona reactivada', 'ok')
    } catch (err) {
      mostrarToast(err.message, 'error')
    }
  }

  async function handleEliminar(persona) {
    if (!confirm(`¿Borrar a "${persona.nombre_apellido}"? Esto no se puede deshacer.`)) return
    try {
      await onEliminar(persona.id)
      mostrarToast('Persona borrada', 'ok')
    } catch (err) {
      mostrarToast(err.message, 'error')
    }
  }

  return (
    <div className="cfg-personas">
      <div className="cfg-seccion-header">
        <p className="cfg-seccion-sub">Quién puede entrar al panel, con qué rol y qué perfil de módulos.</p>
        <button className="btn btn-primary" onClick={() => setForm({ ...PERSONA_VACIA })}>
          + Nueva persona
        </button>
      </div>

      {form && (
        <form className="cfg-form-card" onSubmit={handleCrear}>
          <h3 className="cfg-form-titulo">Nueva persona</h3>
          <label className="cfg-label">
            Nombre y apellido
            <input
              className="cfg-input"
              placeholder="Apellido, Nombre"
              value={form.nombreApellido}
              onChange={(e) => setForm({ ...form, nombreApellido: e.target.value })}
              autoFocus
            />
          </label>
          <label className="cfg-label">
            Rol
            <select className="cfg-input" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
              {ROLES.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="cfg-label">
            Perfil (qué módulos va a ver)
            <select className="cfg-input" value={form.perfilId} onChange={(e) => setForm({ ...form, perfilId: e.target.value })}>
              <option value="">Sin perfil asignado</option>
              {perfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
          <div className="cfg-form-acciones">
            <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Crear
            </button>
          </div>
        </form>
      )}

      <table className="cfg-tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Rol</th>
            <th>Perfil</th>
            <th>PIN</th>
            <th>Activo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {personas.map((p) => (
            <tr key={p.id} className={p.activo ? '' : 'cfg-fila-inactiva'}>
              <td>{p.nombre_apellido}</td>
              <td>
                <select className="cfg-select-chico" value={p.rol} onChange={(e) => handleCambiarRol(p, e.target.value)}>
                  {ROLES.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  className="cfg-select-chico"
                  value={p.perfil_id || ''}
                  onChange={(e) => handleCambiarPerfil(p, e.target.value)}
                >
                  <option value="">Sin perfil asignado</option>
                  {perfiles.map((perfil) => (
                    <option key={perfil.id} value={perfil.id}>
                      {perfil.nombre}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <span className={'cfg-badge-pin' + (p.tiene_pin ? ' definido' : '')}>
                  {p.tiene_pin ? 'Definido' : 'Sin definir'}
                </span>
              </td>
              <td>
                <label className="cfg-switch">
                  <input type="checkbox" checked={p.activo} onChange={() => handleToggleActivo(p)} />
                  <span>{p.activo ? 'Sí' : 'No'}</span>
                </label>
              </td>
              <td>
                {p.id !== user?.id && (
                  <button className="btn btn-ghost cfg-btn-borrar" onClick={() => handleEliminar(p)}>
                    Eliminar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
