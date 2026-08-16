<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportsDashboardController extends Controller
{
    public function index(Request $request)
    {
        $reports = [
            [
                'id' => 'sales',
                'title' => 'Ventas',
                'description' => 'Reporte de ventas por período, top productos y ventas por categoría.',
                'icon' => 'ShoppingCart',
                'route' => 'admin.reports.sales.index',
                'color' => 'emerald',
                'category' => 'Ventas',
            ],
            [
                'id' => 'inventory',
                'title' => 'Inventario Global',
                'description' => 'Valorización global de inventario con stock y costos.',
                'icon' => 'Package',
                'route' => 'admin.reports.inventory.index',
                'color' => 'blue',
                'category' => 'Inventario',
            ],
            [
                'id' => 'inventory_kardex',
                'title' => 'Kardex de Inventario',
                'description' => 'Historial de movimientos de inventario por producto y bodega.',
                'icon' => 'FileText',
                'route' => 'admin.reports.inventory.kardex',
                'color' => 'violet',
                'category' => 'Inventario',
            ],
            [
                'id' => 'inventory_by_warehouse',
                'title' => 'Inventario por Bodega',
                'description' => 'Stock y valorización por bodega con vista matriz comparativa.',
                'icon' => 'Layers',
                'route' => 'admin.reports.inventory.by_warehouse',
                'color' => 'teal',
                'category' => 'Inventario',
            ],
            [
                'id' => 'inventory_rotation',
                'title' => 'Rotación de Productos',
                'description' => 'Análisis de rotación de inventario por producto.',
                'icon' => 'RefreshCw',
                'route' => 'admin.reports.inventory.rotation',
                'color' => 'amber',
                'category' => 'Inventario',
            ],
            [
                'id' => 'inventory_age',
                'title' => 'Antigüedad de Inventario',
                'description' => 'Productos sin movimiento por X días para identificar inventario obsoleto.',
                'icon' => 'Clock',
                'route' => 'admin.reports.inventory_age',
                'color' => 'rose',
                'category' => 'Inventario',
            ],
            [
                'id' => 'profitability',
                'title' => 'Rentabilidad',
                'description' => 'Margen bruto por producto, categoría y período.',
                'icon' => 'TrendingUp',
                'route' => 'admin.reports.profitability',
                'color' => 'green',
                'category' => 'Finanzas',
            ],
            [
                'id' => 'cash_flow',
                'title' => 'Flujo de Caja',
                'description' => 'Ingresos vs egresos por período con gráfico.',
                'icon' => 'DollarSign',
                'route' => 'admin.reports.cash_flow',
                'color' => 'indigo',
                'category' => 'Finanzas',
            ],
            [
                'id' => 'credits',
                'title' => 'Créditos',
                'description' => 'Reporte de créditos y movimientos de clientes.',
                'icon' => 'CreditCard',
                'route' => 'admin.reports.credits.index',
                'color' => 'purple',
                'category' => 'Finanzas',
            ],
            [
                'id' => 'layaways',
                'title' => 'Apartados',
                'description' => 'Reporte de apartados y reservas de productos.',
                'icon' => 'BookOpen',
                'route' => 'admin.reports.layaways.index',
                'color' => 'orange',
                'category' => 'Finanzas',
            ],
        ];

        // Agrupar por categoría
        $groupedReports = collect($reports)->groupBy('category');

        return Inertia::render('Admin/Reports/Dashboard/Index', [
            'reports' => $reports,
            'groupedReports' => $groupedReports,
        ]);
    }
}
