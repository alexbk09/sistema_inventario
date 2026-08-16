import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

/**
 * PageHeader — Componente reutilizable para encabezados de páginas admin.
 *
 * @param {string}   title        - Título principal de la página
 * @param {string}   description  - Subtítulo / descripción
 * @param {Array}    breadcrumbs  - [{ label, href? }] — el último elemento es el actual
 * @param {node}     actions      - Slot para botones de acción (derecha)
 * @param {node}     icon         - Ícono opcional a la izquierda del título
 */
export default function PageHeader({ title, description, breadcrumbs = [], actions, icon: Icon }) {
    return (
        <div className="flex flex-col gap-1 mb-6">
            {breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-1" aria-label="Breadcrumb">
                    {breadcrumbs.map((crumb, i) => (
                        <span key={i} className="flex items-center gap-1">
                            {i > 0 && <ChevronRight className="w-3 h-3 shrink-0" />}
                            {crumb.href && i < breadcrumbs.length - 1 ? (
                                <Link href={crumb.href} className="hover:text-foreground transition-colors">
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className={i === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''}>
                                    {crumb.label}
                                </span>
                            )}
                        </span>
                    ))}
                </nav>
            )}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    {Icon && (
                        <div className="hidden sm:flex w-10 h-10 rounded-xl bg-primary/10 items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-primary" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold text-foreground tracking-tight truncate">{title}</h1>
                        {description && (
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
                        )}
                    </div>
                </div>
                {actions && (
                    <div className="flex items-center gap-2 shrink-0">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
