import { useState } from 'react'
import { usePerfiles } from './hooks/usePerfiles'
import { usePersonas } from './hooks/usePersonas'
import { Perfiles } from './components/Perfiles'
import { Personas } from './components/Personas'
import { Loader } from '../../app/components/Loader'
import { Toast } from '../../app/components/Toast'
import './configuracion.css'

// Exclusivo de rol==='superadmin' (ver App.jsx/Sidebar.jsx — nunca se
// asigna por perfil). Administra dos cosas separadas:
//   - Perfiles: qué módulos ve cada perfil (produccion_perfiles).
//   - Personas: quién existe en produccion_usuarios, con qué rol y perfil.
export function ConfiguracionPage() {
  const { perfiles, cargando: cargandoPerfiles, guardar, borrar } = usePerfiles()
  const { personas, cargando: cargandoPersonas, crear, actualizar, eliminar } = usePersonas()
  const [vista, setVista] = useState('perfiles')
  const [toast, setToast] = useState(null)

  function mostrarToast(msg, tipo = '') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  const cargando = cargandoPerfiles || cargandoPersonas

  return (
    <div className="wrap">
      <div className="cfg-tabs">
        <button className={vista === 'perfiles' ? 'active' : ''} onClick={() => setVista('perfiles')}>
          Perfiles
        </button>
        <button className={vista === 'personas' ? 'active' : ''} onClick={() => setVista('personas')}>
          Personas
        </button>
      </div>

      {cargando ? (
        <Loader texto="Cargando configuración…" />
      ) : (
        <div key={vista} className="app-fade">
          {vista === 'perfiles' ? (
            <Perfiles perfiles={perfiles} personas={personas} onGuardar={guardar} onBorrar={borrar} mostrarToast={mostrarToast} />
          ) : (
            <Personas
              personas={personas}
              perfiles={perfiles}
              onCrear={crear}
              onActualizar={actualizar}
              onEliminar={eliminar}
              mostrarToast={mostrarToast}
            />
          )}
        </div>
      )}

      <Toast toast={toast} />
    </div>
  )
}
