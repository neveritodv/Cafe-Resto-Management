<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesForecast extends Model {
    use HasFactory;
    protected $fillable = ['product_id','forecast_date','hour','predicted_quantity','predicted_revenue','confidence_score'];
    protected $casts = ['forecast_date'=>'date','hour'=>'integer','predicted_quantity'=>'integer','predicted_revenue'=>'decimal:2','confidence_score'=>'decimal:2'];
    public function product() { return $this->belongsTo(Product::class); }
}
