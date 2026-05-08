import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useI18n } from '@/Hooks/useI18n'

export default function VerifyEmail({ status }) {
    const { t } = useI18n();
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title={t('auth.verify_email.page_title', 'Verificación de correo')} />

            <div className="mb-4 text-sm text-gray-600">
                {t('auth.verify_email.description', 'Gracias por registrarte. Antes de comenzar, verifica tu correo electrónico haciendo clic en el enlace que acabamos de enviarte. Si no lo recibiste, te enviaremos otro con gusto.')}
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {t('auth.verify_email.status_sent', 'Se ha enviado un nuevo enlace de verificación al correo que proporcionaste durante el registro.')}
                </div>
            )}

            <form onSubmit={submit}>
                <div className="mt-4 flex items-center justify-between">
                    <PrimaryButton disabled={processing}>
                        {processing
                            ? t('auth.verify_email.actions.processing', 'Enviando...')
                            : t('auth.verify_email.actions.submit', 'Reenviar correo de verificación')}
                    </PrimaryButton>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        {t('auth.verify_email.actions.logout', 'Cerrar sesión')}
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
