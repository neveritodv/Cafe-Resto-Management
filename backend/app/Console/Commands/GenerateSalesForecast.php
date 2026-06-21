<?php
namespace App\Console\Commands;
use App\Services\ForecastService;
use Illuminate\Console\Command;

class GenerateSalesForecast extends Command {
    protected $signature = 'forecast:generate {date?}';
    protected $description = 'Generate sales forecast for a given date';
    protected $forecastService;
    public function __construct(ForecastService $forecastService) { parent::__construct(); $this->forecastService = $forecastService; }
    public function handle() {
        $date = $this->argument('date') ?? now()->toDateString();
        $this->info("Generating forecast for {$date}...");
        $forecast = $this->forecastService->generateForDate($date);
        $this->info("✅ Forecast generated with " . $forecast->count() . " entries.");
    }
}