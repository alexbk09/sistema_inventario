import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useI18n } from '@/Hooks/useI18n';

export default function Dashboard() {
    const { t } = useI18n();

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    {t('welcome.fallback_dashboard_title', 'Panel')}
                </h2>
            }
        >
            <Head title={t('welcome.fallback_dashboard_title', 'Panel')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            {t('welcome.fallback_dashboard_message', 'Has iniciado sesion correctamente.')}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
