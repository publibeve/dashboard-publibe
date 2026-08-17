/**
 * Reserva el espacio de una sección tipo "Información de pago"/"Plantillas
 * de ítems" mientras sus datos todavía están cargando — sin esto, la
 * sección entera aparece de golpe recién cuando el fetch termina (unos
 * ~2 segundos), empujando todo el resto del layout de una sola vez. Con
 * el placeholder puesto desde el principio, el salto desaparece: el
 * contenido real simplemente reemplaza el esqueleto en el mismo lugar.
 */
export function SectionSkeleton({ title, icon: Icon, cards = 3 }) {
  return (
    <section className="overview-section section-skeleton">
      <div className="overview-section-head admin-section-head">
        <span className="overview-section-title">{Icon && <Icon size={15} />} {title}</span>
      </div>
      <div className="section-skeleton-grid">
        {Array.from({ length: cards }).map((_, i) => (
          <div className="section-skeleton-card" key={i}>
            <div className="section-skeleton-line section-skeleton-line-short" />
            <div className="section-skeleton-line" />
            <div className="section-skeleton-line section-skeleton-line-medium" />
          </div>
        ))}
      </div>
    </section>
  );
}
