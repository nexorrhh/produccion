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

    const loggedUser = data[0]
    setUser(loggedUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser))
    return loggedUser
  }

  function logout() {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
