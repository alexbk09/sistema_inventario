import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { useI18n } from '@/Hooks/useI18n'

export default function ConfirmPassword() {
    const { t } = useI18n();
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title={t('auth.confirm_password.page_title', 'Confirmar contraseña')} />

            <div className="mb-4 text-sm text-gray-600">
                {t('auth.confirm_password.description', 'Esta es un área segura de la aplicación. Confirma tu contraseña antes de continuar.')}
            </div>

            <form onSubmit={submit}>
                <div className="mt-4">
                    <InputLabel htmlFor="password" value={t('auth.confirm_password.field', 'Contraseña')} />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        isFocused={true}
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <PrimaryButton className="ms-4" disabled={processing}>
                        {processing
                            ? t('auth.confirm_password.actions.processing', 'Confirmando...')
                            : t('auth.confirm_password.actions.submit', 'Confirmar')}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
