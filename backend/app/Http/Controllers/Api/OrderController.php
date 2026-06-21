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
    
    public function __construct(PDFService $pdfService) 
    {
        $this->pdfService = $pdfService;
    }

    public function index(Request $request) {
        try {
            $query = Order::with(['user', 'items.product']);
            
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }
            if ($request->has('date_from') && $request->date_from) {
                $query->whereDate('ordered_at', '>=', $request->date_from);
            }
            if ($request->has('date_to') && $request->date_to) {
                $query->whereDate('ordered_at', '<=', $request->date_to);
            }
            if ($request->has('type') && $request->type) {
                $query->where('type', $request->type);
            }
            
            // Handle limit parameter for non-paginated requests (used by Header notifications)
            if ($request->has('limit')) {
                $orders = $query->orderBy('ordered_at', 'desc')->limit($request->limit)->get();
                return response()->json([
                    'data' => $orders
                ]);
            }
            
            $orders = $query->orderBy('ordered_at', 'desc')->paginate(15);
            return response()->json($orders);
            
        } catch (\Exception $e) {
            \Log::error('Orders index error: ' . $e->getMessage());
            \Log::error('Line: ' . $e->getLine());
            \Log::error('File: ' . $e->getFile());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des commandes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request) {
        try {
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
        } catch (\Exception $e) {
            \Log::error('Order store error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show(Order $order) { 
        try {
            return response()->json($order->load(['user', 'items.product.category']));
        } catch (\Exception $e) {
            \Log::error('Order show error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    public function update(Request $request, Order $order) {
        try {
            if ($order->status === 'paid' || $order->status === 'cancelled') {
                return response()->json(['message' => 'Cette commande est finalisée et ne peut pas être modifiée.'], 422);
            }
            $validated = $request->validate([
                'status' => 'sometimes|in:pending,preparing,ready,served,paid,cancelled',
                'notes' => 'nullable|string'
            ]);
            $order->update($validated);
            if (isset($validated['status']) && $validated['status'] === 'paid' && $order->paid_amount == 0) {
                $order->update(['paid_amount' => $order->total]);
            }
            if (isset($validated['status']) && $validated['status'] === 'served') {
                $order->update(['served_at' => now()]);
            }
            return response()->json($order);
        } catch (\Exception $e) {
            \Log::error('Order update error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    public function updateStatus(Request $request, Order $order) {
        try {
            $validated = $request->validate(['status' => 'required|in:pending,preparing,ready,served,paid,cancelled']);
            if ($order->status === 'paid' || $order->status === 'cancelled') {
                return response()->json(['message' => 'Cette commande est déjà finalisée.'], 422);
            }
            $order->update(['status' => $validated['status']]);
            if ($validated['status'] === 'served') $order->update(['served_at' => now()]);
            if ($validated['status'] === 'paid' && $order->paid_amount == 0) $order->update(['paid_amount' => $order->total]);
            return response()->json($order);
        } catch (\Exception $e) {
            \Log::error('Order status update error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    public function cancel(Order $order) {
        try {
            if ($order->status === 'paid') {
                return response()->json(['message' => 'Une commande payée ne peut pas être annulée.'], 422);
            }
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
        } catch (\Exception $e) {
            \Log::error('Order cancel error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
public function invoice(Order $order)
{
    try {
        // Load relationships
        $order->load(['user', 'items.product']);
        $items = $order->items;
        
        // Get logo as base64
        $logoBase64 = null;
        $logoPath = public_path('logo.png');
        if (file_exists($logoPath)) {
            $logoData = base64_encode(file_get_contents($logoPath));
            $logoBase64 = 'data:image/png;base64,' . $logoData;
        }
        
        // Prepare data for view
        $data = [
            'order' => $order,
            'items' => $items,
            'logoBase64' => $logoBase64,
        ];
        
        // Load view from pdf folder
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.invoice', $data);
        $pdf->setPaper('A4', 'portrait');
        
        return $pdf->download('facture-' . $order->order_number . '.pdf');
        
    } catch (\Exception $e) {
        \Log::error('Invoice Generation Error: ' . $e->getMessage());
        \Log::error('Line: ' . $e->getLine());
        \Log::error('File: ' . $e->getFile());
        
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la génération de la facture',
            'error' => $e->getMessage(),
            'line' => $e->getLine(),
            'file' => $e->getFile()
        ], 500);
    }
}
    
    public function today() {
        try {
            $orders = Order::with(['user', 'items.product'])
                ->whereDate('ordered_at', today())
                ->orderBy('ordered_at', 'desc')
                ->get();
            $total = $orders->where('status', 'paid')->sum('total');
            return response()->json([
                'orders' => $orders, 
                'total_revenue' => $total, 
                'order_count' => $orders->count()
            ]);
        } catch (\Exception $e) {
            \Log::error('Today orders error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Guest Store method
    public function guestStore(Request $request)
    {
        try {
            // Get or create guest user
            $guestUser = User::firstOrCreate(
                ['email' => 'guest@cafe.com'],
                ['name' => 'Guest', 'password' => Hash::make('guest123'), 'role' => 'customer']
            );

            // Set the user on the request
            $request->setUserResolver(function () use ($guestUser) {
                return $guestUser;
            });

            // Now call the store method
            return $this->store($request);
        } catch (\Exception $e) {
            \Log::error('Guest order error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}