<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Product;
use App\Support\Settings;
use App\Http\Controllers\{ProductController, ProviderController, InvoiceController, CategoryController, RolesController, ProductInventoryController, ProductImageController, CustomerController, UserController, RmaController, WarehouseController, StockTransferController, CreditAccountController, LayawayController, SettingsController};
use App\Http\Controllers\CurrencyController;
use App\Services\CurrencyService;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\OrderTrackingController;
use App\Http\Controllers\RecommendationController;
use App\Http\Controllers\NewsletterSubscriptionController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\QrController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Reports\SalesReportController;
use App\Http\Controllers\Reports\InventoryReportController;
use App\Http\Controllers\Reports\InventoryKardexController;
use App\Http\Controllers\Reports\InventoryByWarehouseController;
use App\Http\Controllers\Reports\CreditReportController;
use App\Http\Controllers\Reports\CreditMovementsReportController;
use App\Http\Controllers\Reports\LayawayReportController;
use App\Http\Controllers\Reports\InventoryRotationController;
Route::middleware(['auth', 'verified', 'role:admin|supervisor|cashier|warehouse'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/admin/qr', function () {
        return Inertia::render('Admin/QRScanner');
    })->name('admin.qr');

    Route::get('/admin/qr-codes', [QrController::class, 'index'])->name('admin.qr.codes');

    // Configuración general del sistema (solo usuarios con permiso de gestionar settings)
    Route::get('/admin/settings', [SettingsController::class, 'index'])
        ->middleware('permission:manage settings')
        ->name('admin.settings.index');
    Route::put('/admin/settings', [SettingsController::class, 'update'])
        ->middleware('permission:manage settings')
        ->name('admin.settings.update');

    // Productos
    Route::get('/admin/products', [ProductController::class, 'index'])->name('admin.products.index');
    Route::get('/admin/products/create', [ProductController::class, 'create'])->name('admin.products.create');
    Route::post('/admin/products', [ProductController::class, 'store'])->name('admin.products.store');
    Route::post('/admin/products/import', [ProductController::class, 'import'])->name('admin.products.import');
    Route::get('/admin/products/{product}/edit', [ProductController::class, 'edit'])->name('admin.products.edit');
    Route::put('/admin/products/{product}', [ProductController::class, 'update'])->name('admin.products.update');
    Route::delete('/admin/products/{product}', [ProductController::class, 'destroy'])->name('admin.products.destroy');

    Route::delete('/admin/product-images/{image}', [ProductImageController::class, 'destroy'])->name('admin.product-images.destroy');

    // Inventario por producto
    Route::get('/admin/products/{product}/inventory', [ProductInventoryController::class, 'index'])->name('admin.products.inventory.index');
    Route::post('/admin/products/{product}/inventory', [ProductInventoryController::class, 'store'])->name('admin.products.inventory.store');

    // Categorías
    Route::get('/admin/categories', [CategoryController::class, 'index'])->name('admin.categories.index');
    Route::get('/admin/categories/create', [CategoryController::class, 'create'])->name('admin.categories.create');
    Route::post('/admin/categories', [CategoryController::class, 'store'])->name('admin.categories.store');
    Route::get('/admin/categories/{category}/edit', [CategoryController::class, 'edit'])->name('admin.categories.edit');
    Route::put('/admin/categories/{category}', [CategoryController::class, 'update'])->name('admin.categories.update');
    Route::delete('/admin/categories/{category}', [CategoryController::class, 'destroy'])->name('admin.categories.destroy');

    // Roles y permisos (solo usuarios con permiso de gestionar usuarios/roles)
    Route::get('/admin/roles', [RolesController::class, 'index'])
        ->middleware('permission:manage users')
        ->name('admin.roles.index');
    Route::get('/admin/roles/{role}/edit', [RolesController::class, 'edit'])
        ->middleware('permission:manage users')
        ->name('admin.roles.edit');
    Route::put('/admin/roles/{role}', [RolesController::class, 'update'])
        ->middleware('permission:manage users')
        ->name('admin.roles.update');

    // Auditoría (solo usuarios con permiso de ver logs)
    Route::get('/admin/audit', [AuditLogController::class, 'index'])
        ->middleware('permission:view audit logs')
        ->name('admin.audit.index');

    // Reportes
    Route::get('/admin/reports/sales', [SalesReportController::class, 'index'])
        ->middleware('permission:view invoices')
        ->name('admin.reports.sales.index');
    Route::get('/admin/reports/sales/top-products', [SalesReportController::class, 'topProducts'])
        ->middleware('permission:view invoices')
        ->name('admin.reports.sales.top_products');
    Route::get('/admin/reports/sales/by-category', [SalesReportController::class, 'salesByCategory'])
        ->middleware('permission:view invoices')
        ->name('admin.reports.sales.by_category');
    Route::get('/admin/reports/sales/export', [SalesReportController::class, 'export'])
        ->middleware('permission:view invoices')
        ->name('admin.reports.sales.export');
    Route::get('/admin/reports/sales/export-excel', [SalesReportController::class, 'exportExcel'])
        ->middleware('permission:view invoices')
        ->name('admin.reports.sales.export_excel');
    Route::get('/admin/reports/sales/export-pdf', [SalesReportController::class, 'exportPdf'])
        ->middleware('permission:view invoices')
        ->name('admin.reports.sales.export_pdf');

    Route::get('/admin/reports/inventory', [InventoryReportController::class, 'index'])
        ->middleware('permission:view products')
        ->name('admin.reports.inventory.index');
    Route::get('/admin/reports/inventory/export', [InventoryReportController::class, 'export'])
        ->middleware('permission:view products')
        ->name('admin.reports.inventory.export');
    Route::get('/admin/reports/inventory/export-excel', [InventoryReportController::class, 'exportExcel'])
        ->middleware('permission:view products')
        ->name('admin.reports.inventory.export_excel');
    Route::get('/admin/reports/inventory/export-pdf', [InventoryReportController::class, 'exportPdf'])
        ->middleware('permission:view products')
        ->name('admin.reports.inventory.export_pdf');

    Route::get('/admin/reports/inventory/kardex', [InventoryKardexController::class, 'index'])
        ->middleware('permission:view products')
        ->name('admin.reports.inventory.kardex');

    Route::get('/admin/reports/inventory/by-warehouse', [InventoryByWarehouseController::class, 'index'])
        ->middleware('permission:view products')
        ->name('admin.reports.inventory.by_warehouse');

    Route::get('/admin/reports/inventory/rotation', [InventoryRotationController::class, 'index'])
        ->middleware('permission:view products')
        ->name('admin.reports.inventory.rotation');

    Route::get('/admin/reports/credits', [CreditReportController::class, 'index'])
        ->middleware('permission:view credits')
        ->name('admin.reports.credits.index');

    Route::get('/admin/reports/credits/movements', [CreditMovementsReportController::class, 'index'])
        ->middleware('permission:view credits')
        ->name('admin.reports.credits.movements');

    Route::get('/admin/reports/layaways', [LayawayReportController::class, 'index'])
        ->middleware('permission:view credits')
        ->name('admin.reports.layaways.index');

    // Proveedores
    Route::get('/admin/providers', [ProviderController::class, 'index'])->name('admin.providers.index');
    Route::get('/admin/providers/create', [ProviderController::class, 'create'])->name('admin.providers.create');
    Route::post('/admin/providers', [ProviderController::class, 'store'])->name('admin.providers.store');
    Route::get('/admin/providers/{provider}/edit', [ProviderController::class, 'edit'])->name('admin.providers.edit');
    Route::put('/admin/providers/{provider}', [ProviderController::class, 'update'])->name('admin.providers.update');
    Route::delete('/admin/providers/{provider}', [ProviderController::class, 'destroy'])->name('admin.providers.destroy');

    // Clientes (CRM)
    Route::get('/admin/customers', [CustomerController::class, 'index'])->name('admin.customers.index');
    Route::post('/admin/customers', [CustomerController::class, 'store'])->name('admin.customers.store');
    Route::get('/admin/customers/{customer}', [CustomerController::class, 'show'])->name('admin.customers.show');

    // Usuarios
    Route::get('/admin/users', [UserController::class, 'index'])->name('admin.users.index');
    Route::get('/admin/users/{user}', [UserController::class, 'show'])->name('admin.users.show');

    // Facturas
    Route::get('/admin/invoices', [InvoiceController::class, 'index'])->name('admin.invoices.index');
    Route::get('/admin/invoices/create', [InvoiceController::class, 'create'])->name('admin.invoices.create');
    Route::post('/admin/invoices', [InvoiceController::class, 'store'])->name('admin.invoices.store');
    Route::put('/admin/invoices/{invoice}', [InvoiceController::class, 'update'])->name('admin.invoices.update');

    // Devoluciones y Garantías (RMA)
    Route::get('/admin/rmas', [RmaController::class, 'index'])->name('admin.rmas.index');
    Route::get('/admin/rmas/create', [RmaController::class, 'create'])->name('admin.rmas.create');
    Route::post('/admin/rmas', [RmaController::class, 'store'])->name('admin.rmas.store');
    Route::get('/admin/rmas/{rma}', [RmaController::class, 'show'])->name('admin.rmas.show');
    Route::put('/admin/rmas/{rma}', [RmaController::class, 'update'])->name('admin.rmas.update');

    // Multi-sucursal / Multi-bodega
    Route::get('/admin/warehouses', [WarehouseController::class, 'index'])->name('admin.warehouses.index');
    Route::post('/admin/warehouses', [WarehouseController::class, 'store'])->name('admin.warehouses.store');

    Route::get('/admin/transfers', [StockTransferController::class, 'index'])->name('admin.transfers.index');
    Route::get('/admin/transfers/create', [StockTransferController::class, 'create'])->name('admin.transfers.create');
    Route::post('/admin/transfers', [StockTransferController::class, 'store'])->name('admin.transfers.store');
    Route::get('/admin/transfers/{transfer}', [StockTransferController::class, 'show'])->name('admin.transfers.show');
    Route::put('/admin/transfers/{transfer}', [StockTransferController::class, 'update'])->name('admin.transfers.update');

    // Sistema de Apartados y Créditos
    Route::get('/admin/layaways', [LayawayController::class, 'index'])->name('admin.layaways.index');
    Route::get('/admin/layaways/create', [LayawayController::class, 'create'])->name('admin.layaways.create');
    Route::post('/admin/layaways', [LayawayController::class, 'store'])->name('admin.layaways.store');
    Route::get('/admin/layaways/{layaway}', [LayawayController::class, 'show'])->name('admin.layaways.show');
    Route::put('/admin/layaways/{layaway}', [LayawayController::class, 'update'])->name('admin.layaways.update');

        Route::get('/admin/credits', [CreditAccountController::class, 'index'])->name('admin.credits.index');
        Route::post('/admin/credits', [CreditAccountController::class, 'store'])->name('admin.credits.store');
    Route::get('/admin/credits/{account}', [CreditAccountController::class, 'show'])->name('admin.credits.show');
    Route::post('/admin/credits/{account}/movements', [CreditAccountController::class, 'storeMovement'])->name('admin.credits.movements.store');
});

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/shop', [ShopController::class, 'index'])->name('shop.index');

Route::get('/product/{product}', function (\App\Models\Product $product) {
    $currency = app(\App\Services\CurrencyService::class);
    $rate = $currency->getPromedio('oficial') ?? (float) config('currency.bs_rate', 0);

    $product->load(['categories:id,name', 'images' => function ($q) { $q->orderBy('sort_order'); }]);

    $data = [
        'id' => $product->id,
        'name' => $product->name,
        'sku' => $product->sku,
        'barcode' => $product->barcode,
        'description' => $product->description,
        'price' => (float) $product->price_usd,
        'price_bs' => round((float) $product->price_usd * ($rate ?: 0), 2),
        'images' => $product->images->map(fn ($img) => [
            'id' => $img->id,
            'url' => asset('storage/'.$img->path),
        ]),
        'image' => $product->image_url,
        'category' => optional($product->categories->first())->name ?? null,
        'categories' => $product->categories->pluck('name'),
        'stock' => (int) $product->stock,
        'rating' => 5,
        'reviews' => 0,
    ];

    $relatedQuery = \App\Models\Product::where('id', '!=', $product->id)
        ->when($product->categories->isNotEmpty(), function ($q) use ($product) {
            $q->whereHas('categories', function ($q2) use ($product) {
                $q2->whereIn('categories.id', $product->categories->pluck('id'));
            });
        })
        ->with(['categories:id,name']);

    $related = $relatedQuery->take(8)->get()->map(function ($p) use ($rate) {
        return [
            'id' => $p->id,
            'name' => $p->name,
            'price' => (float) $p->price_usd,
            'image' => $p->image_url,
            'category' => optional($p->categories->first())->name ?? null,
        ];
    });

    return Inertia::render('Product/Show', [
        'product' => $data,
        'related' => $related,
        'rate' => $rate,
    ]);
})->name('product.show');

// Checkout público
Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout.index');

// Guardar checkout
Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store');
Route::get('/confirmacion', [CheckoutController::class, 'confirmation'])->name('checkout.confirmation');

// Ruta pública simple para seguimiento de pedido/factura
Route::get('/pedido/{invoice}', [OrderTrackingController::class, 'show'])->name('order.track');

// Códigos QR públicos
Route::get('/qr/invoices/{invoice}', [QrController::class, 'invoice'])->name('qr.invoice');
Route::get('/qr/products/{product}', [QrController::class, 'product'])->name('qr.product');
Route::get('/qr/whatsapp', [QrController::class, 'whatsapp'])->name('qr.whatsapp');

// Newsletter
Route::post('/newsletter/subscribe', [NewsletterSubscriptionController::class, 'store'])->name('newsletter.subscribe');

// Cambio de idioma (es/en)
Route::post('/locale/{locale}', [LocaleController::class, 'switch'])->name('locale.switch');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Carrito
    Route::post('/cart/add', [CartController::class, 'add'])->name('cart.add');
    Route::post('/cart/remove', [CartController::class, 'remove'])->name('cart.remove');
    Route::post('/cart/update', [CartController::class, 'update'])->name('cart.update');
    Route::post('/cart/clear', [CartController::class, 'clear'])->name('cart.clear');
    Route::get('/api/cart', [CartController::class, 'summary'])->name('api.cart.summary');
});

require __DIR__.'/auth.php';

// API de moneda: promedios de USD->BS desde dolarapi
Route::get('/api/currency/promedio', [CurrencyController::class, 'promedio'])->name('api.currency.promedio');
Route::get('/api/currency/promedios', [CurrencyController::class, 'promedios'])->name('api.currency.promedios');

// Recomendaciones para carrito/checkout
Route::get('/api/recommendations/cart', [RecommendationController::class, 'forCart'])->name('api.recommendations.cart');
