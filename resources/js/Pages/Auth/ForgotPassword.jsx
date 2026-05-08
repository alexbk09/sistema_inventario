import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { useI18n } from '@/Hooks/useI18n'

export default function ForgotPassword({ status }) {
    const { t } = useI18n();
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title={t('auth.forgot_password.page_title', 'Recuperar contraseña')} />

            <div className="mb-4 text-sm text-gray-600">
                {t('auth.forgot_password.description', '¿Olvidaste tu contraseña? No hay problema. Indícanos tu correo electrónico y te enviaremos un enlace para restablecerla y elegir una nueva.')}
            </div>

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <form onSubmit={submit}>
                <TextInput
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    className="mt-1 block w-full"
                    placeholder={t('auth.forgot_password.email_placeholder', 'tu@email.com')}
                    isFocused={true}
                    onChange={(e) => setData('email', e.target.value)}
                />

                <InputError message={errors.email} className="mt-2" />

                <div className="mt-4 flex items-center justify-end">
                    <PrimaryButton className="ms-4" disabled={processing}>
                        {processing
                            ? t('auth.forgot_password.actions.processing', 'Enviando enlace...')
                            : t('auth.forgot_password.actions.submit', 'Enviar enlace de recuperación')}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
