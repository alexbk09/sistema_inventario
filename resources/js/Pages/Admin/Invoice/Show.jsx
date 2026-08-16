import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import PageHeader from '@/Components/admin/PageHeader.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';
import { ArrowLeft, Download, Printer, FileText, User, Mail, Phone, Calendar, Package, CreditCard, CheckCircle2,
  History, PlusCircle, RefreshCw, XCircle, DollarSign, Clock, Send, StickyNote, Pencil, Save, X } from 'lucide-react';

const STATUS_CONFIG = {
  pending:   { color: 'bg-amber-100 text-amber-700', label: 'Pendiente' },
  paid:      { color: 'bg-emerald-100 text-emerald-700', label: 'Pagada' },
  shipped:   { color: 'bg-blue-100 text-blue-700', label: 'Enviada' },
  delivered: { color: 'bg-teal-100 text-teal-700', label: 'Entregada' },
  cancelled: { color: 'bg-red-100 text-red-700', label: 'Cancelada' },
};

const TIMELINE_CONFIG = {
  invoice_created: { label: 'Factura creada',     icon: PlusCircle,  color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  invoice_updated: { label: 'Factura actualizada', icon: RefreshCw,   color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
  invoice_paid:    { label: 'Pago registrado',     icon: DollarSign,  color: 'text-violet-500',  bg: 'bg-violet-50 dark:bg-violet-900/20' },
  invoice_cancelled:{ label: 'Cancelada',          icon: XCircle,     color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-900/20' },
}

const STATUS_LABELS = {
  pending: 'Pendiente', paid: 'Pagada', cancelled: 'Cancelada',
  shipped: 'Enviada', delivered: 'Entregada',
}

function InternalNotesCard({ invoice }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(invoice.internal_notes ?? '')
  const [busy, setBusy] = useState(false)

  const save = () => {
    setBusy(true)
    router.patch(
      route('admin.invoices.internal-notes.update', invoice.id),
      { internal_notes: value },
      {
        preserveScroll: true,
        onSuccess: () => { toast.success('Notas actualizadas'); setEditing(false) },
        onError: () => toast.error('No se pudo guardar'),
        onFinish: () => setBusy(false),
      }
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <StickyNote className="w-4 h-4" />
          Notas internas
        </h3>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
            <Pencil className="w-3 h-3" /> Editar
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            rows={4}
            placeholder="Notas privadas (no visibles en el PDF ni para el cliente)..."
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-ring focus:outline-none resize-none"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => { setValue(invoice.internal_notes ?? ''); setEditing(false) }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
            <button onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
              <Save className="w-3.5 h-3.5" /> Guardar
            </button>
          </div>
        </div>
      ) : (
        invoice.internal_notes
          ? <p className="text-sm text-foreground whitespace-pre-wrap">{invoice.internal_notes}</p>
          : <p className="text-sm text-muted-foreground italic">Sin notas internas. Haz clic en Editar para agregar.</p>
      )}
    </div>
  )
}

function InvoiceTimeline({ timeline = [] }) {
  if (!timeline.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <History className="w-4 h-4" />
          Historial
        </h3>
        <p className="text-xs text-muted-foreground text-center py-4">Sin registros de historial.</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <History className="w-4 h-4" />
        Historial de cambios
        <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full ml-auto">{timeline.length}</span>
      </h3>
      <div className="relative">
        <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-4">
          {timeline.map((entry, i) => {
            const cfg = TIMELINE_CONFIG[entry.action] ?? TIMELINE_CONFIG.invoice_updated
            const EntryIcon = cfg.icon
            const changes = entry.changes ?? {}
            return (
              <div key={entry.id ?? i} className="flex items-start gap-3 relative">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 border-background ${cfg.bg}`}>
                  <EntryIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-medium text-foreground">{cfg.label}</p>
                  {changes.old_status && changes.new_status && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {STATUS_LABELS[changes.old_status] ?? changes.old_status}
                      {' → '}
                      <span className="font-medium text-foreground">{STATUS_LABELS[changes.new_status] ?? changes.new_status}</span>
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {entry.created_at
                      ? new Date(entry.created_at).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                    {' · '}{entry.user_name}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Show({ invoice, adminCurrencyContext = {}, timeline = [] }) {
  const { t } = useI18n();
  const { formatNumber, formatCurrency } = useLocaleFormat();
  const { displayCurrency, formatPriceFromUsd } = useConfiguredCurrencyRates();
  const formatAmount = (value) => formatPriceFromUsd(Number(value || 0), displayCurrency);

  const status = invoice?.invoiceStatus?.code || invoice?.status || 'pending';
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const [sendingEmail, setSendingEmail] = useState(false);
  const handleSendEmail = () => {
    if (!invoice.customer?.email) {
      toast.error('El cliente no tiene un email registrado.');
      return;
    }
    setSendingEmail(true);
    router.post(route('admin.invoices.send-email', invoice.id), {}, {
      preserveScroll: true,
      onSuccess: () => toast.success('Factura enviada por email'),
      onError: () => toast.error('No se pudo enviar el correo'),
      onFinish: () => setSendingEmail(false),
    });
  };

  return (
    <AuthenticatedLayout>
      <Head title={`${t('admin.invoices.show.title', 'Factura')} ${invoice.number}`} />

      <PageHeader
        title={`${t('admin.invoices.show.title', 'Factura')} ${invoice.number}`}
        description={formatDate(invoice.created_at)}
        icon={FileText}
        breadcrumbs={[
          { label: 'Dashboard', href: route('dashboard') },
          { label: t('admin.invoices.index.page_title', 'Facturas'), href: route('admin.invoices.index') },
          { label: invoice.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium transition-colors disabled:opacity-50"
              title={invoice.customer?.email ? `Enviar a ${invoice.customer.email}` : 'Cliente sin email'}
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{sendingEmail ? 'Enviando...' : 'Enviar email'}</span>
            </button>
            <a
              href={route('admin.invoices.download-pdf', invoice.id)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </a>
            <Link
              href={route('admin.invoices.index')}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('admin.common.back', 'Volver')}
            </Link>
          </div>
        }
      />

      <div className="p-4 lg:p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('admin.invoices.show.status', 'Estado')}</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold mt-1 ${statusConfig.color}`}>
                    <CheckCircle2 className="w-4 h-4" />
                    {statusConfig.label}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t('admin.invoices.show.total', 'Total')}</p>
                  <p className="text-2xl font-bold">{formatAmount(invoice.total_usd)}</p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {t('admin.invoices.show.items', 'Ítems')}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">{t('admin.invoices.show.product', 'Producto')}</th>
                      <th className="px-4 py-3 text-center font-medium">{t('admin.invoices.show.qty', 'Cant')}</th>
                      <th className="px-4 py-3 text-right font-medium">{t('admin.invoices.show.price', 'Precio')}</th>
                      <th className="px-4 py-3 text-right font-medium">{t('admin.invoices.show.subtotal', 'Subtotal')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invoice.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                              {item.product?.image_url ? (
                                <img src={item.product.image_url} alt="" className="h-full w-full object-cover rounded" />
                              ) : (
                                <Package className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{item.product?.name || '—'}</p>
                              <p className="text-xs text-muted-foreground">{item.product?.sku || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">{formatAmount(item.price_usd)}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatAmount(item.subtotal_usd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payments */}
            {invoice.payments?.length > 0 && (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    {t('admin.invoices.show.payments', 'Pagos')}
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {invoice.payments.map((payment) => (
                    <div key={payment.id} className="px-6 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="capitalize text-sm">{payment.method}</span>
                      </div>
                      <span className="font-medium">{formatAmount(payment.amount_usd)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                {t('admin.invoices.show.customer', 'Cliente')}
              </h3>
              {invoice.customer ? (
                <div className="space-y-2">
                  <p className="font-medium">{invoice.customer.name}</p>
                  {invoice.customer.email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      {invoice.customer.email}
                    </p>
                  )}
                  {invoice.customer.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {invoice.customer.phone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">{t('admin.invoices.walking_customer', 'Cliente ocasional')}</p>
              )}
            </div>

            {/* Internal Notes */}
            <InternalNotesCard invoice={invoice} />

            {/* Timeline */}
            <InvoiceTimeline timeline={timeline} />

          {/* Invoice Details */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t('admin.invoices.show.details', 'Detalles')}
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('admin.invoices.show.number', 'Número')}</span>
                  <span className="font-medium">{invoice.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('admin.invoices.show.date', 'Fecha')}</span>
                  <span>{formatDate(invoice.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('admin.invoices.show.type', 'Tipo')}</span>
                  <span className="capitalize">{invoice.document_type}</span>
                </div>
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between text-base font-semibold">
                    <span>{t('admin.invoices.show.total', 'Total')}</span>
                    <span>{formatAmount(invoice.total_usd)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
