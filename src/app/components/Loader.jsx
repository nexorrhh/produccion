// Spinner compartido para estados de carga — mismo criterio que Toast.jsx
// (componente app-level, no de un módulo en particular, así que no hace
// falta duplicarlo por módulo).
export function Loader({ texto = 'Cargando…' }) {
  return (
    <div className="loader-wrap">
      <span className="loader-spinner" />
      <span className="loader-texto">{texto}</span>
    </div>
  )
}
