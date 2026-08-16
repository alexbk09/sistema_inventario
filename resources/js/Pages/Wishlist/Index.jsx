import { Head } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useCart } from '@/Hooks/useCart';

export default function WishlistIndex({ wishlistItems = [], rate = 0 }) {
  const { t } = useI18n();
  const { displayCurrency, formatPriceFromUsd } = useConfiguredCurrencyRates();
  const { addToCart } = useCart();
  const formatPrice = (value) => formatPriceFromUsd(Number(value || 0), displayCurrency);

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  const handleRemove = (wishlistId) => {
    router.delete(route('wishlist.destroy', wishlistId), {
      preserveScroll: true,
    });
  };

  const handleMoveAllToCart = () => {
    wishlistItems.forEach((item) => {
      if (item.product.stock > 0) {
        addToCart(item.product);
      }
    });
  };

  const inStockItems = wishlistItems.filter(item => item.product.stock > 0);
  const outOfStockItems = wishlistItems.filter(item => item.product.stock <= 0);

  return (
    <AuthenticatedLayout>
      <Head title={t('wishlist.page_title', 'Mi Lista de Deseos')} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
            {t('wishlist.title', 'Mi Lista de Deseos')}
          </h1>
          <p className="text-muted-foreground">
            {t('wishlist.count', `${wishlistItems.length} producto${wishlistItems.length !== 1 ? 's' : ''} en tu lista`, { count: wishlistItems.length })}
          </p>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-24 h-24 mx-auto text-muted-foreground mb-4 opacity-20" />
            <h2 className="text-2xl font-bold mb-2">{t('wishlist.empty_title', 'Tu lista de deseos está vacía')}</h2>
            <p className="text-muted-foreground mb-6">{t('wishlist.empty_description', 'Agrega productos que te gusten para verlos aquí')}</p>
            <a
              href={route('shop.index')}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              {t('wishlist.shop_now', 'Ir a la tienda')}
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        ) : (
          <>
            {/* Actions */}
            {inStockItems.length > 0 && (
              <div className="mb-6 flex justify-end">
                <button
                  onClick={handleMoveAllToCart}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {t('wishlist.move_all_to_cart', 'Agregar todos al carrito')}
                </button>
              </div>
            )}

            {/* In Stock Items */}
            {inStockItems.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">{t('wishlist.available', 'Disponibles')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {inStockItems.map((item) => (
                    <div key={item.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-square bg-muted relative">
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ShoppingCart className="w-16 h-16 opacity-20" />
                          </div>
                        )}
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-md"
                          title={t('wishlist.remove', 'Eliminar')}
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" />
                        </button>
                      </div>
                      <div className="p-4">
                        {item.product.category && (
                          <p className="text-xs text-muted-foreground mb-1">{item.product.category.name}</p>
                        )}
                        <h3 className="font-semibold mb-2 line-clamp-2">{item.product.name}</h3>
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-bold text-lg">{formatPrice(item.product.price_usd)}</p>
                          <span className="text-xs text-emerald-600 font-medium">
                            {item.product.stock} {t('wishlist.available', 'disponibles')}
                          </span>
                        </div>
                        <button
                          onClick={() => handleAddToCart(item.product)}
                          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {t('wishlist.add_to_cart', 'Agregar al carrito')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Out of Stock Items */}
            {outOfStockItems.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">{t('wishlist.out_of_stock', 'Agotados')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-60">
                  {outOfStockItems.map((item) => (
                    <div key={item.id} className="bg-card rounded-xl border border-border overflow-hidden">
                      <div className="aspect-square bg-muted relative">
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover grayscale"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ShoppingCart className="w-16 h-16 opacity-20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            {t('wishlist.out_of_stock', 'Agotado')}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-md"
                          title={t('wishlist.remove', 'Eliminar')}
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" />
                        </button>
                      </div>
                      <div className="p-4">
                        {item.product.category && (
                          <p className="text-xs text-muted-foreground mb-1">{item.product.category.name}</p>
                        )}
                        <h3 className="font-semibold mb-2 line-clamp-2">{item.product.name}</h3>
                        <p className="font-bold text-lg text-muted-foreground">{formatPrice(item.product.price_usd)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
