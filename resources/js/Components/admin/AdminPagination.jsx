import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/Hooks/useI18n';

export default function AdminPagination({
  page = 1,
  totalPages = 1,
  onPageChange = () => {},
  className = '',
}) {
  const { t } = useI18n();
  const canGoBack = page > 1;
  const canGoForward = page < totalPages;

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) {
      return;
    }

    onPageChange(nextPage);
  };

  return (
    <div className={`flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 md:flex-row md:items-center md:justify-between ${className}`.trim()}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('admin.pagination.navigation', 'Navegacion')}</p>
        <p className="mt-1 text-sm text-slate-600">
          {t('admin.pagination.page_of', 'Pagina :page de :total', { page, total: totalPages })}
        </p>
      </div>

      <div className="flex items-center gap-2 self-start md:self-auto">
        <button
          type="button"
          onClick={() => handlePageChange(page - 1)}
          disabled={!canGoBack}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('admin.pagination.previous', 'Anterior')}
        </button>
        <div className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
          {page}/{totalPages}
        </div>
        <button
          type="button"
          onClick={() => handlePageChange(page + 1)}
          disabled={!canGoForward}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('admin.pagination.next', 'Siguiente')}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}