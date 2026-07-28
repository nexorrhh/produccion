import { createContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const STORAGE_KEY = 'produccion_usuario'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        setUser(JSON.parse(raw))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setLoading(false)
  }, [])

  async function login(pin) {
    const { data, error } = await supabase.rpc('produccion_verificar_pin', {
      p_pin: pin,
    })
    if (error) throw new Error('No se pudo validar el PIN: ' + error.message)
    if (!data || !data.length) throw new Error('PIN incorrecto')

    return applyLogin(data[0])
  }

  // Perfiles activos que todavía no definieron su PIN (para el selector de
  // "Crear mi PIN"). Nunca expone si ya tiene pin ni su valor.
  async function listarSinPin() {
    const { data, error } = await supabase.rpc('produccion_usuarios_sin_pin')
    if (error) throw new Error('No se pudo cargar la lista de perfiles: ' + error.message)
    return data || []
  }

  // Define el PIN por primera vez para un perfil. La función en Supabase
  // solo lo permite si ese perfil todavía no tiene uno, así cada persona
  // lo elige una única vez, sin que nadie más lo vea ni lo defina.
  async function crearPin(id, pin) {
    const { data, error } = await supabase.rpc('produccion_crear_pin', {
      p_id: id,
      p_pin: pin,
    })
    if (error) throw new Error(error.message)
    if (!data || !data.length) throw new Error('No se pudo crear el PIN')

    return applyLogin(data[0])
  }

  function applyLogin(loggedUser) {
    setUser(loggedUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser))
    return loggedUser
  }

  function logout() {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, listarSinPin, crearPin }}>
      {children}
    </AuthContext.Provider>
  )
}
