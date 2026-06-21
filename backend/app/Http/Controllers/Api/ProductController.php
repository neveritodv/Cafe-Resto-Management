<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class ProductController extends Controller
{
    public function index(Request $request) {
        $query = Product::with('category');
        if ($request->has('category_id')) $query->where('category_id', $request->category_id);
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name','like',"%{$search}%")->orWhere('sku','like',"%{$search}%")->orWhere('qr_code','like',"%{$search}%");
            });
        }
        if ($request->has('active')) $query->where('is_active', filter_var($request->active, FILTER_VALIDATE_BOOLEAN));
        if ($request->has('low_stock') && $request->low_stock === 'true') $query->whereColumn('stock_quantity','<=','min_stock_alert');
        return response()->json($query->orderBy('name')->paginate(20));
    }

    public function store(Request $request) {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'stock_quantity' => 'nullable|integer|min:0',
            'min_stock_alert' => 'nullable|integer|min:1',
            'category_id' => 'required|exists:categories,id',
            'is_active' => 'boolean',
            'image' => 'nullable|image|max:2048',
        ]);
        $validated['stock_quantity'] = $validated['stock_quantity'] ?? 0;
        $validated['min_stock_alert'] = $validated['min_stock_alert'] ?? 5;
        $validated['is_active'] = $validated['is_active'] ?? true;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $validated['image'] = $path;
        }
        $product = Product::create($validated);
        if ($product->stock_quantity > 0) {
            StockMovement::create([
                'product_id' => $product->id,
                'user_id' => $request->user()->id,
                'type' => 'in',
                'quantity' => $product->stock_quantity,
                'previous_quantity' => 0,
                'new_quantity' => $product->stock_quantity,
                'reason' => 'Initial stock',
            ]);
        }
        return response()->json($product, 201);
    }

    public function show(Product $product) { return response()->json($product->load('category')); }

    public function update(Request $request, Product $product) {
        // Handle the case where the request is PUT with FormData – Laravel will parse it.
        // If the request is POST with _method=PUT, it's handled by Laravel's routing.
        // We'll use $request->all() but we need to handle file upload separately.
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'stock_quantity' => 'nullable|integer|min:0',
            'min_stock_alert' => 'nullable|integer|min:1',
            'category_id' => 'required|exists:categories,id',
            'is_active' => 'boolean',
            'image' => 'nullable|image|max:2048',
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $path = $request->file('image')->store('products', 'public');
            $validated['image'] = $path;
        } else {
            // If no new image, keep the existing one (or remove if explicitly set to null)
            // The frontend sends image: null when removed, but it's not in the request if not set.
            // If we want to allow removal, we need to send a separate field.
            // For now, we'll keep the existing image if not replaced.
            if ($request->has('remove_image') && $request->remove_image == '1') {
                if ($product->image) {
                    Storage::disk('public')->delete($product->image);
                }
                $validated['image'] = null;
            } else {
                // Keep existing image
                $validated['image'] = $product->image;
            }
        }

        $oldStock = $product->stock_quantity;
        $newStock = $validated['stock_quantity'] ?? $product->stock_quantity;
        $product->update($validated);
        if ($oldStock != $newStock) {
            StockMovement::create([
                'product_id' => $product->id,
                'user_id' => $request->user()->id,
                'type' => $newStock > $oldStock ? 'in' : 'out',
                'quantity' => abs($newStock - $oldStock),
                'previous_quantity' => $oldStock,
                'new_quantity' => $newStock,
                'reason' => 'Stock adjustment via product update',
            ]);
        }
        return response()->json($product);
    }

    public function destroy(Product $product) {
        if ($product->orderItems()->count() > 0) {
            return response()->json(['message' => 'Ce produit a des commandes associées. Impossible de le supprimer.'], 422);
        }
        if ($product->image) Storage::disk('public')->delete($product->image);
        $product->delete();
        return response()->json(['message' => 'Produit supprimé avec succès']);
    }

    public function scan($qrCode) {
        $product = Product::where('qr_code', $qrCode)->with('category')->firstOrFail();
        return response()->json($product);
    }

    public function generateQR(Product $product) {
        $qrContent = route('api.products.scan', $product->qr_code);
        $qrImage = base64_encode(QrCode::format('png')->size(200)->generate($qrContent));
        return response()->json(['qr_code' => $qrImage]);
    }

    public function updateStock(Request $request, Product $product) {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:0',
            'type' => 'required|in:in,out,adjustment',
            'reason' => 'nullable|string',
        ]);
        $oldStock = $product->stock_quantity;
        $newStock = $validated['type'] === 'out' ? max(0, $oldStock - $validated['quantity']) : $oldStock + $validated['quantity'];
        $product->update(['stock_quantity' => $newStock]);
        StockMovement::create([
            'product_id' => $product->id,
            'user_id' => $request->user()->id,
            'type' => $validated['type'],
            'quantity' => $validated['quantity'],
            'previous_quantity' => $oldStock,
            'new_quantity' => $newStock,
            'reason' => $validated['reason'] ?? null,
        ]);
        return response()->json(['product' => $product, 'movement' => $product->stockMovements()->latest()->first()]);
    }
}