<?php

namespace App\Mail;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class InvoiceCreated extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Invoice $invoice;

    public function __construct(Invoice $invoice)
    {
        $this->invoice = $invoice->loadMissing(['customer', 'contact', 'items.product']);
    }

    public function build(): self
    {
        $invoice = $this->invoice;
        $contact = $invoice->contact;

        $general = \App\Support\Settings::get('general', [
            'company_name' => config('app.name', 'Sistema Inventario'),
        ]);

        $mail = \App\Support\Settings::get('mail', [
            'invoice_subject_prefix' => 'Factura',
        ]);

        $prefix = (string) ($mail['invoice_subject_prefix'] ?? 'Factura');
        $company = (string) ($general['company_name'] ?? config('app.name', 'Sistema Inventario'));

        return $this
            ->subject(trim($prefix.' '.$invoice->number.' · '.$company))
            ->view('emails.invoice_created')
            ->with([
                'invoice' => $invoice,
                'contact' => $contact,
                'publicUrl' => route('order.track', ['invoice' => $invoice->id]),
            ]);
    }
}
