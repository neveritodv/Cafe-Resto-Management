<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Order extends Model {
    use HasFactory;
    protected $fillable = ['order_number','user_id','type','status','payment_method','subtotal','discount','tax','total','paid_amount','change_amount','notes','ordered_at','served_at'];
    protected $casts = ['subtotal'=>'decimal:2','discount'=>'decimal:2','tax'=>'decimal:2','total'=>'decimal:2','paid_amount'=>'decimal:2','change_amount'=>'decimal:2','ordered_at'=>'datetime','served_at'=>'datetime'];
    
    protected static function boot() {
        parent::boot();
        static::creating(function ($order) {
            if (empty($order->order_number)) $order->order_number = 'ORD-'.date('Ymd').'-'.strtoupper(Str::random(6));
        });
    }
    
    public function user() { return $this->belongsTo(User::class); }
    public function items() { return $this->hasMany(OrderItem::class); }
    public function scopePending($query) { return $query->where('status','pending'); }
    public function scopeToday($query) { return $query->whereDate('ordered_at', today()); }
    
    public function getStatusColorAttribute() { 
        return match($this->status) { 
            'pending'=>'yellow',
            'preparing'=>'blue',
            'ready'=>'green',
            'served'=>'indigo',
            'paid'=>'emerald',
            'cancelled'=>'red', 
            default=>'gray' 
        }; 
    }
    
    public function getStatusLabelAttribute() { 
        return match($this->status) { 
            'pending'=>'En attente',
            'preparing'=>'En préparation',
            'ready'=>'Prêt',
            'served'=>'Servi',
            'paid'=>'Payé',
            'cancelled'=>'Annulé', 
            default=>$this->status 
        }; 
    }
}