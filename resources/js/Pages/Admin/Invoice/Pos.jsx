import { Head, useForm, router } from '@inertiajs/react';
import { useMemo, useState, useRef, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, X, ChevronRight, Save, Calculator, Percent, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Pos({ products, customers, warehouses = [], adminCurrencyContext = {} }) {
  const { t } = useI18n();
  const { formatNumber, formatCurrency } = useLocaleFormat();
  const { displayCurrency, formatPriceFromUsd } = useConfiguredCurrencyRates();
  const formatActiveAmount = (value) => formatPriceFromUsd(Number(value || 0), displayCurrency);
  const searchInputRef = useRef(null);

  const { data, setData, post, transform, processing, reset } = useForm({
    customer_id: '',
    document_type: 'invoice',
    items: [],
    warehouse_id: warehouses[0]?.id || '',
    payments: [{ method: 'cash', amount_usd: 0 }],
    notes: '',
    discount_mode: 'fixed',
    discount_val: 0,
  });

  const [search, setSearch] = useState('');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Focus search on mount and after adding item
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products.slice(0, 24);
    return products.filter((p) => {
      const name = String(p.name ?? '').toLowerCase();
      const sku = String(p.sku ?? '').toLowerCase();
      const barcode = String(p.barcode ?? '').toLowerCase();
      return name.includes(term) || sku.includes(term) || barcode.includes(term);
    }).slice(0, 24);
  }, [products, search]);

  const cartItems = useMemo(() => {
    return data.items.map((item) => {
      const product = products.find((p) => String(p.id) === String(item.product_id));
      const price = Number(product?.price_usd ?? 0);
      const quantity = Number(item.quantity ?? 1);
      const gross = price * quantity;
      const mode = item.disc_mode ?? 'fixed';
      const val = Number(item.disc_val ?? 0);
      const discount = Math.min(mode === 'pct' ? gross * val / 100 : val, gross);
      return {
        ...item,
        product,
        price,
        quantity,
        discount,
        subtotal: gross - discount,
      };
    });
  }, [data.items, products]);

  const totals = useMemo(() => {
    const grossUsd = cartItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const lineDiscountUsd = cartItems.reduce((sum, it) => sum + it.discount, 0);
    const subtotalUsd = grossUsd - lineDiscountUsd;
    const gMode = data.discount_mode ?? 'fixed';
    const gVal = Number(data.discount_val ?? 0);
    const globalDiscountUsd = Math.min(gMode === 'pct' ? subtotalUsd * gVal / 100 : gVal, subtotalUsd);
    const totalUsd = Math.max(0, subtotalUsd - globalDiscountUsd);
    const totalDiscountUsd = lineDiscountUsd + globalDiscountUsd;
    return {
      grossUsd,
      lineDiscountUsd,
      subtotalUsd,
      globalDiscountUsd,
      totalDiscountUsd,
      totalUsd,
      totalDisplay: formatActiveAmount(totalUsd),
      itemsCount: cartItems.reduce((sum, it) => sum + it.quantity, 0),
    };
  }, [cartItems, data.discount_mode, data.discount_val]);

  const updateLineDiscount = (productId, patch) => {
    setData('items', data.items.map((it) =>
      String(it.product_id) === String(productId) ? { ...it, ...patch } : it
    ));
  };

  const addToCart = (product) => {
    const existing = data.items.find((it) => String(it.product_id) === String(product.id));
    if (existing) {
      updateQuantity(product.id, existing.quantity + 1);
    } else {
      setData('items', [...data.items, { product_id: product.id, quantity: 1, unit_price_usd: product.price_usd }]);
    }
    setSearch('');
    searchInputRef.current?.focus();
    toast.success(t('admin.pos.added', 'Agregado'), { position: 'top-center', duration: 800 });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setData('items', data.items.map((it) =>
      String(it.product_id) === String(productId) ? { ...it, quantity } : it
    ));
  };

  const removeFromCart = (productId) => {
    setData('items', data.items.filter((it) => String(it.product_id) !== String(productId)));
  };

  const clearCart = () => {
    if (confirm(t('admin.pos.confirm_clear', '¿Vaciar carrito?'))) {
      setData('items', []);
      setIsPaymentOpen(false);
    }
  };

  const submitOrder = (e) => {
    e?.preventDefault();
    if (data.items.length === 0) {
      toast.error(t('admin.pos.empty_cart', 'Carrito vacío'), { position: 'top-center' });
      return;
    }
    transform((payload) => ({
      ...payload,
      discount_usd: Number(totals.globalDiscountUsd.toFixed(2)),
      items: cartItems.map((it) => ({
        product_id: it.product_id,
        quantity: it.quantity,
        discount_usd: Number(it.discount.toFixed(2)),
      })),
    }));
    post(route('admin.invoices.store'), {
      onSuccess: () => {
        reset();
        setIsPaymentOpen(false);
        toast.success(t('admin.pos.success', 'Venta registrada'), { position: 'top-center' });
      },
      onError: (err) => {
        toast.error(err?.message || t('admin.pos.error', 'Error al registrar'), { position: 'top-center' });
      },
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'F1') { e.preventDefault(); searchInputRef.current?.focus(); }
      if (e.key === 'F2' && totals.totalUsd > 0) { e.preventDefault(); setIsPaymentOpen(true); }
      if (e.key === 'Escape') { setIsPaymentOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [totals.totalUsd]);

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.pos.title', 'Punto de Venta')} />

      <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-4 p-4">
        {/* Left: Product Search */}
        <div className="flex-1 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin.pos.search_placeholder', 'Buscar producto (F1) — nombre, SKU, código de barras')}
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-ring focus:outline-none"
              />
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 rounded bg-muted">{filteredProducts.length} {t('admin.pos.results', 'resultados')}</span>
              <span>•</span>
              <span>{t('admin.pos.shortcuts', 'F1 Buscar | F2 Pagar | Esc Cerrar')}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <Search className="w-10 h-10 mb-2 opacity-50" />
                <p>{t('admin.pos.no_products', 'Sin resultados')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="group text-left bg-background border border-border rounded-xl p-3 hover:border-primary/60 hover:shadow-sm transition-all active:scale-[0.98]"
                  >
                    <div className="aspect-square rounded-lg bg-muted/50 mb-2 overflow-hidden">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ShoppingCart className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <p className="font-medium text-sm line-clamp-1 text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sku}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-semibold text-sm text-primary">{formatActiveAmount(p.price_usd)}</span>
                      <span className="text-xs text-muted-foreground">Stock: {p.stock}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart */}
        <div className="w-full lg:w-[420px] flex flex-col bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">{t('admin.pos.cart', 'Carrito')}</h2>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {totals.itemsCount}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={clearCart} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" title={t('admin.pos.clear', 'Vaciar')}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mb-2 opacity-50" />
                <p>{t('admin.pos.empty_cart', 'Carrito vacío')}</p>
                <p className="text-xs mt-1">{t('admin.pos.add_products', 'Agrega productos desde la lista')}</p>
              </div>
            ) : (
              cartItems.map((it) => (
                <div key={it.product_id} className="bg-background border border-border rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-muted/50 overflow-hidden shrink-0">
                      {it.product?.image_url ? (
                        <img src={it.product.image_url} alt={it.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">N/A</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{it.product?.name}</p>
                      <p className="text-xs text-muted-foreground">{formatActiveAmount(it.price)} c/u</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQuantity(it.product_id, it.quantity - 1)} className="p-1.5 rounded-lg hover:bg-muted">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{it.quantity}</span>
                      <button onClick={() => updateQuantity(it.product_id, it.quantity + 1)} className="p-1.5 rounded-lg hover:bg-muted">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(it.product_id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2 pl-15">
                    <div className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                      <div className="flex items-center border border-border rounded-lg overflow-hidden">
                        <input
                          type="number"
                          min="0"
                          value={it.disc_val ?? 0}
                          onChange={(e) => updateLineDiscount(it.product_id, { disc_val: Math.max(0, parseFloat(e.target.value) || 0) })}
                          className="w-16 px-2 py-1 text-xs bg-transparent focus:outline-none"
                          placeholder="Desc."
                        />
                        <button
                          type="button"
                          onClick={() => updateLineDiscount(it.product_id, { disc_mode: (it.disc_mode ?? 'fixed') === 'fixed' ? 'pct' : 'fixed' })}
                          className="px-2 py-1 text-xs font-semibold bg-muted hover:bg-muted/70 border-l border-border"
                          title="Alternar % / monto fijo"
                        >
                          {(it.disc_mode ?? 'fixed') === 'pct' ? '%' : '$'}
                        </button>
                      </div>
                      {it.discount > 0 && (
                        <span className="text-xs text-emerald-600">−{formatActiveAmount(it.discount)}</span>
                      )}
                    </div>
                    <p className="font-semibold text-sm">{formatActiveAmount(it.subtotal)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals & Pay */}
          <div className="p-4 border-t border-border bg-muted/30 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('admin.pos.subtotal', 'Subtotal')}</span>
              <span className="font-medium">{formatActiveAmount(totals.grossUsd)}</span>
            </div>
            {totals.lineDiscountUsd > 0 && (
              <div className="flex items-center justify-between text-sm text-emerald-600">
                <span>Descuento por línea</span>
                <span>−{formatActiveAmount(totals.lineDiscountUsd)}</span>
              </div>
            )}

            {/* Global discount */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Percent className="w-3.5 h-3.5" /> Descuento global
              </span>
              <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background">
                <input
                  type="number"
                  min="0"
                  value={data.discount_val ?? 0}
                  onChange={(e) => setData('discount_val', Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-16 px-2 py-1 text-xs bg-transparent focus:outline-none text-right"
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={() => setData('discount_mode', (data.discount_mode ?? 'fixed') === 'fixed' ? 'pct' : 'fixed')}
                  className="px-2 py-1 text-xs font-semibold bg-muted hover:bg-muted/70 border-l border-border"
                  title="Alternar % / monto fijo"
                >
                  {(data.discount_mode ?? 'fixed') === 'pct' ? '%' : '$'}
                </button>
              </div>
            </div>
            {totals.globalDiscountUsd > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-600">
                <span>Aplicado</span>
                <span>−{formatActiveAmount(totals.globalDiscountUsd)}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="font-semibold">{t('admin.pos.total', 'Total')}</span>
              <span className="font-bold text-lg text-primary">{totals.totalDisplay}</span>
            </div>

            <button
              onClick={() => setIsPaymentOpen(true)}
              disabled={cartItems.length === 0 || processing}
              className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              {t('admin.pos.pay', 'Pagar')} {totals.totalDisplay}
              <span className="text-xs opacity-80">(F2)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsPaymentOpen(false)} />
          <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                {t('admin.pos.payment', 'Resumen de pago')}
              </h3>
              <button onClick={() => setIsPaymentOpen(false)} className="p-1 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-1">{t('admin.pos.total_to_pay', 'Total a pagar')}</p>
              <p className="text-3xl font-bold text-primary">{totals.totalDisplay}</p>
            </div>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.pos.customer', 'Cliente (opcional)')}</label>
                <select
                  value={data.customer_id}
                  onChange={(e) => setData('customer_id', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                >
                  <option value="">{t('admin.pos.walking_customer', 'Cliente ocasional')}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.pos.payment_method', 'Método de pago')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setData('payments', [{ method: 'cash', amount_usd: totals.totalUsd }])}
                    className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      data.payments[0]?.method === 'cash' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/60'
                    }`}
                  >
                    <Banknote className="w-4 h-4" /> {t('admin.pos.cash', 'Efectivo')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setData('payments', [{ method: 'card', amount_usd: totals.totalUsd }])}
                    className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      data.payments[0]?.method === 'card' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/60'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" /> {t('admin.pos.card', 'Tarjeta')}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.pos.notes', 'Notas (opcional)')}</label>
                <textarea
                  value={data.notes}
                  onChange={(e) => setData('notes', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none focus:ring-2 focus:ring-ring focus:outline-none"
                  placeholder={t('admin.pos.notes_placeholder', 'Referencia, instrucciones...')}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsPaymentOpen(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                {t('admin.common.cancel', 'Cancelar')}
              </button>
              <button
                type="button"
                onClick={submitOrder}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {processing ? t('admin.common.saving', 'Guardando...') : t('admin.pos.confirm_pay', 'Confirmar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
