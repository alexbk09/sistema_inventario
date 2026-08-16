import { useState, useEffect } from 'react';
import { X, ArrowRight, Check, X as XIcon } from 'lucide-react';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';
import { useI18n } from '@/Hooks/useI18n';

export default function ProductCompare({ products = [], isOpen, onClose }) {
  const { t } = useI18n();
  const { displayCurrency, formatPriceFromUsd } = useConfiguredCurrencyRates();
  const formatPrice = (value) => formatPriceFromUsd(Number(value || 0), displayCurrency);

  if (!isOpen || products.length === 0) return null;

  const features = [
    { key: 'price', label: t('shop.compare.price', 'Precio') },
    { key: 'stock', label: t('shop.compare.stock', 'Stock') },
    { key: 'category', label: t('shop.compare.category', 'Categoría') },
    { key: 'sku', label: t('shop.compare.sku', 'SKU') },
    { key: 'description', label: t('shop.compare.description', 'Descripción') },
  ];

  const getFeatureValue = (product, key) => {
    switch (key) {
      case 'price':
        return formatPrice(product.price_usd);
      case 'stock':
        return product.stock > 0 ? `${product.stock} ${t('shop.compare.available', 'disponibles')}` : t('shop.compare.out_of_stock', 'Agotado');
      case 'category':
        return product.category?.name || '-';
      case 'sku':
        return product.sku || '-';
      case 'description':
        return product.description || '-';
      default:
        return '-';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-background rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t('shop.compare.title', 'Comparar Productos')}</h2>
            <p className="text-sm text-muted-foreground">{products.length} {t('shop.compare.products_selected', 'productos seleccionados')}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Table */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Feature Labels */}
            <div className="space-y-4">
              <div className="h-32" /> {/* Spacer for product images */}
              {features.map((feature) => (
                <div key={feature.key} className="h-20 flex items-center font-semibold text-sm">
                  {feature.label}
                </div>
              ))}
            </div>

            {/* Product Columns */}
            {products.map((product) => (
              <div key={product.id} className="space-y-4">
                {/* Product Image */}
                <div className="h-32 flex items-center justify-center bg-muted rounded-lg overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-muted-foreground text-4xl">📦</div>
                  )}
                </div>

                {/* Product Name */}
                <div className="h-20 flex items-center">
                  <p className="font-semibold text-sm line-clamp-2">{product.name}</p>
                </div>

                {/* Feature Values */}
                {features.map((feature) => (
                  <div key={feature.key} className="h-20 flex items-center text-sm">
                    {getFeatureValue(product, feature.key)}
                  </div>
                ))}

                {/* Add to Cart Button */}
                <div className="pt-4">
                  <button className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                    {t('shop.compare.add_to_cart', 'Agregar al carrito')}
                  </button>
                </div>
              </div>
            ))}

            {/* Empty column if less than 3 products */}
            {[...Array(3 - products.length)].map((_, i) => (
              <div key={`empty-${i}`} className="space-y-4 border-2 border-dashed border-border rounded-lg p-4">
                <div className="h-32 flex items-center justify-center bg-muted/50 rounded-lg">
                  <ArrowRight className="w-12 h-12 text-muted-foreground opacity-50" />
                </div>
                <div className="h-20" />
                {features.map((feature) => (
                  <div key={feature.key} className="h-20 flex items-center text-sm text-muted-foreground">
                    -
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t border-border p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            {t('shop.compare.close', 'Cerrar')}
          </button>
          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            {t('shop.compare.add_all_to_cart', 'Agregar todos al carrito')}
          </button>
        </div>
      </div>
    </div>
  );
}
