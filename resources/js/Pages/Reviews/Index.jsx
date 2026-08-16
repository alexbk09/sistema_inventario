import { Head } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import GuestLayout from '@/Layouts/GuestLayout.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { Star, StarHalf, ThumbsUp, Check, Edit, Trash2, Filter } from 'lucide-react';
import { router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';

export default function ReviewsIndex({ product, reviews, averageRating, ratingDistribution, totalReviews, userReview }) {
  const { t } = useI18n();
  const { auth } = usePage().props;
  const Layout = auth?.user ? AuthenticatedLayout : GuestLayout;

  const [isWritingReview, setIsWritingReview] = useState(false);
  const [rating, setRating] = useState(userReview?.rating || 5);
  const [title, setTitle] = useState(userReview?.title || '');
  const [comment, setComment] = useState(userReview?.comment || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = { rating, title, comment };

    if (userReview) {
      router.put(route('reviews.update', userReview.id), formData, {
        onSuccess: () => setIsWritingReview(false),
      });
    } else {
      router.post(route('reviews.store', product.id), formData, {
        onSuccess: () => setIsWritingReview(false),
      });
    }
  };

  const handleDelete = () => {
    if (confirm(t('reviews.confirm_delete', '¿Estás seguro de eliminar tu reseña?'))) {
      router.delete(route('reviews.destroy', userReview.id));
    }
  };

  const renderStars = (rating, size = 'w-5 h-5') => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className={`${size} fill-yellow-400 text-yellow-400`} />
        ))}
        {hasHalfStar && <StarHalf className={`${size} fill-yellow-400 text-yellow-400`} />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className={`${size} text-gray-300`} />
        ))}
      </div>
    );
  };

  const percentageForRating = (rating) => {
    return totalReviews > 0 ? Math.round((ratingDistribution[rating] / totalReviews) * 100) : 0;
  };

  return (
    <Layout>
      <Head title={t('reviews.page_title', 'Reseñas de {product}', { product: product.name })} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('reviews.title', 'Reseñas de {product}', { product: product.name })}</h1>
          <a href={route('product.show', product.id)} className="text-primary hover:underline">
            {t('reviews.back_to_product', 'Volver al producto')}
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rating Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold mb-2">{averageRating}</div>
                <div className="flex justify-center mb-2">{renderStars(averageRating, 'w-6 h-6')}</div>
                <p className="text-sm text-muted-foreground">{totalReviews} {t('reviews.reviews', 'reseñas')}</p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-sm w-3">{rating}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{ width: `${percentageForRating(rating)}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {ratingDistribution[rating]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Write Review Button */}
            {auth?.user && (
              <div className="mt-4">
                {!userReview ? (
                  <button
                    onClick={() => setIsWritingReview(true)}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                  >
                    {t('reviews.write_review', 'Escribir una reseña')}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsWritingReview(true);
                        setRating(userReview.rating);
                        setTitle(userReview.title || '');
                        setComment(userReview.comment || '');
                      }}
                      className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      {t('reviews.edit_review', 'Editar')}
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2">
            {/* Write Review Form */}
            {isWritingReview && (
              <div className="bg-card rounded-xl border border-border p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">
                  {userReview ? t('reviews.edit_review', 'Editar reseña') : t('reviews.write_review', 'Escribir una reseña')}
                </h2>
                <form onSubmit={handleSubmit}>
                  {/* Rating */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">{t('reviews.rating', 'Calificación')}</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Star className={`w-6 h-6 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">{t('reviews.title_label', 'Título (opcional)')}</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full border border-border rounded-lg px-4 py-2"
                      placeholder={t('reviews.title_placeholder', 'Resumen de tu reseña')}
                    />
                  </div>

                  {/* Comment */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">{t('reviews.comment', 'Comentario')}</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      className="w-full border border-border rounded-lg px-4 py-2"
                      placeholder={t('reviews.comment_placeholder', 'Cuéntanos tu experiencia con este producto')}
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                    >
                      {userReview ? t('reviews.update', 'Actualizar') : t('reviews.submit', 'Publicar')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsWritingReview(false)}
                      className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      {t('reviews.cancel', 'Cancelar')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Reviews */}
            {reviews.data.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Star className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-20" />
                <p className="text-muted-foreground">{t('reviews.no_reviews', 'No hay reseñas aún. ¡Sé el primero!')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.data.map((review) => (
                  <div key={review.id} className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-semibold text-primary">
                              {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold">{review.user?.name || t('reviews.anonymous', 'Anónimo')}</p>
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        {review.title && <h3 className="font-semibold mb-2">{review.title}</h3>}
                      </div>
                      {review.is_verified_purchase && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                          <Check className="w-3 h-3" />
                          {t('reviews.verified_purchase', 'Compra verificada')}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
