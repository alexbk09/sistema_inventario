import { Head, Link, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import {
  ArrowLeft, Gift, ShoppingBag, Mail, Phone, MapPin, User,
  TrendingUp, Clock, CheckCircle2, AlertCircle, Star, Package,
  CreditCard, Calendar, FileText, Wallet, Activity,
  MessageSquare, Phone as PhoneIcon, Users, AtSign,
  Pin, PinOff, Pencil, Trash2, Plus, X, Save, ChevronDown,
} from 'lucide-react';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending:   { label: 'Pendiente',  color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  paid:      { label: 'Pagada',     color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled: { label: 'Cancelada',  color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  shipped:   { label: 'Enviada',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  delivered: { label: 'Entregada',  color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
}

function StatCard({ icon: Icon, iconColor, iconBg, label, value, sub }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
        <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const NOTE_TYPES = {
  note:    { label: 'Nota',     icon: MessageSquare, color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  call:    { label: 'Llamada',  icon: PhoneIcon,     color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  meeting: { label: 'Reunión',  icon: Users,         color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
  email:   { label: 'Email',    icon: AtSign,        color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
}

function CustomerNotes({ customerId, initialNotes = [] }) {
  const notes = initialNotes
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [body, setBody] = useState('')
  const [type, setType] = useState('note')
  const [busy, setBusy] = useState(false)

  const openNew = () => { setEditingId(null); setBody(''); setType('note'); setShowForm(true) }
  const openEdit = (n) => { setEditingId(n.id); setBody(n.body); setType(n.type); setShowForm(true) }
  const cancel = () => { setShowForm(false); setEditingId(null); setBody(''); setType('note') }

  const submit = (e) => {
    e.preventDefault()
    if (!body.trim()) return
    setBusy(true)
    const url = editingId
      ? route('admin.customers.notes.update', { customer: customerId, note: editingId })
      : route('admin.customers.notes.store', { customer: customerId })
    const method = editingId ? 'put' : 'post'
    router[method](url, { body: body.trim(), type }, {
      preserveScroll: true,
      onSuccess: () => { toast.success(editingId ? 'Nota actualizada' : 'Nota guardada'); cancel() },
      onError: () => toast.error('No se pudo guardar la nota'),
      onFinish: () => setBusy(false),
    })
  }

  const deleteNote = (id) => {
    if (!confirm('¿Eliminar esta nota?')) return
    router.delete(route('admin.customers.notes.destroy', { customer: customerId, note: id }), {
      preserveScroll: true,
      onSuccess: () => toast.success('Nota eliminada'),
    })
  }

  const togglePin = (id) => {
    router.patch(route('admin.customers.notes.pin', { customer: customerId, note: id }), {}, {
      preserveScroll: true,
    })
  }

  const pinnedNotes = notes.filter(n => n.is_pinned)
  const normalNotes = notes.filter(n => !n.is_pinned)
  const sortedNotes = [...pinnedNotes, ...normalNotes]

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          Notas internas
          {notes.length > 0 && (
            <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{notes.length}</span>
          )}
        </h3>
        {!showForm && (
          <button
            onClick={openNew}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva nota
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={submit} className="mb-4 space-y-3 p-3 bg-muted/40 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="text-xs border border-border rounded-lg px-2 py-1.5 bg-card focus:ring-1 focus:ring-ring focus:outline-none"
            >
              {Object.entries(NOTE_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground ml-auto">
              {editingId ? 'Editando nota' : 'Nueva nota'}
            </span>
          </div>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={3}
            placeholder="Escribe una nota sobre este cliente..."
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-ring focus:outline-none resize-none"
            autoFocus
          />
          <div className="flex items-center gap-2 justify-end">
            <button type="button" onClick={cancel} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
            <button
              type="submit"
              disabled={busy || !body.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              {editingId ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      {/* Notes list */}
      {sortedNotes.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-30" />
          <p className="text-xs text-muted-foreground">Sin notas aún. Añade la primera.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {sortedNotes.map(note => {
            const cfg = NOTE_TYPES[note.type] ?? NOTE_TYPES.note
            const NoteIcon = cfg.icon
            return (
              <div
                key={note.id}
                className={`group relative p-3 rounded-lg border transition-colors ${
                  note.is_pinned
                    ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-900/10'
                    : 'border-border hover:bg-muted/30'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 p-1.5 rounded-md flex-shrink-0 ${cfg.color}`}>
                    <NoteIcon className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">{note.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-2">
                      <span className="font-medium">{note.user_name}</span>
                      <span>·</span>
                      <span>{note.created_at ? new Date(note.created_at).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                      {note.is_pinned && <span className="text-amber-500 font-semibold">· Fijada</span>}
                    </p>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => togglePin(note.id)}
                      className="p-1 rounded hover:bg-muted transition-colors"
                      title={note.is_pinned ? 'Desfijar' : 'Fijar'}
                    >
                      {note.is_pinned
                        ? <PinOff className="w-3.5 h-3.5 text-amber-500" />
                        : <Pin className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                    <button
                      onClick={() => openEdit(note)}
                      className="p-1 rounded hover:bg-muted transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-1 rounded hover:bg-red-50 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CreditInlineEditor({ creditAccount, formatActiveAmount, creditUsedPct }) {
  const [editing, setEditing] = useState(false)
  const [limitVal, setLimitVal] = useState(creditAccount.credit_limit_usd ?? '')
  const [statusVal, setStatusVal] = useState(creditAccount.status ?? 'active')
  const [busy, setBusy] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    setBusy(true)
    router.patch(
      route('admin.credits.limit.update', { account: creditAccount.id }),
      { credit_limit_usd: limitVal === '' ? null : limitVal, currency_code: 'USD', status: statusVal },
      {
        preserveScroll: true,
        onSuccess: () => { toast.success('Crédito actualizado'); setEditing(false) },
        onError: () => toast.error('No se pudo actualizar'),
        onFinish: () => setBusy(false),
      }
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          Cuenta de crédito
        </h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Editar
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Límite de crédito (USD)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={limitVal}
              onChange={e => setLimitVal(e.target.value)}
              placeholder="Sin límite"
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-ring focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Estado</label>
            <select
              value={statusVal}
              onChange={e => setStatusVal(e.target.value)}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-card focus:ring-1 focus:ring-ring focus:outline-none"
            >
              <option value="active">Activa</option>
              <option value="suspended">Suspendida</option>
              <option value="closed">Cerrada</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Guardar
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Saldo pendiente:</span>
            <span className={`font-semibold ${creditAccount.balance_usd > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {formatActiveAmount(creditAccount.balance_usd)}
            </span>
          </div>
          {creditAccount.credit_limit_usd !== null && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Límite:</span>
                <span className="font-medium text-foreground">{formatActiveAmount(creditAccount.credit_limit_usd)}</span>
              </div>
              <div className="mt-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${creditUsedPct > 80 ? 'bg-red-500' : creditUsedPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${creditUsedPct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{creditUsedPct?.toFixed(0)}% del límite usado</p>
              </div>
            </>
          )}
          {creditAccount.credit_limit_usd === null && (
            <p className="text-xs text-muted-foreground italic">Sin límite establecido</p>
          )}
          <div className="flex justify-between pt-1">
            <span className="text-muted-foreground">Estado:</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              creditAccount.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : creditAccount.status === 'suspended' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {creditAccount.status === 'active' ? 'Activa' : creditAccount.status === 'suspended' ? 'Suspendida' : 'Cerrada'}
            </span>
          </div>
          <div className="pt-2 border-t border-border">
            <Link
              href={route('admin.credits.show', creditAccount.id)}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Ver movimientos completos →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

const SCORE_TIER = {
  excellent: { label: 'Excelente', ring: 'text-emerald-500', bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  good:      { label: 'Bueno',     ring: 'text-blue-500',    bar: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  average:   { label: 'Regular',   ring: 'text-amber-500',   bar: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  low:       { label: 'Bajo',      ring: 'text-red-500',     bar: 'bg-red-500',     badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

const SCORE_FACTORS = [
  { key: 'recency',     label: 'Recencia',    max: 30 },
  { key: 'frequency',   label: 'Frecuencia',  max: 30 },
  { key: 'monetary',    label: 'Monto',       max: 25 },
  { key: 'punctuality', label: 'Puntualidad', max: 15 },
]

function ScoreCard({ score = 0, tier = 'low', breakdown = {} }) {
  const cfg = SCORE_TIER[tier] ?? SCORE_TIER.low
  const circumference = 2 * Math.PI * 26
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          Score del cliente
        </h3>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="26" fill="none" strokeWidth="6" className="stroke-muted" />
            <circle
              cx="30" cy="30" r="26" fill="none" strokeWidth="6" strokeLinecap="round"
              className={cfg.ring} stroke="currentColor"
              strokeDasharray={circumference} strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-foreground">{score}</span>
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
          {SCORE_FACTORS.map(f => {
            const val = Number(breakdown?.[f.key] ?? 0)
            const pct = Math.min(100, (val / f.max) * 100)
            return (
              <div key={f.key}>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                  <span>{f.label}</span>
                  <span>{val}/{f.max}</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Show({ customer, invoices, adminCurrencyContext = {}, customerMoney = {}, creditAccount = null, notes = [] }) {
  const { t } = useI18n()
  const { formatCurrency, formatDateTime, formatNumber } = useLocaleFormat()
  const { displayCurrency, comparisonCurrency, formatPriceFromUsd, hasRateForCurrency } = useConfiguredCurrencyRates()

  const secondaryCurrency = comparisonCurrency && comparisonCurrency !== displayCurrency && hasRateForCurrency(comparisonCurrency)
    ? comparisonCurrency : null
  const formatActiveAmount = (value, currency = displayCurrency) => formatPriceFromUsd(Number(value || 0), currency)
  const visibleCurrencyCodes = Array.isArray(adminCurrencyContext?.codes) && adminCurrencyContext.codes.length > 0
    ? adminCurrencyContext.codes
    : [displayCurrency, ...(secondaryCurrency ? [secondaryCurrency] : [])].filter(Boolean)
  const currencyColumns = [...new Set(visibleCurrencyCodes)]
  const formatServerAmount = (code, value) => formatCurrency(Number(value || 0), code)

  const lifetimeDisplay = useMemo(() => {
    const totals = customerMoney?.lifetime_spent?.totals ?? {}
    return currencyColumns.map(code => ({
      code,
      value: totals[code] !== undefined
        ? formatServerAmount(code, totals[code])
        : formatActiveAmount(customer.lifetime_spent_usd || 0, code),
    }))
  }, [customerMoney, currencyColumns, customer.lifetime_spent_usd])

  const initials = (customer.name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  const creditUsedPct = creditAccount?.credit_limit_usd
    ? Math.min(100, (creditAccount.balance_usd / creditAccount.credit_limit_usd) * 100)
    : null

  return (
    <AuthenticatedLayout>
      <Head title={`Cliente: ${customer.name}`} />
      <div className="space-y-6 pb-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold shadow">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Cliente desde {customer.created_at ? new Date(customer.created_at).toLocaleDateString('es-VE', { year: 'numeric', month: 'long' }) : '—'}
              </p>
            </div>
          </div>
          <Link
            href={route('admin.customers.index')}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={ShoppingBag}
            iconColor="text-blue-600"
            iconBg="bg-blue-50 dark:bg-blue-900/20"
            label="Total gastado"
            value={lifetimeDisplay[0]?.value ?? '—'}
            sub={lifetimeDisplay[1] ? lifetimeDisplay[1].value : undefined}
          />
          <StatCard
            icon={FileText}
            iconColor="text-violet-600"
            iconBg="bg-violet-50 dark:bg-violet-900/20"
            label="Facturas totales"
            value={formatNumber(customer.invoices_count)}
            sub={`${customer.paid_count} pagadas · ${customer.pending_count} pendientes`}
          />
          <StatCard
            icon={TrendingUp}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50 dark:bg-emerald-900/20"
            label={`Ticket promedio (${displayCurrency})`}
            value={formatActiveAmount(customer.avg_ticket_usd)}
            sub="por factura pagada"
          />
          <StatCard
            icon={Gift}
            iconColor="text-amber-600"
            iconBg="bg-amber-50 dark:bg-amber-900/20"
            label="Puntos de lealtad"
            value={formatNumber(customer.loyalty_points)}
            sub="1 pto por cada compra"
          />
        </div>

        {/* Body: 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Contacto + Crédito + Stats */}
          <div className="space-y-4">

            {/* Score */}
            <ScoreCard score={customer.score} tier={customer.score_tier} breakdown={customer.score_breakdown} />

            {/* Contacto */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Información de contacto
              </h3>
              {customer.document && (
                <div className="flex items-start gap-3 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-foreground font-mono">{customer.document}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-start gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline truncate">{customer.email}</a>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-start gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <a href={`tel:${customer.phone}`} className="text-foreground hover:underline">{customer.phone}</a>
                </div>
              )}
              {(customer.address || customer.city) && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    {[customer.address, customer.city].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              <div className="flex items-start gap-3 text-sm pt-1 border-t border-border">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Última compra:{' '}
                  <span className="font-medium text-foreground">
                    {customer.last_purchase_at
                      ? `hace ${customer.days_since_purchase}d (${new Date(customer.last_purchase_at).toLocaleDateString('es-VE')})`
                      : 'Sin compras'}
                  </span>
                </span>
              </div>
            </div>

            {/* Producto favorito */}
            {customer.top_product && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-amber-500" />
                  Producto más comprado
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                    <Package className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{customer.top_product}</p>
                    <p className="text-xs text-muted-foreground">{customer.top_product_qty} unidades compradas</p>
                  </div>
                </div>
              </div>
            )}

            {/* Crédito */}
            {creditAccount && (
              <CreditInlineEditor
                creditAccount={creditAccount}
                formatActiveAmount={formatActiveAmount}
                creditUsedPct={creditUsedPct}
              />
            )}
          </div>

          {/* Right: Tabs — Historial | Notas */}
          <div className="lg:col-span-2 space-y-0">
            <RightTabs
              customer={customer}
              invoices={invoices}
              notes={notes}
              currencyColumns={currencyColumns}
              displayCurrency={displayCurrency}
              formatServerAmount={formatServerAmount}
              formatActiveAmount={formatActiveAmount}
            />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}

function RightTabs({ customer, invoices, notes, currencyColumns, displayCurrency, formatServerAmount, formatActiveAmount }) {
  const [activeTab, setActiveTab] = useState('history')

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-border bg-muted/30">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'history'
              ? 'border-primary text-primary bg-background'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Activity className="w-4 h-4" />
          Historial
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{invoices.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'notes'
              ? 'border-primary text-primary bg-background'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Notas
          {notes.length > 0 && (
            <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">{notes.length}</span>
          )}
        </button>
      </div>

      {/* Tab content */}
      <div className="p-5">
        {activeTab === 'history' && (
          <>
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm">Sin compras registradas</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {invoices.map((inv) => {
                  const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.pending
                  return (
                    <div
                      key={inv.id}
                      className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/40 transition group"
                    >
                      <div className="flex-shrink-0">
                        {inv.status === 'paid'
                          ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          : inv.status === 'cancelled'
                          ? <AlertCircle className="w-5 h-5 text-red-400" />
                          : <Clock className="w-5 h-5 text-amber-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-semibold text-foreground">{inv.number}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                            {inv.status_name || cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {inv.created_at ? new Date(inv.created_at).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          {inv.items_count > 0 && ` · ${inv.items_count} ítem${inv.items_count !== 1 ? 's' : ''}`}
                          {inv.points_earned > 0 && ` · +${inv.points_earned} pts`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {currencyColumns.map((code) => (
                          <p key={code} className={`text-sm font-semibold ${code === displayCurrency ? 'text-foreground' : 'text-muted-foreground text-xs'}`}>
                            {inv.document_totals?.[code] !== undefined
                              ? formatServerAmount(code, inv.document_totals[code])
                              : formatActiveAmount(inv.total_usd || 0, code)}
                          </p>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'notes' && (
          <CustomerNotes customerId={customer.id} initialNotes={notes} />
        )}
      </div>
    </div>
  )
}
