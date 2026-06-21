<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;          // ✅ ADD THIS LINE
use App\Models\SalesForecast;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function sales(Request $request) {
        $validated = $request->validate(['from'=>'required|date','to'=>'required|date|after_or_equal:from']);
        $orders = Order::whereBetween('ordered_at', [$validated['from'], $validated['to'].' 23:59:59'])
            ->where('status', 'paid')
            ->with('items.product')
            ->get();
        $totalRevenue = $orders->sum('total');
        $totalOrders = $orders->count();
        $average = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

        $categorySales = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereBetween('orders.ordered_at', [$validated['from'], $validated['to'].' 23:59:59'])
            ->where('orders.status', 'paid')
            ->select('categories.name', DB::raw('SUM(order_items.quantity) as total_quantity'), DB::raw('SUM(order_items.total_price) as total_revenue'))
            ->groupBy('categories.id', 'categories.name')
            ->get();

        // ✅ SQLite: strftime('%H', ordered_at)
        $hourlySales = Order::whereBetween('ordered_at', [$validated['from'], $validated['to'].' 23:59:59'])
            ->where('status', 'paid')
            ->select(
                DB::raw("strftime('%H', ordered_at) as hour"),
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(total) as revenue')
            )
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        $topProducts = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereBetween('orders.ordered_at', [$validated['from'], $validated['to'].' 23:59:59'])
            ->where('orders.status', 'paid')
            ->select('products.name', DB::raw('SUM(order_items.quantity) as total_quantity'), DB::raw('SUM(order_items.total_price) as total_revenue'))
            ->groupBy('products.id', 'products.name')
            ->orderBy('total_revenue', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'summary' => ['total_revenue' => $totalRevenue, 'total_orders' => $totalOrders, 'average_order' => $average],
            'category_sales' => $categorySales,
            'hourly_sales' => $hourlySales,
            'top_products' => $topProducts,
            'orders' => $orders,
        ]);
    }

    public function forecast(Request $request) {
        // Placeholder – we'll return empty for now
        return response()->json(['forecast' => [], 'total_predicted_revenue' => 0, 'suggestions' => []]);
    }

    public function getForecastData(Request $request) {
        return response()->json([]);
    }

    public function stockReport() {
        // ✅ Now Product is imported, and isLowStock() exists
        $products = Product::with('category')
            ->select('*')
            ->selectRaw('(stock_quantity * cost_price) as stock_value')
            ->get();
        $totalStockValue = $products->sum('stock_value');
        $lowStockCount = $products->filter(fn($p) => $p->isLowStock())->count();
        return response()->json([
            'products' => $products,
            'summary' => [
                'total_products' => $products->count(),
                'total_stock_value' => $totalStockValue,
                'low_stock_count' => $lowStockCount,
            ]
        ]);
    }
}