<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\PDFService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    protected $pdfService;
    public function __construct(PDFService $pdfService) { $this->pdfService = $pdfService; }

    public function index(Request $request) {
        $query = Order::with(['user', 'items.product']);
        if ($request->has('status')) $query->where('status', $request->status);
        if ($request->has('date_from')) $query->whereDate('ordered_at', '>=', $request->date_from);
        if ($request->has('date_to')) $query->whereDate('ordered_at', '<=', $request->date_to);
        if ($request->has('type')) $query->where('type', $request->type);
        return response()->json($query->orderBy('ordered_at', 'desc')->paginate(15));
    }

    public function store(Request $request) {
        $validated = $request->validate([
            'type' => 'required|in:dine_in,takeaway,delivery',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string',
            'discount' => 'nullable|numeric|min:0',
            'payment_method' => 'required|in:cash,card,qr',
            'paid_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $subtotal = 0;
            $items = [];
            foreach ($validated['items'] as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);
                if ($product->stock_quantity < $itemData['quantity']) {
                    throw ValidationException::withMessages(['items' => "Stock insuffisant pour {$product->name}. Disponible: {$product->stock_quantity}"]);
                }
                $totalPrice = $product->price * $itemData['quantity'];
                $subtotal += $totalPrice;
                $items[] = [
                    'product_id' => $product->id,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $product->price,
                    'total_price' => $totalPrice,
                    'notes' => $itemData['notes'] ?? null,
                ];
            }
            $discount = $validated['discount'] ?? 0;
            $tax = $subtotal * 0.10;
            $total = $subtotal - $discount + $tax;
            $order = Order::create([
                'user_id' => $request->user()->id,
                'type' => $validated['type'],
                'status' => 'pending',
                'payment_method' => $validated['payment_method'],
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $tax,
                'total' => $total,
                'paid_amount' => $validated['paid_amount'] ?? 0,
                'change_amount' => max(0, ($validated['paid_amount'] ?? 0) - $total),
                'notes' => $validated['notes'] ?? null,
                'ordered_at' => now(),
            ]);
            foreach ($items as $item) {
                OrderItem::create(array_merge($item, ['order_id' => $order->id]));
                $product = Product::find($item['product_id']);
                $oldStock = $product->stock_quantity;
                $newStock = $oldStock - $item['quantity'];
                $product->update(['stock_quantity' => $newStock]);
                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => $request->user()->id,
                    'type' => 'out',
                    'quantity' => $item['quantity'],
                    'previous_quantity' => $oldStock,
                    'new_quantity' => $newStock,
                    'reason' => "Order #{$order->order_number}",
                ]);
            }
            DB::commit();
            $order->load(['user', 'items.product']);
            return response()->json($order, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(Order $order) { return response()->json($order->load(['user', 'items.product.category'])); }
    public function update(Request $request, Order $order) {
        if ($order->status === 'paid' || $order->status === 'cancelled') {
            return response()->json(['message' => 'Cette commande est finalisée et ne peut pas être modifiée.'], 422);
        }
        $validated = $request->validate(['status' => 'sometimes|in:pending,preparing,ready,served,paid,cancelled','notes' => 'nullable|string']);
        $order->update($validated);
        if ($validated['status'] === 'paid' && $order->paid_amount == 0) $order->update(['paid_amount' => $order->total]);
        if ($validated['status'] === 'served') $order->update(['served_at' => now()]);
        return response()->json($order);
    }
    public function updateStatus(Request $request, Order $order) {
        $validated = $request->validate(['status' => 'required|in:pending,preparing,ready,served,paid,cancelled']);
        if ($order->status === 'paid' || $order->status === 'cancelled') {
            return response()->json(['message' => 'Cette commande est déjà finalisée.'], 422);
        }
        $order->update(['status' => $validated['status']]);
        if ($validated['status'] === 'served') $order->update(['served_at' => now()]);
        if ($validated['status'] === 'paid' && $order->paid_amount == 0) $order->update(['paid_amount' => $order->total]);
        return response()->json($order);
    }
    public function cancel(Order $order) {
        if ($order->status === 'paid') return response()->json(['message' => 'Une commande payée ne peut pas être annulée.'], 422);
        DB::beginTransaction();
        try {
            foreach ($order->items as $item) {
                $product = Product::find($item->product_id);
                if ($product) {
                    $oldStock = $product->stock_quantity;
                    $newStock = $oldStock + $item->quantity;
                    $product->update(['stock_quantity' => $newStock]);
                    StockMovement::create([
                        'product_id' => $product->id,
                        'user_id' => auth()->id(),
                        'type' => 'in',
                        'quantity' => $item->quantity,
                        'previous_quantity' => $oldStock,
                        'new_quantity' => $newStock,
                        'reason' => "Order cancellation #{$order->order_number}",
                    ]);
                }
            }
            $order->update(['status' => 'cancelled']);
            DB::commit();
            return response()->json(['message' => 'Commande annulée avec succès', 'order' => $order]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
    public function invoice(Order $order, PDFService $pdfService) {
        $order->load(['user', 'items.product']);
        $pdf = $pdfService->generateInvoice($order);
        return response($pdf, 200)->header('Content-Type', 'application/pdf');
    }
    public function today() {
        $orders = Order::with(['user', 'items.product'])->today()->orderBy('ordered_at', 'desc')->get();
        $total = $orders->where('status', 'paid')->sum('total');
        return response()->json(['orders'=>$orders, 'total_revenue'=>$total, 'order_count'=>$orders->count()]);
    }

    // ✅ Guest Store method
public function guestStore(Request $request)
{
    // Get or create guest user
    $guestUser = User::firstOrCreate(
        ['email' => 'guest@cafe.com'],
        ['name' => 'Guest', 'password' => Hash::make('guest123'), 'role' => 'customer']
    );

    // ✅ Set the user on the request (without calling Auth::login)
    $request->setUserResolver(function () use ($guestUser) {
        return $guestUser;
    });

    // Now call the store method – it will use $request->user()
    return $this->store($request);
}
}