<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockMovement;
use App\Models\Product;
use Illuminate\Http\Request;

class StockController extends Controller
{
    public function movements(Request $request)
    {
        try {
            // Check if table exists
            if (!\Schema::hasTable('stock_movements')) {
                return response()->json(['error' => 'Table "stock_movements" does not exist. Run migrations.'], 500);
            }

            $query = StockMovement::with(['product', 'user']);

            if ($request->has('product_id')) {
                $query->where('product_id', $request->product_id);
            }
            if ($request->has('type')) {
                $query->where('type', $request->type);
            }
            if ($request->has('from')) {
                $query->whereDate('moved_at', '>=', $request->from);
            }
            if ($request->has('to')) {
                $query->whereDate('moved_at', '<=', $request->to);
            }

            $movements = $query->orderBy('moved_at', 'desc')->get();

            return response()->json([
                'data' => $movements,
                'total' => $movements->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    public function alerts()
    {
        try {
            return response()->json(Product::whereColumn('stock_quantity', '<=', 'min_stock_alert')->with('category')->get());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:0',
        ]);

        $results = [];
        foreach ($validated['items'] as $item) {
            $product = Product::find($item['product_id']);
            $oldStock = $product->stock_quantity;
            $newStock = $item['quantity'];
            $product->update(['stock_quantity' => $newStock]);

            $movement = StockMovement::create([
                'product_id' => $product->id,
                'user_id' => $request->user()->id,
                'type' => $newStock > $oldStock ? 'in' : 'out',
                'quantity' => abs($newStock - $oldStock),
                'previous_quantity' => $oldStock,
                'new_quantity' => $newStock,
                'reason' => 'Bulk update',
            ]);

            $results[] = ['product' => $product, 'movement' => $movement];
        }

        return response()->json($results);
    }
}