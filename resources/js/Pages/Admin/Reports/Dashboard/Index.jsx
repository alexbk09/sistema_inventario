import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import PageHeader from '@/Components/admin/PageHeader.jsx';
import { useI18n } from '@/Hooks/useI18n';
import {
  ShoppingCart, Package, FileText, Layers, RefreshCw, Clock,
  TrendingUp, DollarSign, CreditCard, BookOpen, BarChart2, ArrowRight
} from 'lucide-react';

const iconMap = {
  ShoppingCart,
  Package,
  FileText,
  Layers,
  RefreshCw,
  Clock,
  TrendingUp,
  DollarSign,
  CreditCard,
  BookOpen,
  BarChart2,
};

const colorMap = {
  emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
  blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  violet: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20',
  teal: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20',
  amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  rose: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20',
  green: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
  purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  orange: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
};

export default function ReportsDashboard({ reports = [], groupedReports = {} }) {
  const { t } = useI18n();

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.reports.dashboard.page_title', 'Dashboard de Reportes')} />
      
      <div className="space-y-6">
        <PageHeader
          title={t('admin.reports.dashboard.title', 'Dashboard de Reportes')}
          description={t('admin.reports.dashboard.description', 'Accede a todos los reportes disponibles para analizar tu negocio.')}
          icon={BarChart2}
        />

        {/* Reportes por categoría */}
        {Object.entries(groupedReports).map(([category, categoryReports]) => (
          <div key={category} className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryReports.map((report) => {
                const Icon = iconMap[report.icon] || BarChart2;
                const colorClass = colorMap[report.color] || colorMap.blue;
                
                return (
                  <button
                    key={report.id}
                    onClick={() => router.get(route(report.route))}
                    className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-primary/50 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    
                    <h3 className="text-base font-semibold text-foreground mb-2">{report.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>
                    
                    <div className="mt-4 flex items-center gap-2 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {t('admin.reports.dashboard.view_report', 'Ver reporte')}
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {reports.length === 0 && (
          <div className="text-center py-12">
            <BarChart2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('admin.reports.dashboard.no_reports', 'No hay reportes disponibles.')}</p>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
