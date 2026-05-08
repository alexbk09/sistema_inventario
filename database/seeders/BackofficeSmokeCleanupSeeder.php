<?php

namespace Database\Seeders;

use App\Models\CreditAccount;
use App\Models\CreditMovement;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Layaway;
use App\Models\LayawayItem;
use App\Models\Rma;
use App\Models\RmaItem;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;

class BackofficeSmokeCleanupSeeder extends Seeder
{
    public function run(): void
    {
        $layawayIds = Layaway::whereIn('number', ['QA-LAY-001', 'QA-LAY-002', 'QA-LAY-003'])->pluck('id');
        if ($layawayIds->isNotEmpty()) {
          LayawayItem::whereIn('layaway_id', $layawayIds)->delete();
          Layaway::whereIn('id', $layawayIds)->delete();
        }

        $rmaIds = Rma::whereIn('number', ['QA-RMA-001', 'QA-RMA-002'])->pluck('id');
        if ($rmaIds->isNotEmpty()) {
          RmaItem::whereIn('rma_id', $rmaIds)->delete();
          Rma::whereIn('id', $rmaIds)->delete();
        }

        $invoiceIds = Invoice::whereIn('number', ['QA-VENTA-001', 'QA-CRED-001'])->pluck('id');
        if ($invoiceIds->isNotEmpty()) {
            CreditMovement::whereIn('invoice_id', $invoiceIds)->delete();
            \App\Models\InvoicePayment::whereIn('invoice_id', $invoiceIds)->delete();
            Invoice::whereIn('id', $invoiceIds)->delete();
        }

        $creditCustomer = Customer::where('email', 'credito.qa@example.com')->first();
        if ($creditCustomer) {
            $accountIds = CreditAccount::where('customer_id', $creditCustomer->id)->pluck('id');
            if ($accountIds->isNotEmpty()) {
                CreditMovement::whereIn('credit_account_id', $accountIds)->delete();
                CreditAccount::whereIn('id', $accountIds)->delete();
            }
            $creditCustomer->delete();
        }

        Warehouse::where('code', 'QA01')->delete();
    }
}