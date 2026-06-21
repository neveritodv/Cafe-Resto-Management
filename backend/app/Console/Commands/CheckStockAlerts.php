<?php
namespace App\Console\Commands;
use App\Models\Product;
use Illuminate\Console\Command;

class CheckStockAlerts extends Command {
    protected $signature = 'stock:check-alerts';
    protected $description = 'Check for low stock products and send alerts';
    public function handle() {
        $lowStockProducts = Product::whereColumn('stock_quantity','<=','min_stock_alert')->where('is_active',true)->get();
        if($lowStockProducts->isEmpty()) { $this->info('✅ No low stock products found.'); return; }
        $this->info('⚠️ Low stock products:');
        $tableData = $lowStockProducts->map(fn($p)=>[$p->name,$p->stock_quantity,$p->min_stock_alert,$p->category->name??'N/A']);
        $this->table(['Product','Stock','Min Alert','Category'], $tableData);
        $this->info('✅ Stock alert check completed.');
    }
}