import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useI18n } from '@/Hooks/useI18n.ts';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }) {
    const { t } = useI18n();
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    {t('profile.delete_account.title', 'Eliminar cuenta')}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    {t('profile.delete_account.description', 'Una vez eliminada tu cuenta, todos sus recursos y datos se borrarán permanentemente. Antes de continuar, conserva cualquier información que quieras mantener.')}
                </p>
            </header>

            <DangerButton onClick={confirmUserDeletion}>
                {t('profile.delete_account.trigger', 'Eliminar cuenta')}
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        {t('profile.delete_account.modal.title', '¿Seguro que deseas eliminar tu cuenta?')}
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                        {t('profile.delete_account.modal.description', 'Esta acción eliminará permanentemente tu cuenta y todos sus datos. Ingresa tu contraseña para confirmar.')}
                    </p>

                    <div className="mt-6">
                        <InputLabel
                            htmlFor="password"
                            value={t('profile.delete_account.modal.password', 'Contraseña')}
                            className="sr-only"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="mt-1 block w-3/4"
                            isFocused
                            placeholder={t('profile.delete_account.modal.password', 'Contraseña')}
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal}>
                            {t('profile.actions.cancel', 'Cancelar')}
                        </SecondaryButton>

                        <DangerButton className="ms-3" disabled={processing}>
                            {t('profile.delete_account.modal.confirm', 'Eliminar cuenta')}
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
