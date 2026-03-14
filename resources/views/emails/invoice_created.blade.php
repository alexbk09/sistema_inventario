@php
  $contactName = $contact->full_name ?? $invoice->customer->name ?? 'Cliente';
@endphp

<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <title>Factura {{ $invoice->number }}</title>
  </head>
  <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f3f4f6; padding: 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 8px; padding: 24px; text-align: left;">
            <tr>
              <td>
                <h1 style="font-size: 20px; margin: 0 0 8px 0; color: #111827;">Hola {{ $contactName }},</h1>
                <p style="font-size: 14px; margin: 0 0 16px 0; color: #4b5563;">
                  Hemos registrado tu compra con el número de factura <strong>{{ $invoice->number }}</strong>.
                </p>

                <p style="font-size: 14px; margin: 0 0 16px 0; color: #4b5563;">
                  Puedes ver el detalle y estado de tu pedido en el siguiente enlace:
                </p>

                <p style="margin: 0 0 24px 0;">
                  <a href="{{ $publicUrl }}" style="display: inline-block; padding: 10px 18px; background-color: #0f766e; color: #ffffff; text-decoration: none; border-radius: 9999px; font-size: 14px;">
                    Ver mi pedido
                  </a>
                </p>

                <h2 style="font-size: 16px; margin: 0 0 8px 0; color: #111827;">Resumen</h2>
                <p style="font-size: 14px; margin: 0 0 8px 0; color: #4b5563;">
                  Total: <strong>${{ number_format($invoice->total_usd, 2) }} USD</strong>
                  @if($invoice->total_bs)
                    &nbsp;·&nbsp; <strong>Bs {{ number_format($invoice->total_bs, 2, ',', '.') }}</strong>
                  @endif
                </p>

                @if($invoice->items && $invoice->items->count())
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-size: 13px; margin-top: 12px; border-collapse: collapse;">
                    <thead>
                      <tr>
                        <th align="left" style="padding: 4px 0; border-bottom: 1px solid #e5e7eb;">Producto</th>
                        <th align="center" style="padding: 4px 0; border-bottom: 1px solid #e5e7eb;">Cant.</th>
                        <th align="right" style="padding: 4px 0; border-bottom: 1px solid #e5e7eb;">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                    @foreach($invoice->items as $item)
                      <tr>
                        <td style="padding: 4px 0; border-bottom: 1px solid #f3f4f6;">{{ $item->product->name ?? 'Producto' }}</td>
                        <td align="center" style="padding: 4px 0; border-bottom: 1px solid #f3f4f6;">{{ $item->quantity }}</td>
                        <td align="right" style="padding: 4px 0; border-bottom: 1px solid #f3f4f6;">${{ number_format($item->subtotal_usd, 2) }}</td>
                      </tr>
                    @endforeach
                    </tbody>
                  </table>
                @endif

                <p style="font-size: 12px; margin: 24px 0 0 0; color: #9ca3af;">
                  Si no reconoces este correo, puedes ignorarlo.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
