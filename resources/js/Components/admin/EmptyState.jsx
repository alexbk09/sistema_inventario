import { PackageSearch, ShoppingCart, Users, Truck, FileText, BarChart2, Inbox } from 'lucide-react';

const PRESET_ICONS = {
  products: PackageSearch,
  invoices: ShoppingCart,
  customers: Users,
  providers: Truck,
  reports: BarChart2,
  documents: FileText,
  default: Inbox,
};

/**
 * EmptyState — Componente reutilizable para listas vacías
 *
 * @param {string}  title      - Título principal
 * @param {string}  description - Descripción secundaria
 * @param {node}    action     - Slot para botón de acción
 * @param {string}  preset     - Icono preset: 'products'|'invoices'|'customers'|'providers'|'reports'
 * @param {node}    icon       - Componente icono custom (override preset)
 * @param {string}  size       - 'sm' | 'md' (default)
 */
export default function EmptyState({
  title = 'Sin resultados',
  description = 'No hay datos para mostrar con los filtros actuales.',
  action,
  preset = 'default',
  icon: CustomIcon,
  size = 'md',
}) {
  const Icon = CustomIcon ?? PRESET_ICONS[preset] ?? PRESET_ICONS.default;
  const isSm = size === 'sm';

  return (
    <div className={`flex flex-col items-center justify-center text-center ${isSm ? 'py-8 px-4' : 'py-16 px-6'}`}>
      <div className={`${isSm ? 'w-12 h-12' : 'w-16 h-16'} rounded-2xl bg-muted flex items-center justify-center mb-4`}>
        <Icon className={`${isSm ? 'w-6 h-6' : 'w-8 h-8'} text-muted-foreground/50`} />
      </div>
      <h3 className={`font-semibold text-foreground ${isSm ? 'text-sm' : 'text-base'} mb-1`}>
        {title}
      </h3>
      <p className={`text-muted-foreground ${isSm ? 'text-xs' : 'text-sm'} max-w-xs`}>
        {description}
      </p>
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}
