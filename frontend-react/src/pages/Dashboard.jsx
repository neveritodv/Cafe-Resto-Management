import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiShoppingBag, FiPackage, FiDollarSign } from 'react-icons/fi';
import { Line, Bar } from 'react-chartjs-2';
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
import StatCard from '../components/common/StatCard';
import { dashboard } from '../api/endpoints';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, chartRes] = await Promise.all([
        dashboard.getStats(),
        dashboard.getSalesChart('week'),
      ]);
      setStats(statsRes.data);
      setChartData(chartRes.data);
    } catch (error) {
      toast.error('Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const lineChartOptions = {
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
        ticks: { callback: (value) => formatCurrency(value) },
      },
    },
    elements: {
      line: { tension: 0.4 },
    },
  };

  const lineChartData = {
    labels: chartData?.map((d) => new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' })) || [],
    datasets: [
      {
        label: 'Chiffre d\'affaires',
        data: chartData?.map((d) => d.revenue) || [],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        pointBackgroundColor: '#6366f1',
        pointRadius: 4,
      },
    ],
  };

  const hourlyData = stats?.hourly_sales || [];
  const barChartData = {
    labels: hourlyData.map((d) => `${d.hour}h`),
    datasets: [
      {
        label: 'Ventes',
        data: hourlyData.map((d) => d.revenue),
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderRadius: 6,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (value) => formatCurrency(value) },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-500">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-y-auto">
        <Header title="Tableau de bord" onRefresh={fetchData} />
        <main className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="CA Aujourd'hui"
              value={formatCurrency(stats?.today?.revenue || 0)}
              icon={FiDollarSign}
              color="green"
              subtitle={`${stats?.today?.orders || 0} commandes · Moyenne ${formatCurrency(stats?.today?.average || 0)}`}
            />
            <StatCard
              title="CA Cette Semaine"
              value={formatCurrency(stats?.week?.revenue || 0)}
              icon={FiTrendingUp}
              color="indigo"
              subtitle={`${stats?.week?.orders || 0} commandes`}
            />
            <StatCard
              title="CA Ce Mois"
              value={formatCurrency(stats?.month?.revenue || 0)}
              icon={FiShoppingBag}
              color="purple"
              subtitle={`${stats?.month?.orders || 0} commandes`}
            />
            <StatCard
              title="Stock Critique"
              value={stats?.low_stock || 0}
              icon={FiPackage}
              color={stats?.low_stock > 0 ? 'red' : 'green'}
              subtitle={stats?.low_stock > 0 ? 'Produits à réapprovisionner' : 'Tout est en stock'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Évolution du CA</h3>
              <div className="h-64">
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Ventes par Heure</h3>
              <div className="h-64">
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🏆 Top Produits</h3>
              <div className="space-y-3">
                {stats?.top_products?.length > 0 ? (
                  stats.top_products.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-400 w-6">#{index + 1}</span>
                        <span className="font-medium text-gray-700">{product.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">{product.total_quantity} vendus</span>
                        <span className="font-semibold text-indigo-600">{formatCurrency(product.total_revenue)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8">Aucune donnée disponible</p>
                )}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🕐 Dernières Commandes</h3>
              <div className="space-y-3">
                {stats?.recent_orders?.length > 0 ? (
                  stats.recent_orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-700">{order.order_number}</span>
                        <span
                          className={`ml-3 text-xs px-2 py-1 rounded-full ${
                            order.status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {order.status_label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-500">{order.user?.name}</span>
                        <span className="font-semibold text-gray-700">{formatCurrency(order.total)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8">Aucune commande récente</p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;