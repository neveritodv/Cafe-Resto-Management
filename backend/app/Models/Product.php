<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Product extends Model {
    use HasFactory;

    protected $fillable = [
        'name','sku','description','price','cost_price',
        'stock_quantity','min_stock_alert','image',
        'qr_code','category_id','is_active'
    ];

    protected $appends = ['image_url'];

    protected $casts = [
        'price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'stock_quantity' => 'integer',
        'min_stock_alert' => 'integer',
        'is_active' => 'boolean',
    ];

    protected static function boot() {
        parent::boot();
        static::creating(function ($product) {
            if (empty($product->sku)) {
                $product->sku = 'PRD-'.strtoupper(Str::random(8));
            }
            if (empty($product->qr_code)) {
                $product->qr_code = 'QR-'.strtoupper(Str::random(12));
            }
        });
    }

    public function category() {
        return $this->belongsTo(Category::class);
    }

    public function orderItems() {
        return $this->hasMany(OrderItem::class);
    }

    public function stockMovements() {
        return $this->hasMany(StockMovement::class);
    }

    public function salesForecasts() {
        return $this->hasMany(SalesForecast::class);
    }

    public function scopeActive($query) {
        return $query->where('is_active', true);
    }

    public function scopeLowStock($query) {
        return $query->whereColumn('stock_quantity', '<=', 'min_stock_alert');
    }

    public function isLowStock() {
        return $this->stock_quantity <= $this->min_stock_alert;
    }

    // ✅ Accessor for image URL
    public function getImageUrlAttribute() {
        return $this->image ? asset('storage/' . $this->image) : null;
    }
}