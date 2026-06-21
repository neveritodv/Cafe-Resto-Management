<?php
namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\SalesForecast;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon; // add if not present

class ForecastService {
    public function generateForDate($date) {
        $dateObj = Carbon::parse($date);
        $dayOfWeek = $dateObj->dayOfWeek; // 0=Sunday, 6=Saturday (matches SQLite)

        // SQLite: strftime('%w', ordered_at) returns 0-6 (Sunday=0)
        $historicalData = Order::where('status','paid')
            ->whereRaw("strftime('%w', ordered_at) = ?", [$dayOfWeek])
            ->whereDate('ordered_at','<',$date)
            ->whereDate('ordered_at','>=',$dateObj->copy()->subWeeks(4))
            ->join('order_items','orders.id','=','order_items.order_id')
            ->join('products','order_items.product_id','=','products.id')
            ->select(
                'products.id as product_id',
                DB::raw("strftime('%H', orders.ordered_at) as hour"),
                DB::raw('AVG(order_items.quantity) as avg_quantity'),
                DB::raw('AVG(order_items.total_price) as avg_revenue'),
                DB::raw('COUNT(DISTINCT orders.id) as order_count')
            )
            ->groupBy('products.id', 'hour')
            ->get();

        $products = Product::where('is_active', true)->get();
        $forecasts = [];

        foreach ($products as $product) {
            $productData = $historicalData->where('product_id', $product->id);
            if ($productData->isEmpty()) {
                for ($hour = 8; $hour <= 22; $hour++) {
                    $forecasts[] = [
                        'product_id' => $product->id,
                        'forecast_date' => $date,
                        'hour' => $hour,
                        'predicted_quantity' => 0,
                        'predicted_revenue' => 0,
                        'confidence_score' => 0.2,
                    ];
                }
                continue;
            }

            foreach ($productData as $data) {
                $predictedQty = max(0, round($data->avg_quantity * 0.9 + rand(0,5) * 0.1));
                $predictedRevenue = $predictedQty * $product->price;
                $confidence = min(1, 0.5 + ($data->order_count / 10) * 0.5);
                $forecasts[] = [
                    'product_id' => $product->id,
                    'forecast_date' => $date,
                    'hour' => $data->hour,
                    'predicted_quantity' => $predictedQty,
                    'predicted_revenue' => $predictedRevenue,
                    'confidence_score' => round($confidence, 2),
                ];
            }
        }

        foreach ($forecasts as $forecast) {
            SalesForecast::updateOrCreate(
                [
                    'product_id' => $forecast['product_id'],
                    'forecast_date' => $forecast['forecast_date'],
                    'hour' => $forecast['hour'],
                ],
                $forecast
            );
        }

        return collect($forecasts);
    }

    public function getSuggestedStock($date) {
        $forecasts = SalesForecast::whereBetween('forecast_date', [
            $date,
            Carbon::parse($date)->addDays(2)->toDateString()
        ])
            ->select('product_id', DB::raw('SUM(predicted_quantity) as total_predicted'))
            ->groupBy('product_id')
            ->get();

        $suggestions = [];
        foreach ($forecasts as $forecast) {
            $product = Product::find($forecast->product_id);
            if ($product) {
                $currentStock = $product->stock_quantity;
                $needed = max(0, $forecast->total_predicted - $currentStock);
                if ($needed > 0) {
                    $suggestions[] = [
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'current_stock' => $currentStock,
                        'predicted_need' => $forecast->total_predicted,
                        'suggested_order' => $needed + $product->min_stock_alert,
                        'priority' => $currentStock < $product->min_stock_alert ? 'high' : 'medium',
                    ];
                }
            }
        }
        return $suggestions;
    }
}