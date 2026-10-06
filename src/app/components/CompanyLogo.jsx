export function CompanyLogo({ className = '' }) {
  return (
    <div className={`company-logo ${className}`} aria-label="Cimomet">
      <img className="company-logo-image" src="/assets/logo-cimomet-hd.png" alt="Cimomet S.A." />
    </div>
  )
}
