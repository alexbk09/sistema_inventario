import { Edit, Trash2, BarChart2, Package, Star, AlertTriangle } from 'lucide-react';
import AdminPagination from '@/Components/admin/AdminPagination.jsx';
import { useI18n } from '@/Hooks/useI18n';

function StockBadge({ stock, minStock }) {
    const value = Number(stock) || 0;
    const min = Number(minStock) || 0;
    const isZero = value === 0;
    const isLow = min > 0 ? value < min : value <= 5;

    if (isZero) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Sin stock
            </span>
        );
    }
    if (isLow) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <AlertTriangle className="w-2.5 h-2.5" />
                {value} u.
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {value} u.
        </span>
    );
}

export default function ProductGrid({
    data = [],
    page = 1,
    totalPages = 1,
    onPageChange,
    onEdit,
    onDelete,
    onInventory,
    formatPrice,
}) {
    const { t } = useI18n();

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">{t('admin.products.empty.title', 'Sin productos')}</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                    {t('admin.products.empty.description', 'No hay productos que coincidan con los filtros actuales.')}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
                {data.map((product) => (
                    <div
                        key={product.id}
                        className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all duration-200"
                    >
                        {/* Image */}
                        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                            {product.image_url ? (
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-10 h-10 text-muted-foreground/40" />
                                </div>
                            )}

                            {/* Featured badge */}
                            {product.is_featured && (
                                <div className="absolute top-2 left-2">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-900">
                                        <Star className="w-2.5 h-2.5 fill-current" />
                                        {t('admin.products.values.featured', 'Destacado')}
                                    </span>
                                </div>
                            )}

                            {/* Stock badge */}
                            <div className="absolute top-2 right-2">
                                <StockBadge stock={product.stock} minStock={product.effective_min_stock} />
                            </div>

                            {/* Actions overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-end justify-end p-2 gap-1.5 opacity-0 group-hover:opacity-100">
                                {onInventory && (
                                    <button
                                        type="button"
                                        onClick={() => onInventory(product)}
                                        title={t('admin.products.index.actions.view_movements', 'Ver inventario')}
                                        className="p-2 rounded-lg bg-white/90 text-foreground hover:bg-white shadow-sm transition-colors"
                                    >
                                        <BarChart2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                {onEdit && (
                                    <button
                                        type="button"
                                        onClick={() => onEdit(product)}
                                        title={t('admin.common.table.edit', 'Editar')}
                                        className="p-2 rounded-lg bg-white/90 text-blue-600 hover:bg-white shadow-sm transition-colors"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        type="button"
                                        onClick={() => onDelete(product)}
                                        title={t('admin.common.table.delete', 'Eliminar')}
                                        className="p-2 rounded-lg bg-white/90 text-destructive hover:bg-white shadow-sm transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="p-3">
                            <p className="text-[10px] font-mono text-muted-foreground mb-0.5 tracking-wide">{product.sku || '—'}</p>
                            <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug mb-2" title={product.name}>
                                {product.name}
                            </h3>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-base font-bold text-foreground">
                                    {formatPrice ? formatPrice(product) : `$${Number(product.price_usd || 0).toFixed(2)}`}
                                </span>
                                {product.category?.name && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground truncate max-w-[90px]">
                                        {product.category.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="px-1">
                <AdminPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
            </div>
        </div>
    );
}
