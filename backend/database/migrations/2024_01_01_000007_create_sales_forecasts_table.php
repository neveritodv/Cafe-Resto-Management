<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::create('sales_forecasts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->date('forecast_date');
            $table->integer('hour');
            $table->integer('predicted_quantity');
            $table->decimal('predicted_revenue', 10, 2);
            $table->decimal('confidence_score', 5, 2)->default(0);
            $table->timestamps();
        });
    }
    public function down() { Schema::dropIfExists('sales_forecasts'); }
};