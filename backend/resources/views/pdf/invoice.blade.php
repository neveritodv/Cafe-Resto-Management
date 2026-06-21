<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Facture #{{ $order->order_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', Arial, sans-serif; padding: 40px; color: #1a1a2e; }
        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #6366f1; font-size: 28px; }
        .header .restaurant { font-size: 14px; color: #666; }
        .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .invoice-info .block { font-size: 14px; line-height: 1.8; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        table th { background: #f3f4f6; padding: 12px; text-align: left; font-size: 13px; text-transform: uppercase; color: #555; }
        table td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
        table .total-row td { font-weight: bold; background: #f9fafb; }
        .summary { margin-top: 20px; width: 300px; margin-left: auto; }
        .summary .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .summary .total { font-size: 18px; font-weight: bold; color: #6366f1; padding-top: 12px; border-bottom: none; }
        .footer { margin-top: 50px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .status-paid { background: #d1fae5; color: #065f46; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>☕ Café Restaurant</h1>
            <div class="restaurant">
                123 Rue de la Gastronomie, Paris<br>
                Tél: +33 1 23 45 67 89<br>
                contact@cafe-restaurant.com
            </div>
        </div>
        <div style="text-align: right;">
            <h2 style="color: #6366f1;">FACTURE</h2>
            <div style="font-size: 14px; color: #666;">
                N° <strong>{{ $order->order_number }}</strong><br>
                Date: {{ $order->ordered_at->format('d/m/Y H:i') }}
            </div>
        </div>
    </div>

    <div class="invoice-info">
        <div class="block">
            <strong>Serveur:</strong> {{ $order->user->name }}<br>
            <strong>Type:</strong> {{ ucfirst($order->type) }}<br>
            <strong>Statut:</strong>
            <span class="status-badge status-{{ $order->status }}">
                {{ $order->status_label }}
            </span>
        </div>
        <div class="block" style="text-align: right;">
            <strong>Méthode de paiement:</strong> {{ ucfirst($order->payment_method) }}<br>
            @if($order->paid_amount > 0)
                <strong>Payé:</strong> {{ number_format($order->paid_amount, 2) }} €
            @endif
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Produit</th>
                <th style="text-align: center;">Qté</th>
                <th style="text-align: right;">Prix unitaire</th>
                <th style="text-align: right;">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $item)
            <tr>
                <td>
                    {{ $item->product->name }}
                    @if($item->notes)
                        <br><small style="color: #888;">{{ $item->notes }}</small>
                    @endif
                </td>
                <td style="text-align: center;">{{ $item->quantity }}</td>
                <td style="text-align: right;">{{ number_format($item->unit_price, 2) }} €</td>
                <td style="text-align: right;">{{ number_format($item->total_price, 2) }} €</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="summary">
        <div class="row"><span>Sous-total</span><span>{{ number_format($order->subtotal, 2) }} €</span></div>
        @if($order->discount > 0)
            <div class="row"><span>Réduction</span><span style="color: #ef4444;">- {{ number_format($order->discount, 2) }} €</span></div>
        @endif
        <div class="row"><span>TVA (10%)</span><span>{{ number_format($order->tax, 2) }} €</span></div>
        <div class="row total"><span>TOTAL</span><span>{{ number_format($order->total, 2) }} €</span></div>
        @if($order->paid_amount > 0)
            <div class="row"><span>Payé</span><span>{{ number_format($order->paid_amount, 2) }} €</span></div>
            @if($order->change_amount > 0)
                <div class="row"><span>Monnaie rendue</span><span>{{ number_format($order->change_amount, 2) }} €</span></div>
            @endif
        @endif
    </div>

    @if($order->notes)
        <div style="margin-top: 20px; padding: 12px; background: #f9fafb; border-radius: 8px; color: #555; font-size: 14px;">
            <strong>Notes:</strong> {{ $order->notes }}
        </div>
    @endif

    <div class="footer">
        Merci de votre visite ! À bientôt au Café Restaurant.<br>
        Cette facture est générée automatiquement.
    </div>
</body>
</html>