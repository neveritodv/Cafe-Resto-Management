# ☕ Café‑Restaurant Management System

A complete management system for cafés and restaurants with automatic cashier, intelligent stock, QR scanning, PDF invoices, and sales forecasting.

## Features

- Menu & Category Management
- Order Taking (Dine-in, Takeaway, Delivery)
- QR Product Scanning
- Automatic Cashier with Discounts
- PDF Invoice Generation
- Stock Management with Alerts
- Dashboard with Sales Charts & Statistics
- Sales Forecasting & Supply Suggestions
- Customer Ordering Page
- Admin Dashboard

## Tech Stack

- **Backend**: Laravel 11, Sanctum, MySQL
- **Frontend**: React 18, Vite, Tailwind CSS
- **Packages**: Chart.js, jsPDF, jsQR, ZXing

## Installation

### Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve