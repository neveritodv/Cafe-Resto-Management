<?php
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\StockController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::get('/products/scan/{qrCode}', [ProductController::class, 'scan']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/user/avatar', [AuthController::class, 'updateAvatar']);
    Route::post('/guest/order', [OrderController::class, 'guestStore']);

    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/dashboard/sales-chart', [DashboardController::class, 'salesChart']);
    Route::get('/dashboard/low-stock', [DashboardController::class, 'getLowStock']);

    Route::get('/categories/active', [CategoryController::class, 'active']);
    Route::apiResource('categories', CategoryController::class);

    Route::get('/products/active', [ProductController::class, 'active']);
    Route::get('/products/low-stock', [ProductController::class, 'lowStock']);
    Route::get('/products/{product}/qr', [ProductController::class, 'generateQR']);
    Route::post('/products/{product}/stock', [ProductController::class, 'updateStock']);
    Route::apiResource('products', ProductController::class);

    Route::get('/orders/today', [OrderController::class, 'today']);
    Route::put('/orders/{order}/status', [OrderController::class, 'updateStatus']);
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);
    Route::get('/orders/{order}/invoice', [OrderController::class, 'invoice']);
    Route::apiResource('orders', OrderController::class);

    Route::get('/stock/movements', [StockController::class, 'movements']);
    Route::get('/stock/alerts', [StockController::class, 'alerts']);
    Route::post('/stock/bulk', [StockController::class, 'bulkUpdate']);

    Route::get('/reports/sales', [ReportController::class, 'sales']);
    Route::get('/reports/forecast', [ReportController::class, 'forecast']);
    Route::get('/reports/forecast-data', [ReportController::class, 'getForecastData']);
    Route::get('/reports/stock', [ReportController::class, 'stockReport']);

    Route::apiResource('settings', SettingController::class)->except(['create','edit']);
    Route::get('/settings/{key}', [SettingController::class, 'show']);
});