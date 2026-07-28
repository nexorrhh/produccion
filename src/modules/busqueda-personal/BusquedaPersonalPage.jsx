import { useState } from 'react'
import { useAuth } from '../../app/auth/useAuth'
import { supabase } from '../../app/supabaseClient'
import { Toast } from '../../app/components/Toast'
import { usePuestosActivos } from './hooks/usePuestosActivos'
import './busqueda-personal.css'

const SECTORES = ['Administrativo', 'Calidad', 'Gerencia', 'Ingeniería', 'Producción', 'Taller']

const MOTIVOS = ['Baja / renuncia', 'Crecimiento', 'Reemplazo temporal', 'Otro']

const MOTIVO_LABEL = {
  'Baja / renuncia': 'Baja / renuncia',
  Crecimiento: 'Crecimiento de plantel',
  'Reemplazo temporal': 'Reemplazo temporal',
  Otro: 'Otro',
}

const FORM_INICIAL = { puesto: '', sector: '', cantidad: '1', motivo: '', descripcion: '' }

export function BusquedaPersonalPage() {
  const { user } = useAuth()
  const { puestos, cargando, error: errorPuestos } = usePuestosActivos()

  const [form, setForm] = useState(FORM_INICIAL)
  const [invalidos, setInvalidos] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [toast, setToast] = useState(null)

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
    setInvalidos((inv) => ({ ...inv, [campo]: false }))
  }

  function mostrarToast(msg, tipo = '') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 4500)
  }

  function validar() {
    const nuevos = {
      puesto: !form.puesto,
      sector: !form.sector.trim(),
      motivo: !form.motivo,
      cantidad: !(parseInt(form.cantidad, 10) > 0),
    }
    setInvalidos(nuevos)
    return !Object.values(nuevos).some(Boolean)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validar()) {
      mostrarToast('Revisá los campos marcados en rojo', 'error')
      return
    }

    setEnviando(true)
    try {
      const { error } = await supabase.from('solicitudes_personal').insert({
        puesto: form.puesto,
        area: form.sector.trim(),
        cantidad: parseInt(form.cantidad, 10),
        motivo: form.motivo,
        descripcion: form.descripcion.trim() || null,
        solicitado_por: user.nombre_apellido,
        empresa: null,
        estado: 'pendiente',
      })
      if (error) throw error

      mostrarToast('Solicitud enviada — el área de RRHH la recibirá', 'ok')
      setForm(FORM_INICIAL)
      setInvalidos({})
    } catch (err) {
      mostrarToast('No se pudo enviar: ' + err.message, 'error')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="wrap bp-wrap">
      <div className="bp-card">
        <form onSubmit={handleSubmit} noValidate>
          <div className={'bp-field' + (invalidos.puesto ? ' invalid' : '')}>
            <label htmlFor="puesto">
              Puesto solicitado <span className="bp-req">*</span>
            </label>
            <select
              id="puesto"
              value={form.puesto}
              onChange={(e) => set('puesto', e.target.value)}
              disabled={cargando}
            >
              <option value="" disabled>
                {cargando ? 'Cargando puestos…' : 'Seleccionar…'}
              </option>
              {puestos.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <div className="bp-error-msg">Elegí el puesto que se necesita cubrir.</div>
            {errorPuestos && <div className="bp-error-msg">{errorPuestos}</div>}
          </div>

          <div className="bp-field-row">
            <div className={'bp-field' + (invalidos.sector ? ' invalid' : '')}>
              <label htmlFor="sector">
                Sector / Área <span className="bp-req">*</span>
              </label>
              <select id="sector" value={form.sector} onChange={(e) => set('sector', e.target.value)}>
                <option value="" disabled>
                  Seleccionar…
                </option>
                {SECTORES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div className="bp-error-msg">Elegí el sector o área.</div>
            </div>

            <div className={'bp-field' + (invalidos.cantidad ? ' invalid' : '')}>
              <label htmlFor="cantidad">
                Cantidad de personas <span className="bp-req">*</span>
              </label>
              <input
                id="cantidad"
                type="number"
                min="1"
                step="1"
                value={form.cantidad}
                onChange={(e) => set('cantidad', e.target.value)}
              />
              <div className="bp-error-msg">Debe ser 1 o más.</div>
            </div>
          </div>

          <div className={'bp-field' + (invalidos.motivo ? ' invalid' : '')}>
            <label htmlFor="motivo">
              Motivo <span className="bp-req">*</span>
            </label>
            <select id="motivo" value={form.motivo} onChange={(e) => set('motivo', e.target.value)}>
              <option value="" disabled>
                Seleccionar…
              </option>
              {MOTIVOS.map((m) => (
                <option key={m} value={m}>
                  {MOTIVO_LABEL[m]}
                </option>
              ))}
            </select>
            <div className="bp-error-msg">Elegí un motivo.</div>
          </div>

          <div className="bp-field">
            <label htmlFor="descripcion">
              Descripción / Observaciones <span className="bp-opt">(opcional)</span>
            </label>
            <textarea
              id="descripcion"
              placeholder="Detalles del perfil, turno, urgencia u otra información relevante…"
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
            />
          </div>

          <div className="bp-submit-row">
            <button type="submit" className="btn btn-primary bp-submit" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      </div>

      <p className="bp-footer-note">Formulario interno · Uso exclusivo del personal autorizado</p>

      <Toast toast={toast} />
    </div>
  )
}
