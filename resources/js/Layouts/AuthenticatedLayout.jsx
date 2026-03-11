import AutenticateNav from '@/Layouts/Autenticate/AutenticateNav';
import FooterLayaout from '@/Layouts/Footer';
import { Toaster, toast } from 'react-hot-toast';
import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';

export default function AuthenticatedLayout({ header, children }) {
    const { props } = usePage();

    useEffect(() => {
        if (props?.flash?.error) {
            toast.error(props.flash.error);
        }
        if (props?.flash?.success) {
            toast.success(props.flash.success);
        }
    }, [props?.flash?.error, props?.flash?.success]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col w-full">
            
            <AutenticateNav />

                {header && (
                    <header className="bg-white shadow">
                        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}

                <main className="lg:mx-28 md:mx-16 flex-1 px-4 py-6">{children}</main>
            <Toaster
                position="top-center"
                toastOptions={{
                    style: { fontSize: '0.95rem' }
                }}
            />
            <FooterLayaout />
        </div>
    );
}
