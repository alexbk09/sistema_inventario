import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';

export default function SettingsIndex({ general, location, branding, billing, currency, store, inventory, warehouses, security, qr, warehouseOptions = [] }) {
    const { data, setData, put, processing, errors } = useForm({
        general: general ?? {},
        location: location ?? {},
        branding: branding ?? {},
        billing: billing ?? {},
        currency: currency ?? {},
        store: store ?? {},
        inventory: inventory ?? {},
        warehouses: warehouses ?? {},
        security: security ?? {},
        qr: qr ?? {},
    });

    const handleChange = (section, field) => (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setData(section, {
            ...data[section],
            [field]: value,
        });
    };

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.settings.update'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Configuración" />

            <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-semibold text-slate-900 mb-6">Configuración general</h1>

                <form onSubmit={submit} className="space-y-8">
                    {/* Datos de empresa */}
                    <section className="bg-white shadow-sm rounded-lg p-6 space-y-4">
                        <h2 className="text-lg font-medium text-slate-900">Datos de empresa</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Nombre de la empresa *</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.general.company_name || ''}
                                    onChange={handleChange('general', 'company_name')}
                                />
                                {errors['general.company_name'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['general.company_name']}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Nombre comercial</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.general.trade_name || ''}
                                    onChange={handleChange('general', 'trade_name')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">RIF / NIT</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.general.tax_id || ''}
                                    onChange={handleChange('general', 'tax_id')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Email</label>
                                <input
                                    type="email"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.general.email || ''}
                                    onChange={handleChange('general', 'email')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Teléfono</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.general.phone || ''}
                                    onChange={handleChange('general', 'phone')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">WhatsApp</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.general.whatsapp || ''}
                                    onChange={handleChange('general', 'whatsapp')}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Inventario */}
                    <section className="bg-white shadow-sm rounded-lg p-6 space-y-4">
                        <h2 className="text-lg font-medium text-slate-900">Inventario</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    id="allow_negative_stock"
                                    type="checkbox"
                                    className="rounded border-slate-300 text-sky-600 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                                    checked={!!data.inventory.allow_negative_stock}
                                    onChange={handleChange('inventory', 'allow_negative_stock')}
                                />
                                <label htmlFor="allow_negative_stock" className="text-sm text-slate-700">
                                    Permitir stock negativo
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Stock mínimo por defecto</label>
                                <input
                                    type="number"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.inventory.default_min_stock ?? 0}
                                    onChange={handleChange('inventory', 'default_min_stock')}
                                />
                                {errors['inventory.default_min_stock'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['inventory.default_min_stock']}</p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Multi-bodega / Ventas */}
                    <section className="bg-white shadow-sm rounded-lg p-6 space-y-4">
                        <h2 className="text-lg font-medium text-slate-900">Multi-bodega y ventas</h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    id="require_warehouse_on_invoice"
                                    type="checkbox"
                                    className="rounded border-slate-300 text-sky-600 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                                    checked={!!data.warehouses.require_warehouse_on_invoice}
                                    onChange={handleChange('warehouses', 'require_warehouse_on_invoice')}
                                />
                                <label htmlFor="require_warehouse_on_invoice" className="text-sm text-slate-700">
                                    Requerir seleccionar bodega/sucursal en las facturas
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Bodega por defecto para ventas</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.warehouses.default_warehouse_id ?? ''}
                                    onChange={handleChange('warehouses', 'default_warehouse_id')}
                                >
                                    <option value="">Sin bodega por defecto</option>
                                    {(warehouseOptions || []).map((w) => (
                                        <option key={w.id} value={w.id}>
                                            {w.name} ({w.code})
                                        </option>
                                    ))}
                                </select>
                                {errors['warehouses.default_warehouse_id'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['warehouses.default_warehouse_id']}</p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Ubicación */}
                    <section className="bg-white shadow-sm rounded-lg p-6 space-y-4">
                        <h2 className="text-lg font-medium text-slate-900">Ubicación</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">Dirección</label>
                                <textarea
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    rows={2}
                                    value={data.location.address || ''}
                                    onChange={handleChange('location', 'address')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Ciudad</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.location.city || ''}
                                    onChange={handleChange('location', 'city')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Estado / Región</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.location.state || ''}
                                    onChange={handleChange('location', 'state')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">País</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.location.country || ''}
                                    onChange={handleChange('location', 'country')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">URL de Google Maps</label>
                                <input
                                    type="url"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.location.google_maps_url || ''}
                                    onChange={handleChange('location', 'google_maps_url')}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Branding */}
                    <section className="bg-white shadow-sm rounded-lg p-6 space-y-4">
                        <h2 className="text-lg font-medium text-slate-900">Branding</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Logo (URL)</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.branding.logo_url || ''}
                                    onChange={handleChange('branding', 'logo_url')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Logo oscuro (URL)</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.branding.logo_dark_url || ''}
                                    onChange={handleChange('branding', 'logo_dark_url')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Favicon (URL)</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.branding.favicon_url || ''}
                                    onChange={handleChange('branding', 'favicon_url')}
                                />
                            </div>
                            <div className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700">Color primario</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                        value={data.branding.primary_color || ''}
                                        onChange={handleChange('branding', 'primary_color')}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700">Color secundario</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                        value={data.branding.secondary_color || ''}
                                        onChange={handleChange('branding', 'secondary_color')}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Facturación */}
                    <section className="bg-white shadow-sm rounded-lg p-6 space-y-4">
                        <h2 className="text-lg font-medium text-slate-900">Facturación</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Prefijo de factura</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.billing.invoice_prefix || ''}
                                    onChange={handleChange('billing', 'invoice_prefix')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Longitud del número</label>
                                <input
                                    type="number"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.billing.invoice_length || ''}
                                    onChange={handleChange('billing', 'invoice_length')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Impuesto por defecto (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.billing.default_tax_percent || 0}
                                    onChange={handleChange('billing', 'default_tax_percent')}
                                />
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    id="enable_igtf"
                                    type="checkbox"
                                    className="rounded border-slate-300 text-sky-600 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                                    checked={!!data.billing.enable_igtf}
                                    onChange={handleChange('billing', 'enable_igtf')}
                                />
                                <label htmlFor="enable_igtf" className="text-sm text-slate-700">Habilitar IGTF</label>
                            </div>
                        </div>
                    </section>

                    {/* Moneda */}
                    <section className="bg-white shadow-sm rounded-lg p-6 space-y-4">
                        <h2 className="text-lg font-medium text-slate-900">Moneda</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Moneda base</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.currency.base_currency || ''}
                                    onChange={handleChange('currency', 'base_currency')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Segunda moneda</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.currency.secondary_currency || ''}
                                    onChange={handleChange('currency', 'secondary_currency')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Fuente de tasa</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.currency.rate_source || ''}
                                    onChange={handleChange('currency', 'rate_source')}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Seguridad */}
                    <section className="bg-white shadow-sm rounded-lg p-6 space-y-4">
                        <h2 className="text-lg font-medium text-slate-900">Seguridad</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Longitud mínima de contraseña</label>
                                <input
                                    type="number"
                                    min={6}
                                    max={64}
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.security.min_password_length ?? 8}
                                    onChange={handleChange('security', 'min_password_length')}
                                />
                                {errors['security.min_password_length'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['security.min_password_length']}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Intentos fallidos antes de bloqueo</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.security.max_failed_logins ?? 5}
                                    onChange={handleChange('security', 'max_failed_logins')}
                                />
                                {errors['security.max_failed_logins'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['security.max_failed_logins']}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-6">
                                <input
                                    id="enable_two_factor"
                                    type="checkbox"
                                    className="rounded border-slate-300 text-sky-600 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                                    checked={!!data.security.enable_two_factor}
                                    onChange={handleChange('security', 'enable_two_factor')}
                                />
                                <label htmlFor="enable_two_factor" className="text-sm text-slate-700">
                                    Habilitar 2FA (para futuros inicios de sesión)
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* QR */}
                    <section className="bg-white shadow-sm rounded-lg p-6 space-y-4">
                        <h2 className="text-lg font-medium text-slate-900">QR y enlaces rápidos</h2>
                        <p className="text-sm text-slate-600">
                            Estas URLs se usarán como base para generar códigos QR de facturas, productos y contacto.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">URL base para facturas</label>
                                <input
                                    type="url"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.qr.invoice_base_url || ''}
                                    onChange={handleChange('qr', 'invoice_base_url')}
                                    placeholder="https://midominio.com/facturas/{numero}"
                                />
                                {errors['qr.invoice_base_url'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['qr.invoice_base_url']}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">URL base para productos</label>
                                <input
                                    type="url"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.qr.product_base_url || ''}
                                    onChange={handleChange('qr', 'product_base_url')}
                                    placeholder="https://midominio.com/productos/{sku}"
                                />
                                {errors['qr.product_base_url'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['qr.product_base_url']}</p>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">URL de contacto por WhatsApp</label>
                                <input
                                    type="url"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.qr.whatsapp_contact_url || ''}
                                    onChange={handleChange('qr', 'whatsapp_contact_url')}
                                    placeholder="https://wa.me/58XXXXXXXXXX?text=Hola%20tengo%20una%20consulta"
                                />
                                {errors['qr.whatsapp_contact_url'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['qr.whatsapp_contact_url']}</p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Tienda pública */}
                    <section className="bg-white shadow-sm rounded-lg p-6 space-y-4">
                        <h2 className="text-lg font-medium text-slate-900">Tienda pública</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Título de inicio</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.store.home_title || ''}
                                    onChange={handleChange('store', 'home_title')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Subtítulo</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.store.home_subtitle || ''}
                                    onChange={handleChange('store', 'home_subtitle')}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">Texto de contacto</label>
                                <textarea
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    rows={2}
                                    value={data.store.contact_text || ''}
                                    onChange={handleChange('store', 'contact_text')}
                                />
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center px-4 py-2 bg-sky-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-sky-700 focus:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {processing ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
