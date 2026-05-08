<?php

namespace Database\Seeders;

use App\Models\CreditAccount;
use App\Models\CreditMovement;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoicePayment;
use App\Models\Layaway;
use App\Models\LayawayItem;
use App\Models\Product;
use App\Models\Rma;
use App\Models\RmaItem;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BackofficeSmokeSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            DemoSeeder::class,
            BackofficeSmokeCleanupSeeder::class,
        ]);

        $adminEmail = config('demo.users.admin.email', 'admin@example.com');
        $clientEmail = config('demo.users.client.email', 'cliente@example.com');

        $admin = User::where('email', $adminEmail)->firstOrFail();
        $salesCustomer = Customer::where('email', $clientEmail)->firstOrFail();
        $productSix = Product::where('sku', 'SKU-0006')->firstOrFail();
        $productOne = Product::where('sku', 'SKU-0001')->firstOrFail();

        $creditCustomer = Customer::updateOrCreate(
            ['email' => 'credito.qa@example.com'],
            [
                'name' => 'Cliente Credito QA',
                'phone' => '+58 412-5550001',
                'address' => 'Caracas - cliente semilla para smoke test',
            ]
        );

        $warehouse = Warehouse::updateOrCreate(
            ['code' => 'QA01'],
            [
                'name' => 'Sucursal QA Temporal',
                'address' => 'Deposito temporal para validacion QA',
                'invoice_prefix' => 'QA-',
                'invoice_length' => 8,
                'is_active' => true,
            ]
        );

        $paidStatusId = DB::table('invoice_statuses')->where('code', 'paid')->value('id');
        $pendingStatusId = DB::table('invoice_statuses')->where('code', 'pending')->value('id');

        $salesInvoice = Invoice::updateOrCreate(
            ['number' => 'QA-VENTA-001'],
            [
                'document_type' => 'invoice',
                'customer_id' => $salesCustomer->id,
                'seller_id' => $admin->id,
                'warehouse_id' => $warehouse->id,
                'status' => 'paid',
                'invoice_status_id' => $paidStatusId,
                'total_usd' => 125.50,
                'total_bs' => 0,
                'public_notes' => 'Fixture smoke ventas',
            ]
        );

        InvoicePayment::where('invoice_id', $salesInvoice->id)->delete();
        InvoicePayment::create([
            'invoice_id' => $salesInvoice->id,
            'method' => 'cash',
            'amount_usd' => 125.50,
            'amount_bs' => 0,
            'reference' => 'QA-CASH-001',
            'notes' => 'Pago demo para validar filtros de ventas',
        ]);

        $creditInvoice = Invoice::updateOrCreate(
            ['number' => 'QA-CRED-001'],
            [
                'document_type' => 'invoice',
                'customer_id' => $creditCustomer->id,
                'seller_id' => $admin->id,
                'warehouse_id' => $warehouse->id,
                'status' => 'pending',
                'invoice_status_id' => $pendingStatusId,
                'total_usd' => 100.00,
                'total_bs' => 0,
                'public_notes' => 'Fixture smoke credito',
            ]
        );

        $creditAccount = CreditAccount::updateOrCreate(
            ['customer_id' => $creditCustomer->id],
            [
                'balance_usd' => 80.00,
                'credit_limit_usd' => 300.00,
                'status' => 'active',
            ]
        );

        CreditMovement::where('credit_account_id', $creditAccount->id)
            ->whereIn('description', [
                'Cargo demo smoke pendiente',
                'Pago demo smoke',
            ])
            ->delete();

        CreditMovement::create([
            'credit_account_id' => $creditAccount->id,
            'invoice_id' => $creditInvoice->id,
            'type' => 'charge',
            'amount_usd' => 100.00,
            'description' => 'Cargo demo smoke pendiente',
            'due_date' => now()->subDays(3),
            'paid_at' => null,
        ]);

        CreditMovement::create([
            'credit_account_id' => $creditAccount->id,
            'invoice_id' => $creditInvoice->id,
            'type' => 'payment',
            'amount_usd' => 20.00,
            'description' => 'Pago demo smoke',
            'due_date' => null,
            'paid_at' => now()->subDay(),
        ]);

        $layawayPending = Layaway::updateOrCreate(
            ['number' => 'QA-LAY-001'],
            [
                'customer_id' => $salesCustomer->id,
                'status' => 'pending',
                'total_usd' => (float) $productSix->price_usd,
                'total_bs' => 0,
                'paid_usd' => 20.00,
                'expires_at' => now()->subDays(2),
                'notes' => 'Apartado smoke pendiente vencido',
            ]
        );

        LayawayItem::create([
            'layaway_id' => $layawayPending->id,
            'product_id' => $productSix->id,
            'quantity' => 1,
            'unit_price_usd' => (float) $productSix->price_usd,
            'subtotal_usd' => (float) $productSix->price_usd,
            'subtotal_bs' => 0,
        ]);

        $layawayExpired = Layaway::updateOrCreate(
            ['number' => 'QA-LAY-002'],
            [
                'customer_id' => $salesCustomer->id,
                'status' => 'expired',
                'total_usd' => (float) $productOne->price_usd,
                'total_bs' => 0,
                'paid_usd' => 0,
                'expires_at' => now()->subDays(10),
                'notes' => 'Apartado smoke expirado',
            ]
        );

        LayawayItem::create([
            'layaway_id' => $layawayExpired->id,
            'product_id' => $productOne->id,
            'quantity' => 1,
            'unit_price_usd' => (float) $productOne->price_usd,
            'subtotal_usd' => (float) $productOne->price_usd,
            'subtotal_bs' => 0,
        ]);

        $layawayActive = Layaway::updateOrCreate(
            ['number' => 'QA-LAY-003'],
            [
                'customer_id' => $salesCustomer->id,
                'status' => 'active',
                'total_usd' => (float) $productSix->price_usd,
                'total_bs' => 0,
                'paid_usd' => 40.00,
                'expires_at' => now()->addDays(5),
                'notes' => 'Apartado smoke activo',
            ]
        );

        LayawayItem::create([
            'layaway_id' => $layawayActive->id,
            'product_id' => $productSix->id,
            'quantity' => 1,
            'unit_price_usd' => (float) $productSix->price_usd,
            'subtotal_usd' => (float) $productSix->price_usd,
            'subtotal_bs' => 0,
        ]);

        $rmaPending = Rma::updateOrCreate(
            ['number' => 'QA-RMA-001'],
            [
                'invoice_id' => $salesInvoice->id,
                'customer_id' => $salesCustomer->id,
                'status' => 'pending',
                'reason_type' => 'defectuoso',
                'reason' => 'RMA smoke pendiente',
                'resolution_type' => 'reemplazo',
                'total_usd' => (float) $productSix->price_usd,
                'total_bs' => 0,
            ]
        );

        RmaItem::create([
            'rma_id' => $rmaPending->id,
            'product_id' => $productSix->id,
            'invoice_item_id' => null,
            'quantity' => 1,
            'unit_price_usd' => (float) $productSix->price_usd,
            'subtotal_usd' => (float) $productSix->price_usd,
            'subtotal_bs' => 0,
            'reason' => 'Producto con falla intermitente',
        ]);

        $rmaApproved = Rma::updateOrCreate(
            ['number' => 'QA-RMA-002'],
            [
                'invoice_id' => $salesInvoice->id,
                'customer_id' => $salesCustomer->id,
                'status' => 'approved',
                'reason_type' => 'garantia',
                'reason' => 'RMA smoke aprobada',
                'resolution_type' => 'credito_tienda',
                'total_usd' => (float) $productOne->price_usd,
                'total_bs' => 0,
            ]
        );

        RmaItem::create([
            'rma_id' => $rmaApproved->id,
            'product_id' => $productOne->id,
            'invoice_item_id' => null,
            'quantity' => 1,
            'unit_price_usd' => (float) $productOne->price_usd,
            'subtotal_usd' => (float) $productOne->price_usd,
            'subtotal_bs' => 0,
            'reason' => 'Validacion aprobada por garantia',
        ]);
    }
}