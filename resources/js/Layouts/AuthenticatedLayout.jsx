import AdminSidebar from '@/Components/admin/AdminSidebar';
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
        <div className="min-h-screen bg-background flex w-full">
            <AdminSidebar />

            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                {header && (
                    <header className="bg-card border-b border-border shrink-0">
                        <div className="px-6 py-4 pl-16 lg:pl-6">
                            {header}
                        </div>
                    </header>
                )}

                <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 pt-16 lg:pt-6">
                    {children}
                </main>
            </div>

            <Toaster
                position="top-right"
                toastOptions={{
                    style: { fontSize: '0.9rem' },
                    success: { duration: 3000 },
                    error: { duration: 5000 },
                }}
            />
        </div>
    );
}
