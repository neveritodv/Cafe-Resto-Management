<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture #{{ $order->order_number }} - RestauFlow</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, Helvetica, sans-serif;
            padding: 30px;
            color: #1a1a2e;
            background: #ffffff;
            line-height: 1.6;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        
        .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .header-left .logo {
            height: 55px;
            width: auto;
            display: block;
        }
        
        .header-left .brand h1 {
            color: #1a1a2e;
            font-size: 24px;
            font-weight: bold;
            margin: 0;
        }
        
        .header-left .brand .slogan {
            font-size: 11px;
            color: #9ca3af;
        }
        
        .invoice-title {
            text-align: right;
        }
        
        .invoice-title h2 {
            color: #1a1a2e;
            font-size: 22px;
            font-weight: bold;
            margin: 0;
        }
        
        .invoice-title .details {
            font-size: 13px;
            color: #6b7280;
        }
        
        .invoice-title .details strong {
            color: #1f2937;
        }
        
        .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .invoice-info .block {
            font-size: 13px;
            line-height: 2.0;
        }
        
        .invoice-info .block strong {
            color: #4b5563;
            display: inline-block;
            min-width: 65px;
        }
        
        /* CLEAN STATUS BADGE - NO COLORED BACKGROUND */
        .status-badge {
            display: inline-block;
            padding: 0;
            font-size: 13px;
            font-weight: 600;
            line-height: 1.6;
            vertical-align: middle;
            margin-left: 2px;
            color: #1a1a2e;
            background: transparent !important;
        }
        
        /* Remove all colored backgrounds for statuses */
        .status-paid,
        .status-pending,
        .status-preparing,
        .status-ready,
        .status-served,
        .status-cancelled {
            background: transparent !important;
            color: #1a1a2e !important;
        }
        
        .payment-method {
            display: inline-block;
            padding: 2px 12px;
            border-radius: 12px;
            font-size: 12px;
            background: #f3f4f6;
            color: #4b5563;
            font-weight: 500;
            white-space: nowrap;
            vertical-align: middle;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        table thead th {
            background: #f9fafb;
            padding: 10px 12px;
            text-align: left;
            font-size: 12px;
            text-transform: uppercase;
            color: #6b7280;
            font-weight: 600;
            border-bottom: 2px solid #e5e7eb;
        }
        
        table thead th:first-child {
            text-align: left;
        }
        
        table thead th:not(:first-child) {
            text-align: center;
        }
        
        table tbody td {
            padding: 10px 12px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 13px;
            color: #1f2937;
        }
        
        table tbody td:first-child {
            text-align: left;
        }
        
        table tbody td:not(:first-child) {
            text-align: center;
        }
        
        table tbody td:last-child {
            text-align: right;
            font-weight: 500;
        }
        
        .summary {
            margin-top: 15px;
            width: 100%;
            max-width: 320px;
            margin-left: auto;
        }
        
        .summary .row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 13px;
            color: #4b5563;
        }
        
        .summary .row:not(:last-child) {
            border-bottom: 1px solid #f3f4f6;
        }
        
        .summary .row.total {
            font-size: 18px;
            font-weight: bold;
            color: #1a1a2e;
            border-top: 2px solid #1a1a2e;
            padding-top: 10px;
            margin-top: 4px;
        }
        
        .summary .row.discount {
            color: #dc2626;
        }
        
        .summary .row.change {
            color: #059669;
        }
        
        .notes-box {
            margin-top: 15px;
            padding: 12px 15px;
            background: #f9fafb;
            border-radius: 6px;
            color: #4b5563;
            font-size: 13px;
            border-left: 3px solid #4b5563;
        }
        
        .table-box {
            margin-top: 12px;
            padding: 10px;
            background: #f9fafb;
            border-radius: 6px;
            color: #4b5563;
            font-size: 13px;
            text-align: center;
            font-weight: 600;
        }
        
        .footer {
            margin-top: 35px;
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
            padding-top: 18px;
        }
        
        .footer .thanks {
            font-size: 17px;
            color: #1a1a2e;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .footer .info {
            font-size: 12px;
            color: #6b7280;
            line-height: 1.8;
        }
        
        .footer .small {
            margin-top: 8px;
            font-size: 11px;
            color: #d1d5db;
        }
        
        .footer .copyright {
            margin-top: 6px;
            font-size: 10px;
            color: #e5e7eb;
        }
        
        @media print {
            body {
                padding: 15px;
            }
            .header-left .logo {
                height: 45px;
            }
        }
        
        @media (max-width: 600px) {
            body {
                padding: 15px;
            }
            .header {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
            .invoice-title {
                text-align: left;
                width: 100%;
            }
            .invoice-info {
                flex-direction: column;
                gap: 5px;
            }
            .invoice-info .block:last-child {
                text-align: left !important;
            }
            .summary {
                max-width: 100%;
            }
            .header-left .brand h1 {
                font-size: 20px;
            }
            table thead th,
            table tbody td {
                padding: 6px 8px;
                font-size: 12px;
            }
            .header-left .logo {
                height: 40px;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="header-left">
            @if(isset($logoBase64) && $logoBase64)
                <img src="{{ $logoBase64 }}" alt="RestauFlow" class="logo">
            @else
                <div style="font-size: 32px; font-weight: bold; color: #1a1a2e;">RF</div>
            @endif
            <div class="brand">
                <h1>RestauFlow</h1>
                <span class="slogan">Gestion de Restaurant &amp; Caisse Automatique</span>
            </div>
        </div>
        <div class="invoice-title">
            <h2>FACTURE</h2>
            <div class="details">
                N° <strong>#{{ $order->order_number }}</strong><br>
                {{ $order->ordered_at->format('d/m/Y H:i') }}
            </div>
        </div>
    </div>

    <!-- Invoice Info -->
    <div class="invoice-info">
        <div class="block">
            <strong>Serveur:</strong> {{ $order->user->name }}<br>
            <strong>Type:</strong>
            @if($order->type == 'dine_in')
                Sur place
            @elseif($order->type == 'takeaway')
                À emporter
            @elseif($order->type == 'delivery')
                Livraison
            @else
                {{ ucfirst($order->type) }}
            @endif
            <br>
            <strong>Statut:</strong>
            <span class="status-badge">
                {{ $order->status_label }}
            </span>
        </div>
        <div class="block" style="text-align: right;">
            <strong>Paiement:</strong>
            <span class="payment-method">
                @if($order->payment_method == 'cash')
                    Espèces
                @elseif($order->payment_method == 'card')
                    Carte bancaire
                @elseif($order->payment_method == 'qr')
                    QR Code
                @else
                    {{ ucfirst($order->payment_method) }}
                @endif
            </span>
            <br>
            @if($order->paid_amount > 0)
                <strong>Payé:</strong> {{ number_format($order->paid_amount, 2) }} €
            @endif
        </div>
    </div>

    <!-- Items Table -->
    <table>
        <thead>
            <tr>
                <th style="text-align:left;">Produit</th>
                <th>Qté</th>
                <th>Prix unitaire</th>
                <th style="text-align:right;">Total</th>
            </tr>
        </thead>
        <tbody>
            @forelse($items as $item)
            <tr>
                <td style="text-align:left;">
                    {{ $item->product->name }}
                    @if($item->notes)
                        <br><small style="color: #9ca3af; font-size: 11px;">{{ $item->notes }}</small>
                    @endif
                </td>
                <td>{{ $item->quantity }}</td>
                <td>{{ number_format($item->unit_price, 2) }} €</td>
                <td style="text-align:right;">{{ number_format($item->total_price, 2) }} €</td>
            </tr>
            @empty
            <tr>
                <td colspan="4" style="text-align:center; color:#9ca3af; padding:25px 0;">
                    Aucun article dans cette commande
                </td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Summary -->
    <div class="summary">
        <div class="row">
            <span>Sous-total</span>
            <span>{{ number_format($order->subtotal, 2) }} €</span>
        </div>
        @if($order->discount > 0)
            <div class="row discount">
                <span>Réduction</span>
                <span>- {{ number_format($order->discount, 2) }} €</span>
            </div>
        @endif
        <div class="row">
            <span>TVA (10%)</span>
            <span>{{ number_format($order->tax, 2) }} €</span>
        </div>
        <div class="row total">
            <span>TOTAL</span>
            <span>{{ number_format($order->total, 2) }} €</span>
        </div>
        @if($order->paid_amount > 0)
            <div class="row">
                <span>Payé</span>
                <span>{{ number_format($order->paid_amount, 2) }} €</span>
            </div>
            @if($order->change_amount > 0)
                <div class="row change">
                    <span>Monnaie rendue</span>
                    <span>{{ number_format($order->change_amount, 2) }} €</span>
                </div>
            @endif
        @endif
    </div>

    <!-- Notes -->
    @if(!empty($order->notes))
        <div class="notes-box">
            <strong>Notes:</strong> {{ $order->notes }}
        </div>
    @endif

    <!-- Table Number for Dine-in -->
    @if($order->type == 'dine_in' && !empty($order->table_number))
        <div class="table-box">
            Table n°{{ $order->table_number }}
        </div>
    @endif

    <!-- Footer -->
    <div class="footer">
        <p class="thanks">Merci de votre visite !</p>
        <p class="info">
            À bientôt chez <strong>RestauFlow</strong><br>
            123 Rue de la Gastronomie, 75001 Paris<br>
            Tél: +33 1 23 45 67 89 | Email: contact@restauflow.com
        </p>
        <p class="small">Cette facture est générée automatiquement.</p>
        <p class="copyright">&copy; {{ date('Y') }} RestauFlow - Tous droits réservés</p>
    </div>
</body>
</html>