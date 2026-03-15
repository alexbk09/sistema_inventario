import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import { TrendingUp, AlertTriangle, Package, Clock, CheckCircle, XCircle, Tag, Truck, Receipt, ArrowRight, Users, UserCircle, RotateCcw, Store, CreditCard } from 'lucide-react';

export default function Dashboard({ metrics = {}, counts = {}, topProducts = [], lowStockProducts = [], expiredLayaways = [], warehouses = [], selected_warehouse = '', rate = 0 }) {
  const selectedWarehouse = selected_warehouse || '';
  const { props } = usePage();

  const handleWarehouseChange = (e) => {
    const id = e.target.value;
    router.get(route('dashboard'), { warehouse_id: id || undefined }, { replace: true, preserveState: true });
  };

  const metricsCards = [
    {
      label: 'Tasa del Día',
      value: `Bs ${Number(rate || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: 'Promedio oficial',
      icon: Tag,
      color: 'bg-sky-50 text-sky-600',
      borderColor: 'border-sky-200',
    },
    {
      label: 'Ventas del Día',
      value: `$${Number(metrics.today_sales_usd || 0).toFixed(2)}`,
      description: `${Number(metrics.today_sales_count || 0)} transacción${Number(metrics.today_sales_count || 0) !== 1 ? 'es' : ''}`,
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
      borderColor: 'border-green-200',
    },
    {
      label: 'Ventas del Mes',
      value: `$${Number(metrics.month_sales_usd || 0).toFixed(2)}`,
      description: `${Number(metrics.month_sales_count || 0)} transacciones`,
      icon: TrendingUp,
      color: 'bg-blue-50 text-blue-600',
      borderColor: 'border-blue-200',
    },
    {
      label: 'Productos por Agotarse',
      value: Number(metrics.low_stock_products || 0),
      description: 'Stock ≤ 5 unidades',
      icon: AlertTriangle,
      color: 'bg-yellow-50 text-yellow-600',
      borderColor: 'border-yellow-200',
    },
    {
      label: 'Stock Total',
      value: Number(metrics.total_stock || 0),
      description: 'Unidades en inventario',
      icon: Package,
      color: 'bg-purple-50 text-purple-600',
      borderColor: 'border-purple-200',
    },
    {
      label: 'Facturas Pendientes',
      value: Number(metrics.invoice_pending || 0),
      description: 'Por procesar',
      icon: Clock,
      color: 'bg-orange-50 text-orange-600',
      borderColor: 'border-orange-200',
    },
    {
      label: 'Facturas Pagadas',
      value: Number(metrics.invoice_paid || 0),
      description: 'Pagadas',
      icon: CheckCircle,
      color: 'bg-teal-50 text-teal-600',
      borderColor: 'border-teal-200',
    },
    {
      label: 'Facturas Canceladas',
      value: Number(metrics.invoice_cancelled || 0),
      description: 'Rechazadas',
      icon: XCircle,
      color: 'bg-red-50 text-red-600',
      borderColor: 'border-red-200',
    },
    {
      label: 'Devoluciones Abiertas',
      value: Number(metrics.rma_pending || 0),
      description: 'RMA pendientes o en proceso',
      icon: RotateCcw,
      color: 'bg-sky-50 text-sky-600',
      borderColor: 'border-sky-200',
    },
    {
      label: 'Apartados Activos',
      value: Number(metrics.layaway_active || 0),
      description: 'Reservas abiertas',
      icon: Store,
      color: 'bg-indigo-50 text-indigo-600',
      borderColor: 'border-indigo-200',
    },
    {
      label: 'Cuentas de Crédito',
      value: Number(metrics.credit_open || 0),
      description: 'Cuentas activas',
      icon: CreditCard,
      color: 'bg-emerald-50 text-emerald-600',
      borderColor: 'border-emerald-200',
    },
  ];

  const modules = [
    {
      label: 'Productos',
      description: `${Number(counts.products || 0)} productos`,
      href: route('admin.products.index'),
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Categorías',
      description: `${Number(counts.categories || 0)} categorías`,
      href: route('admin.categories.index'),
      icon: Tag,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Proveedores',
      description: `${Number(counts.providers || 0)} proveedores`,
      href: route('admin.providers.index'),
      icon: Truck,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Facturas',
      description: `${Number(counts.invoices || 0)} facturas`,
      href: route('admin.invoices.index'),
      icon: Receipt,
      color: 'bg-orange-50 text-orange-600',
    },
    {
      label: 'Clientes',
      description: `${Number(counts.customers || 0)} clientes`,
      href: route('admin.customers.index'),
      icon: Users,
      color: 'bg-pink-50 text-pink-600',
    },
    {
      label: 'Usuarios',
      description: `${Number(counts.users || 0)} usuarios`,
      href: route('admin.users.index'),
      icon: UserCircle,
      color: 'bg-slate-50 text-slate-600',
    },
    {
      label: 'Devoluciones',
      description: `${Number(counts.rmas || 0)} RMA`,
      href: route('admin.rmas.index'),
      icon: RotateCcw,
      color: 'bg-sky-50 text-sky-600',
    },
    {
      label: 'Sucursales',
      description: `${Number(counts.warehouses || 0)} sucursales`,
      href: route('admin.warehouses.index'),
      icon: Store,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Créditos',
      description: `${Number(counts.credits || 0)} cuentas`,
      href: route('admin.credits.index'),
      icon: CreditCard,
      color: 'bg-emerald-50 text-emerald-600',
    },
  ];
  return (
    <AuthenticatedLayout>
      <Head title="Dashboard" />
        <div className="space-y-8">
            <div className="flex items-center gap-4">
              <label className="text-sm text-muted-foreground">Filtrar por sucursal:</label>
              <select value={selectedWarehouse || ''} onChange={handleWarehouseChange} className="border border-border rounded px-2 py-1 bg-background">
                <option value="">Todas</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                ))}
              </select>
            </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Bienvenido al Panel de Admin</h1>
            <p className="text-muted-foreground">
              Resumen de tu tienda en línea
            </p>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metricsCards.map((metric, idx) => {
              const Icon = metric.icon
              return (
                <div
                  key={idx}
                  className={`bg-card border ${metric.borderColor} rounded-lg p-6 hover:shadow-lg transition`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                      <p className="text-3xl font-bold text-foreground">{metric.value}</p>
                      <p className="text-xs text-muted-foreground mt-2">{metric.description}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${metric.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Módulos */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Gestionar Módulos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {modules.map((module) => {
                const Icon = module.icon
                return (
                  <Link
                    key={module.href}
                    href={module.href}
                    className="group bg-card border border-border rounded-lg p-6 hover:shadow-lg transition"
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${module.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">{module.label}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
                    <div className="flex items-center gap-2 text-accent text-sm font-medium group-hover:translate-x-1 transition">
                      Gestionar
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
    </AuthenticatedLayout>
  );
}
