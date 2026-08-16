import { useState } from 'react';
import { X, ShoppingCart, Heart, Share2, Star, Check } from 'lucide-react';
import { useCart } from '@/Hooks/useCart';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';
import { useI18n } from '@/Hooks/useI18n';

export default function QuickView({ product, isOpen, onClose, onAddToCart }) {
  const { t } = useI18n();
  const { displayCurrency, formatPriceFromUsd } = useConfiguredCurrencyRates();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  if (!isOpen || !product) return null;

  const formatPrice = (value) => formatPriceFromUsd(Number(value || 0), displayCurrency);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    onAddToCart?.();
    onClose();
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = Math.max(1, Math.min(product.stock || 10, quantity + delta));
    setQuantity(newQuantity);
  };

  const inStock = (product.stock || 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-background rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          {/* Product Image */}
          <div className="aspect-square rounded-xl bg-muted overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <ShoppingCart className="w-24 h-24 opacity-20" />
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col">
            {/* Category */}
            {product.category && (
              <span className="text-sm text-muted-foreground mb-2">{product.category.name}</span>
            )}

            {/* Title */}
            <h2 className="text-2xl font-bold mb-2">{product.name}</h2>

            {/* SKU */}
            {product.sku && (
              <p className="text-sm text-muted-foreground mb-4 font-mono">SKU: {product.sku}</p>
            )}

            {/* Rating */}
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < (product.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                />
              ))}
              <span className="text-sm text-muted-foreground ml-2">({product.reviews || 0} {t('shop.reviews', 'reseñas')})</span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <p className="text-3xl font-bold text-primary">{formatPrice(product.price_usd)}</p>
              {product.price_bs && (
                <p className="text-sm text-muted-foreground">BS: {product.price_bs.toFixed(2)}</p>
              )}
            </div>

            {/* Stock Status */}
            <div className={`flex items-center gap-2 mb-6 ${inStock ? 'text-emerald-600' : 'text-rose-600'}`}>
              {inStock ? (
                <>
                  <Check className="w-5 h-5" />
                  <span className="font-medium">{t('shop.in_stock', 'En stock')}</span>
                  <span className="text-sm text-muted-foreground">({product.stock} {t('shop.available', 'disponibles')})</span>
                </>
              ) : (
                <>
                  <X className="w-5 h-5" />
                  <span className="font-medium">{t('shop.out_of_stock', 'Agotado')}</span>
                </>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">{t('shop.description', 'Descripción')}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3">{product.description}</p>
              </div>
            )}

            {/* Quantity Selector */}
            {inStock && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">{t('shop.quantity', 'Cantidad')}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    disabled={quantity >= (product.stock || 10)}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-auto">
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                {t('shop.add_to_cart', 'Agregar al carrito')}
              </button>
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="w-12 h-12 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                title={t('shop.add_to_wishlist', 'Agregar a deseos')}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
              <button
                className="w-12 h-12 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                title={t('shop.share', 'Compartir')}
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
