import { useEffect, useState } from 'react';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import Select from '@/Components/Select';
import { useForm } from '@inertiajs/react';

export default function UpdateCustomerProfileForm({ profile, identificationTypes, className = '' }) {
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        postal_code: profile.postal_code || '',
        identification: profile.identification || '',
        identification_type_id: profile.identification_type_id || '',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('customer.profile.update'));
    };

    return (
        <form onSubmit={submit} className={className + ' space-y-6'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <InputLabel htmlFor="name" value="Nombre completo" />
                    <TextInput id="name" value={data.name} onChange={e => setData('name', e.target.value)} required autoComplete="name" className="mt-1 block w-full px-6 py-3 text-lg" />
                    <InputError className="mt-2" message={errors.name} />
                </div>
                <div>
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput id="email" value={data.email} onChange={e => setData('email', e.target.value)} required autoComplete="email" className="mt-1 block w-full px-6 py-3 text-lg" />
                    <InputError className="mt-2" message={errors.email} />
                </div>
                <div>
                    <InputLabel htmlFor="phone" value="Teléfono" />
                    <TextInput id="phone" value={data.phone} onChange={e => setData('phone', e.target.value)} autoComplete="tel" className="mt-1 block w-full px-6 py-3 text-lg" />
                    <InputError className="mt-2" message={errors.phone} />
                </div>
                <div>
                    <InputLabel htmlFor="address" value="Dirección" />
                    <TextInput id="address" value={data.address} onChange={e => setData('address', e.target.value)} autoComplete="address" className="mt-1 block w-full px-6 py-3 text-lg" />
                    <InputError className="mt-2" message={errors.address} />
                </div>
                <div>
                    <InputLabel htmlFor="city" value="Ciudad" />
                    <TextInput id="city" value={data.city} onChange={e => setData('city', e.target.value)} autoComplete="address-level2" className="mt-1 block w-full px-6 py-3 text-lg" />
                    <InputError className="mt-2" message={errors.city} />
                </div>
                <div>
                    <InputLabel htmlFor="postal_code" value="Código Postal" />
                    <TextInput id="postal_code" value={data.postal_code} onChange={e => setData('postal_code', e.target.value)} autoComplete="postal-code" className="mt-1 block w-full px-6 py-3 text-lg" />
                    <InputError className="mt-2" message={errors.postal_code} />
                </div>
                <div>
                    <InputLabel htmlFor="identification_type_id" value="Tipo de identificación" />
                    <Select id="identification_type_id" value={data.identification_type_id} onChange={e => setData('identification_type_id', e.target.value)} className="mt-1 block w-full px-6 py-3 text-lg">
                        <option value="">Seleccione...</option>
                        {identificationTypes.map(type => (
                            <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                    </Select>
                    <InputError className="mt-2" message={errors.identification_type_id} />
                </div>
                <div>
                    <InputLabel htmlFor="identification" value="Identificación" />
                    <TextInput id="identification" value={data.identification} onChange={e => setData('identification', e.target.value)} autoComplete="off" className="mt-1 block w-full px-6 py-3 text-lg" />
                    <InputError className="mt-2" message={errors.identification} />
                </div>
            </div>
            <PrimaryButton disabled={processing}>Guardar cambios</PrimaryButton>
            {recentlySuccessful && <div className="text-green-600 mt-2">¡Perfil actualizado!</div>}
        </form>
    );
}
