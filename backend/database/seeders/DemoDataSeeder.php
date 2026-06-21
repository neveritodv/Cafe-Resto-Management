<?php
namespace Database\Seeders;
use App\Models\User;
use App\Models\Category;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DemoDataSeeder extends Seeder {
    public function run() {
        // Create admin & waiter with firstOrCreate to avoid duplicates
        $admin = User::firstOrCreate(
            ['email' => 'admin@cafe.com'],
            ['name' => 'Admin', 'password' => Hash::make('password'), 'role' => 'admin']
        );
        $waiter = User::firstOrCreate(
            ['email' => 'waiter@cafe.com'],
            ['name' => 'Jean Serveur', 'password' => Hash::make('password'), 'role' => 'waiter']
        );

        // Categories
        $categories = [
            ['name'=>'Boissons','icon'=>'🥤','color'=>'#3b82f6'],
            ['name'=>'Entrées','icon'=>'🥗','color'=>'#22c55e'],
            ['name'=>'Plats','icon'=>'🍝','color'=>'#f59e0b'],
            ['name'=>'Desserts','icon'=>'🍰','color'=>'#ec4899'],
            ['name'=>'Cafés','icon'=>'☕','color'=>'#8b5cf6'],
        ];
        $catIds = [];
        foreach($categories as $cat) {
            $category = Category::firstOrCreate(
                ['name' => $cat['name']],
                ['icon' => $cat['icon'], 'color' => $cat['color'], 'is_active' => true]
            );
            $catIds[$category->name] = $category->id;
        }

        // Products
        $products = [
            ['name'=>'Café Noir','price'=>2.50,'stock'=>50,'category'=>'Cafés'],
            ['name'=>'Cappuccino','price'=>3.50,'stock'=>40,'category'=>'Cafés'],
            ['name'=>'Latte Macchiato','price'=>4.00,'stock'=>35,'category'=>'Cafés'],
            ['name'=>'Thé Vert','price'=>2.80,'stock'=>30,'category'=>'Boissons'],
            ['name'=>'Jus d\'Orange','price'=>3.20,'stock'=>25,'category'=>'Boissons'],
            ['name'=>'Salade César','price'=>8.50,'stock'=>20,'category'=>'Entrées'],
            ['name'=>'Soupe du Jour','price'=>6.00,'stock'=>15,'category'=>'Entrées'],
            ['name'=>'Pâtes Carbonara','price'=>12.00,'stock'=>25,'category'=>'Plats'],
            ['name'=>'Burger Maison','price'=>14.50,'stock'=>20,'category'=>'Plats'],
            ['name'=>'Tarte Tatin','price'=>6.50,'stock'=>15,'category'=>'Desserts'],
            ['name'=>'Mousse au Chocolat','price'=>5.50,'stock'=>18,'category'=>'Desserts'],
        ];
        foreach($products as $p) {
            $catId = $catIds[$p['category']];
            Product::firstOrCreate(
                ['name' => $p['name'], 'category_id' => $catId],
                [
                    'price' => $p['price'],
                    'cost_price' => $p['price'] * 0.4,
                    'stock_quantity' => $p['stock'],
                    'min_stock_alert' => 5,
                    'is_active' => true,
                    'description' => 'Délicieux '.$p['name'].' préparé avec soin.',
                ]
            );
        }

        // Sample orders – only if none exist
        if (Order::count() > 0) return;

        $productIds = Product::pluck('id')->toArray();
        for($i=0;$i<30;$i++) {
            $date = Carbon::now()->subDays(rand(0,7))->setHour(rand(8,22))->setMinute(rand(0,59));
            $statuses = ['paid','paid','paid','served','ready','pending'];
            $status = $statuses[array_rand($statuses)];
            $numItems = rand(1,4);
            $items = [];
            $subtotal = 0;
            for($j=0;$j<$numItems;$j++) {
                $product = Product::find($productIds[array_rand($productIds)]);
                $qty = rand(1,3);
                $total = $product->price * $qty;
                $subtotal += $total;
                $items[] = ['product_id'=>$product->id,'quantity'=>$qty,'unit_price'=>$product->price,'total_price'=>$total];
            }
            $discount = rand(0,5)>4 ? $subtotal*0.1 : 0;
            $tax = ($subtotal - $discount) * 0.1;
            $total = $subtotal - $discount + $tax;
            $order = Order::create([
                'order_number'=>'ORD-DEMO-'.str_pad($i+1,4,'0',STR_PAD_LEFT),
                'user_id'=>$waiter->id,
                'type'=>['dine_in','takeaway','delivery'][array_rand(['dine_in','takeaway','delivery'])],
                'status'=>$status,
                'payment_method'=>['cash','card','qr'][array_rand(['cash','card','qr'])],
                'subtotal'=>$subtotal,
                'discount'=>$discount,
                'tax'=>$tax,
                'total'=>$total,
                'paid_amount'=>$status==='paid'?$total:0,
                'change_amount'=>0,
                'ordered_at'=>$date,
                'created_at'=>$date,
                'updated_at'=>$date,
            ]);
            foreach($items as $item) OrderItem::create(array_merge($item,['order_id'=>$order->id]));
        }
    }
}