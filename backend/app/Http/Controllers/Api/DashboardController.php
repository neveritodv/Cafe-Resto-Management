<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $today = now()->toDateString();
        $todayOrders = Order::whereDate('ordered_at', $today)->get();
        $todayRevenue = $todayOrders->where('status', 'paid')->sum('total');

        $weekOrders = Order::whereDate('ordered_at', '>=', now()->startOfWeek())->get();
        $weekRevenue = $weekOrders->where('status', 'paid')->sum('total');

        $monthOrders = Order::whereDate('ordered_at', '>=', now()->startOfMonth())->get();
        $monthRevenue = $monthOrders->where('status', 'paid')->sum('total');

        $lowStock = Product::whereColumn('stock_quantity', '<=', 'min_stock_alert')->count();

        $topProducts = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', 'paid')
            ->whereDate('orders.ordered_at', '>=', now()->subDays(30))
            ->select('products.id', 'products.name', DB::raw('SUM(order_items.quantity) as total_quantity'), DB::raw('SUM(order_items.total_price) as total_revenue'))
            ->groupBy('products.id', 'products.name')
            ->orderBy('total_quantity', 'desc')
            ->limit(5)
            ->get();

        $recentOrders = Order::with('user')->orderBy('ordered_at', 'desc')->limit(10)->get();

        // SQLite: strftime('%H', ordered_at)
        $hourlySales = Order::whereDate('ordered_at', $today)
            ->where('status', 'paid')
            ->select(
                DB::raw("strftime('%H', ordered_at) as hour"),
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(total) as revenue')
            )
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        return response()->json([
            'today' => [
                'revenue' => $todayRevenue,
                'orders' => $todayOrders->count(),
                'average' => $todayOrders->count() > 0 ? $todayRevenue / $todayOrders->count() : 0,
            ],
            'week' => ['revenue' => $weekRevenue, 'orders' => $weekOrders->count()],
            'month' => ['revenue' => $monthRevenue, 'orders' => $monthOrders->count()],
            'low_stock' => $lowStock,
            'top_products' => $topProducts,
            'recent_orders' => $recentOrders,
            'hourly_sales' => $hourlySales,
            'total_products' => Product::count(),
            'total_categories' => Category::count(),
        ]);
    }

    // ✅ FIXED – SQLite compatible with raw SQL strings
    public function salesChart(Request $request)
    {
        $period = $request->get('period', 'week');
        $query = Order::where('status', 'paid');

        switch ($period) {
            case 'week':
                $query->whereDate('ordered_at', '>=', now()->startOfWeek());
                $groupBy = 'DATE(ordered_at)';
                break;
            case 'month':
                $query->whereDate('ordered_at', '>=', now()->startOfMonth());
                $groupBy = 'DATE(ordered_at)';
                break;
            case 'year':
                $query->whereDate('ordered_at', '>=', now()->startOfYear());
                $groupBy = "strftime('%Y-%m', ordered_at)"; // year-month for monthly grouping
                break;
            default:
                $query->whereDate('ordered_at', '>=', now()->startOfWeek());
                $groupBy = 'DATE(ordered_at)';
        }

        $data = $query->selectRaw("$groupBy as date, SUM(total) as revenue, COUNT(*) as orders")
            ->groupByRaw($groupBy)
            ->orderByRaw($groupBy)
            ->get();

        return response()->json($data);
    }

    public function getLowStock()
    {
        return response()->json(Product::whereColumn('stock_quantity', '<=', 'min_stock_alert')->with('category')->get());
    }
}