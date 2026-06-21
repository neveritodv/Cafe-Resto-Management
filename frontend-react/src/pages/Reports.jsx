import React, { useState, useEffect } from 'react';
import {
  FiCalendar,
  FiTrendingUp,
  FiPackage,
  FiBarChart2,
  FiDollarSign,
  FiShoppingBag,
  FiAward,
} from 'react-icons/fi';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import { reports } from '../api/endpoints';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Reports = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [salesData, setSalesData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [stockReport, setStockReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, forecastRes, stockRes] = await Promise.all([
        reports.getSales({ from: dateRange.from, to: dateRange.to }),
        reports.getForecast({ date: new Date().toISOString().split('T')[0] }),
        reports.getStockReport(),
      ]);
      setSalesData(salesRes.data);
      setForecastData(forecastRes.data);
      setStockReport(stockRes.data);
    } catch (error) {
      toast.error('Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  // --- Chart configurations ---
  const chartColors = {
    primary: '#6366f1',
    primaryLight: 'rgba(99, 102, 241, 0.1)',
    primaryBar: 'rgba(99, 102, 241, 0.7)',
    category: [
      'rgba(99, 102, 241, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(139, 92, 246, 0.8)',
    ],
  };

  const hourlyChartData = {
    labels: salesData?.hourly_sales?.map((d) => `${d.hour}h`) || [],
    datasets: [
      {
        label: 'CA',
        data: salesData?.hourly_sales?.map((d) => d.revenue) || [],
        backgroundColor: chartColors.primaryBar,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const categoryChartData = {
    labels: salesData?.category_sales?.map((d) => d.name) || [],
    datasets: [
      {
        label: 'CA par catégorie',
        data: salesData?.category_sales?.map((d) => d.total_revenue) || [],
        backgroundColor: chartColors.category,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const forecastChartData = {
    labels: forecastData?.forecast?.map((d) => `${d.hour}h`) || [],
    datasets: [
      {
        label: 'Prévision (quantité)',
        data: forecastData?.forecast?.map((d) => d.predicted_quantity) || [],
        borderColor: chartColors.primary,
        backgroundColor: chartColors.primaryLight,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: chartColors.primary,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => formatCurrency(ctx.parsed.y),
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value),
          font: { size: 12 },
        },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.parsed.y} unités`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { font: { size: 12 } },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  if (loading)
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-500 text-sm">Chargement des rapports...</p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-y-auto">
        <Header title="Rapports & Analyses" onRefresh={fetchData} />
        <main className="p-8">
          {/* Date range picker */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <FiCalendar className="text-indigo-500" />
              <span className="text-sm font-medium text-gray-700">Période :</span>
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <span className="text-gray-400">→</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <button
                onClick={fetchData}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg"
              >
                Appliquer
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 border-b border-gray-200">
            {[
              { id: 'sales', label: 'Ventes', icon: FiBarChart2 },
              { id: 'forecast', label: 'Prévisions', icon: FiTrendingUp },
              { id: 'stock', label: 'Stock', icon: FiPackage },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="text-lg" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ----- SALES TAB ----- */}
          {activeTab === 'sales' && salesData && (
            <div className="space-y-8">
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">CA Total</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {formatCurrency(salesData.summary.total_revenue)}
                      </p>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                      <FiDollarSign className="text-xl" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Commandes</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {salesData.summary.total_orders}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                      <FiShoppingBag className="text-xl" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Panier moyen</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {formatCurrency(salesData.summary.average_order)}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-full text-green-600">
                      <FiTrendingUp className="text-xl" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Top produit</p>
                      <p className="text-lg font-bold text-gray-800 truncate max-w-[140px]">
                        {salesData.top_products?.[0]?.name || '-'}
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-full text-yellow-600">
                      <FiAward className="text-xl" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-gray-800 mb-4">Ventes par heure</h4>
                  <div className="h-64">
                    <Bar data={hourlyChartData} options={barOptions} />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-gray-800 mb-4">CA par catégorie</h4>
                  <div className="h-64">
                    <Bar data={categoryChartData} options={barOptions} />
                  </div>
                </div>
              </div>

              {/* Top products table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5 border-b border-gray-100">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <FiAward className="text-yellow-500" /> Top 10 produits
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                        <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {salesData.top_products?.map((p, i) => (
                        <tr key={p.id || i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 text-sm font-medium text-gray-500">#{i + 1}</td>
                          <td className="px-5 py-3 text-sm font-medium text-gray-800">{p.name}</td>
                          <td className="px-5 py-3 text-center text-sm text-gray-600">{p.total_quantity}</td>
                          <td className="px-5 py-3 text-right text-sm font-semibold text-indigo-600">
                            {formatCurrency(p.total_revenue)}
                          </td>
                        </tr>
                      ))}
                      {(!salesData.top_products || salesData.top_products.length === 0) && (
                        <tr>
                          <td colSpan="4" className="px-5 py-8 text-center text-gray-400">
                            Aucune donnée disponible
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ----- FORECAST TAB ----- */}
          {activeTab === 'forecast' && forecastData && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                  <h4 className="font-medium text-gray-800">Prévisions des ventes</h4>
                  <span className="text-sm text-gray-500 bg-indigo-50 px-3 py-1 rounded-full">
                    Total prévu : {formatCurrency(forecastData.total_predicted_revenue)}
                  </span>
                </div>
                <div className="h-64">
                  <Line data={forecastChartData} options={lineOptions} />
                </div>
              </div>

              {forecastData.suggestions && forecastData.suggestions.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5 border-b border-gray-100">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FiPackage className="text-indigo-500" /> Suggestions d'approvisionnement
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                          <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stock actuel</th>
                          <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Prévision</th>
                          <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">À commander</th>
                          <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Priorité</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {forecastData.suggestions.map((s) => (
                          <tr key={s.product_id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-3 text-sm font-medium text-gray-800">{s.product_name}</td>
                            <td className="px-5 py-3 text-center text-sm text-gray-600">{s.current_stock}</td>
                            <td className="px-5 py-3 text-center text-sm text-gray-600">{s.predicted_need}</td>
                            <td className="px-5 py-3 text-right text-sm font-semibold text-indigo-600">{s.suggested_order}</td>
                            <td className="px-5 py-3 text-center">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  s.priority === 'high'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {s.priority === 'high' ? '🚨 Urgent' : '⚡ Moyen'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ----- STOCK TAB ----- */}
          {activeTab === 'stock' && stockReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total produits</p>
                      <p className="text-2xl font-bold text-gray-800">{stockReport.summary.total_products}</p>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                      <FiPackage className="text-xl" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Valeur du stock</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {formatCurrency(stockReport.summary.total_stock_value)}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-full text-green-600">
                      <FiDollarSign className="text-xl" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Stock bas</p>
                      <p
                        className={`text-2xl font-bold ${
                          stockReport.summary.low_stock_count > 0 ? 'text-red-500' : 'text-green-500'
                        }`}
                      >
                        {stockReport.summary.low_stock_count}
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-full text-red-600">
                      <FiTrendingUp className="text-xl" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5 border-b border-gray-100">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <FiPackage className="text-indigo-500" /> Détail du stock
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                        <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                        <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Prix unitaire</th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valeur</th>
                        <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stockReport.products?.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 text-sm font-medium text-gray-800">{p.name}</td>
                          <td className="px-5 py-3 text-center text-sm text-gray-600">{p.stock_quantity}</td>
                          <td className="px-5 py-3 text-center text-sm text-gray-600">{formatCurrency(p.price)}</td>
                          <td className="px-5 py-3 text-right text-sm font-semibold text-gray-800">
                            {formatCurrency(p.stock_value)}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                p.stock_quantity <= p.min_stock_alert
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {p.stock_quantity <= p.min_stock_alert ? '⚠️ Alerte' : '✅ OK'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(!stockReport.products || stockReport.products.length === 0) && (
                        <tr>
                          <td colSpan="5" className="px-5 py-8 text-center text-gray-400">
                            Aucun produit en stock
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Reports;