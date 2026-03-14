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

        return $this
            ->subject('Factura '.$invoice->number)
            ->view('emails.invoice_created')
            ->with([
                'invoice' => $invoice,
                'contact' => $contact,
                'publicUrl' => route('order.track', ['invoice' => $invoice->id]),
            ]);
    }
}
