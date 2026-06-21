<?php
namespace App\Services;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Order;

class PDFService {
    public function generateInvoice(Order $order) {
        $data = [
            'order' => $order,
            'items' => $order->items,
            'restaurant_name' => 'Café Restaurant',
            'restaurant_address' => '123 Rue de la Gastronomie, Paris',
            'restaurant_phone' => '+33 1 23 45 67 89',
            'restaurant_email' => 'contact@cafe-restaurant.com',
        ];
        $pdf = Pdf::loadView('pdf.invoice', $data);
        return $pdf->output();
    }
}