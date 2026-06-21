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

// Public routes (no auth required)
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/guest/order', [OrderController::class, 'guestStore']);

// Public product routes
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{product}', [ProductController::class, 'show']);
Route::get('/products/scan/{qrCode}', [ProductController::class, 'scan']);

// ✅ PUBLIC CATEGORY ROUTES
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/active', [CategoryController::class, 'active']);

Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::post('/user/avatar', [AuthController::class, 'updateAvatar']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/dashboard/sales-chart', [DashboardController::class, 'salesChart']);
    Route::get('/dashboard/low-stock', [DashboardController::class, 'getLowStock']);

    // Categories (write operations – protected)
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{category}', [CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

    // Products (write operations – protected)
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);
    Route::post('/products/{product}/stock', [ProductController::class, 'updateStock']);
    Route::get('/products/{product}/qr', [ProductController::class, 'generateQR']);

    // Orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/today', [OrderController::class, 'today']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::put('/orders/{order}', [OrderController::class, 'update']);
    Route::put('/orders/{order}/status', [OrderController::class, 'updateStatus']);
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);
    Route::get('/orders/{order}/invoice', [OrderController::class, 'invoice']);

    // Stock
    Route::get('/stock/movements', [StockController::class, 'movements']);
    Route::get('/stock/alerts', [StockController::class, 'alerts']);
    Route::post('/stock/bulk', [StockController::class, 'bulkUpdate']);

    // Reports
    Route::get('/reports/sales', [ReportController::class, 'sales']);
    Route::get('/reports/forecast', [ReportController::class, 'forecast']);
    Route::get('/reports/forecast-data', [ReportController::class, 'getForecastData']);
    Route::get('/reports/stock', [ReportController::class, 'stockReport']);

    // Settings
    Route::apiResource('settings', SettingController::class)->except(['create','edit']);
    Route::get('/settings/{key}', [SettingController::class, 'show']);
});