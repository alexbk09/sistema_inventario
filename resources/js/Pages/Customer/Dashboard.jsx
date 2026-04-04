import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function CustomerDashboard({ summary, invoices, topProducts, profile }) {
    return (
        <AuthenticatedLayout>
            <Head title="Mi Panel" />
            <div className="max-w-4xl mx-auto py-10">
                <h1 className="text-2xl font-bold mb-6">Bienvenido, {profile.name}</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-card p-4 rounded-lg shadow">
                        <div className="text-muted-foreground text-sm">Total gastado</div>
                        <div className="text-2xl font-bold">${summary.totalSpent.toFixed(2)}</div>
                    </div>
                    <div className="bg-card p-4 rounded-lg shadow">
                        <div className="text-muted-foreground text-sm">Compras</div>
                        <div className="text-2xl font-bold">{summary.totalPurchases}</div>
                    </div>
                    <div className="bg-card p-4 rounded-lg shadow">
                        <div className="text-muted-foreground text-sm">Última compra</div>
                        <div className="text-2xl font-bold">{summary.lastPurchase || '-'}</div>
                    </div>
                </div>
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Historial de compras</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-border rounded-lg">
                            <thead>
                                <tr>
                                    <th className="px-4 py-2">#</th>
                                    <th className="px-4 py-2">Total</th>
                                    <th className="px-4 py-2">Fecha</th>
                                    <th className="px-4 py-2">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((inv) => (
                                    <tr key={inv.id} className="border-t">
                                        <td className="px-4 py-2">{inv.number}</td>
                                        <td className="px-4 py-2">${inv.total_usd.toFixed(2)}</td>
                                        <td className="px-4 py-2">{new Date(inv.created_at).toLocaleDateString()}</td>
                                        <td className="px-4 py-2">{inv.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Productos más comprados</h2>
                    <ul className="list-disc pl-6">
                        {topProducts.map((prod, idx) => (
                            <li key={idx}>{prod.name} <span className="text-muted-foreground">({prod.quantity})</span></li>
                        ))}
                    </ul>
                </div>
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Datos de perfil</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><b>Nombre:</b> {profile.name}</div>
                        <div><b>Email:</b> {profile.email}</div>
                        <div><b>Teléfono:</b> {profile.phone}</div>
                        <div><b>Dirección:</b> {profile.address}</div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
