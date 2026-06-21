<?php
namespace App\Services;

use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\View;

class PDFService
{
    public function generateInvoice(Order $order, $logoBase64 = null)
    {
        try {
            $items = $order->items;
            
            // Prepare data for the view
            $data = [
                'order' => $order,
                'items' => $items,
                'logoBase64' => $logoBase64,
            ];
            
            // Load the view from pdf folder
            $pdf = Pdf::loadView('pdf.invoice', $data);
            $pdf->setPaper('A4', 'portrait');
            
            return $pdf->output();
            
        } catch (\Exception $e) {
            \Log::error('PDF generation error: ' . $e->getMessage());
            throw $e;
        }
    }
}