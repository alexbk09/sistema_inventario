
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpdateCustomerProfileForm from './Partials/UpdateCustomerProfileForm';
import { useState, useEffect } from 'react';
import { useI18n } from '@/Hooks/useI18n.ts';

export default function Edit({ mustVerifyEmail, status }) {
    const { t } = useI18n();
    const [active, setActive] = useState('user');
    const { profile: rawProfile } = usePage().props;
    const profile = rawProfile || {};
    const [identificationTypes, setIdentificationTypes] = useState([]);
    const pills = [
        { key: 'user', label: t('profile.pills.user', 'Datos de usuario') },
        { key: 'customer', label: t('profile.pills.customer', 'Datos personales') },
    ];

    useEffect(() => {
        if (active === 'customer') {
            fetch(route('customer.profile.identification_types'))
                .then(res => res.json())
                .then(setIdentificationTypes);
        }
    }, [active]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    {t('profile.header', 'Perfil')}
                </h2>
            }
        >
            <Head title={t('profile.page_title', 'Perfil')} />
            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="mb-6 flex gap-2">
                        {pills.map(pill => (
                            <button
                                key={pill.key}
                                className={`px-4 py-2 rounded-full border ${active === pill.key ? 'bg-primary text-white' : 'bg-white text-gray-700 border-gray-300'}`}
                                onClick={() => setActive(pill.key)}
                            >
                                {pill.label}
                            </button>
                        ))}
                    </div>
                    {active === 'user' && (
                        <>
                            <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                                <UpdateProfileInformationForm
                                    mustVerifyEmail={mustVerifyEmail}
                                    status={status}
                                    className="max-w-xl"
                                />
                            </div>
                            <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                                <UpdatePasswordForm className="max-w-xl" />
                            </div>
                            <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                                <DeleteUserForm className="max-w-xl" />
                            </div>
                        </>
                    )}
                    {active === 'customer' && (
                        <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                            <UpdateCustomerProfileForm profile={profile} identificationTypes={identificationTypes} className="max-w-xl" />
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
