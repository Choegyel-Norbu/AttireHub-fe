import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Plus,
  AlertCircle,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowRight
} from 'lucide-react';
import { getProducts } from '@/services/productService';
import { getAdminOrders } from '@/services/adminOrderService';

const QUICK_ACTIONS = [
  {
    to: '/admin/products/new',
    label: 'Add Product',
    icon: Plus,
    color: 'bg-primary text-white',
  },
  {
    to: '/admin/orders',
    label: 'View Orders',
    icon: ShoppingCart,
    color: 'bg-white border border-border text-primary hover:bg-gray-50',
  },
];

function formatPrice(value) {
  if (typeof value !== 'number') return '—';
  return Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatusBadge({ status }) {
  const statusLower = (status || '').toLowerCase();
  let styles = 'bg-gray-50 text-gray-700 border-gray-100';
  
  if (statusLower === 'cancelled' || statusLower === 'returned') {
    styles = 'bg-red-50 text-red-700 border-red-100';
  } else if (statusLower === 'delivered') {
    styles = 'bg-green-50 text-green-700 border-green-100';
  } else if (statusLower === 'shipped') {
    styles = 'bg-blue-50 text-blue-700 border-blue-100';
  } else if (statusLower === 'confirmed' || statusLower === 'processing') {
    styles = 'bg-amber-50 text-amber-700 border-amber-100';
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles}`}>
      {status || 'Unknown'}
    </span>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    analyzedOrdersCount: 0,
  });
  
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [productsResult, ordersResult] = await Promise.all([
          getProducts({ page: 0, size: 100 }),
          getAdminOrders({ page: 0, size: 50 })
        ]);

        if (cancelled) return;

        // Process Products
        const products = Array.isArray(productsResult.content) ? productsResult.content : [];
        let lowStock = 0;
        let outOfStock = 0;
        const lowStockList = [];

        for (const p of products) {
          if (Array.isArray(p.variants)) {
            for (const v of p.variants) {
              const qty = Number(v.stockQuantity ?? 0);
              if (qty === 0) outOfStock++;
              else if (qty <= 5) {
                lowStock++;
                if (lowStockList.length < 5) {
                  lowStockList.push({
                    id: v.id,
                    name: p.name,
                    sku: v.sku,
                    quantity: qty,
                    slug: p.slug
                  });
                }
              }
            }
          }
        }

        // Process Orders
        const orders = Array.isArray(ordersResult.content) ? ordersResult.content : [];
        const totalOrders = ordersResult.totalElements ?? orders.length;
        
        let revenue = 0;
        let pending = 0;
        let delivered = 0;
        let cancelledCount = 0;

        for (const o of orders) {
          revenue += Number(o.total ?? 0);
          const s = (o.status || '').toUpperCase();
          if (s === 'PENDING' || s === 'PROCESSING' || s === 'CONFIRMED') pending++;
          else if (s === 'DELIVERED') delivered++;
          else if (s === 'CANCELLED') cancelledCount++;
        }

        setStats({
          totalProducts: productsResult.totalElements ?? products.length,
          lowStockCount: lowStock,
          outOfStockCount: outOfStock,
          totalOrders,
          totalRevenue: revenue,
          pendingOrders: pending,
          deliveredOrders: delivered,
          cancelledOrders: cancelledCount,
          analyzedOrdersCount: orders.length,
        });

        setRecentOrders(orders.slice(0, 5));
        setLowStockItems(lowStockList);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

  const statCards = [
    {
      label: 'Total Revenue',
      value: `Nu ${formatPrice(stats.totalRevenue)}`,
      sub: 'Based on recent orders',
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-primary/5 border-primary/20'
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      sub: `${stats.pendingOrders} pending processing`,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-100'
    },
    {
      label: 'Total Products',
      value: stats.totalProducts.toLocaleString(),
      sub: `${stats.outOfStockCount} out of stock`,
      icon: Package,
      color: 'text-purple-600',
      bg: 'bg-purple-50 border-purple-100'
    },
    {
      label: 'Inventory Alert',
      value: stats.lowStockCount.toLocaleString(),
      sub: 'Items with low stock',
      icon: AlertCircle,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-100'
    },
  ];

  const getPercent = (count) => {
    if (!stats.analyzedOrdersCount) return 0;
    return (count / stats.analyzedOrdersCount) * 100;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-primary">Dashboard</h1>
          <p className="mt-1 text-sm text-secondary">
            Welcome back. Here's what's happening with your store today.
          </p>
        </div>
        <div className="flex gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all hover:shadow-md ${action.color}`}
            >
              <action.icon className="h-3.5 w-3.5" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`rounded-xl border p-6 ${stat.bg}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">{stat.label}</p>
                <h3 className={`text-2xl font-bold ${stat.color}`}>{stat.value}</h3>
              </div>
              <div className={`rounded-full p-2.5 bg-white shadow-sm ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-medium opacity-80">
              {stat.sub}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Orders - Takes up 2 columns */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-6">
            <h2 className="font-serif text-lg text-primary">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs font-bold uppercase tracking-wider text-primary hover:text-secondary flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-8 text-center text-sm text-secondary">Loading orders...</div>
            ) : recentOrders.length === 0 ? (
              <div className="p-8 text-center text-sm text-secondary">No orders found.</div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5 text-primary">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-primary">
                          #{order.orderNumber || order.id}
                        </span>
                        <span className="text-xs text-secondary">• {order.items?.length || 0} items</span>
                      </div>
                      <p className="text-xs text-secondary mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-sm font-medium text-primary">
                      Nu {formatPrice(order.total)}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Inventory / Insights - Takes up 1 column */}
        <div className="space-y-6">
          {/* Order Status Breakdown */}
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg text-primary mb-4">Order Status (Recent)</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-secondary">Pending & Processing</span>
                  <span className="font-bold text-primary">{stats.pendingOrders}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 rounded-full" 
                    style={{ width: `${getPercent(stats.pendingOrders)}%` }} 
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-secondary">Delivered</span>
                  <span className="font-bold text-primary">{stats.deliveredOrders}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full" 
                    style={{ width: `${getPercent(stats.deliveredOrders)}%` }} 
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-secondary">Cancelled</span>
                  <span className="font-bold text-primary">{stats.cancelledOrders}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div 
                    className="h-full bg-red-400 rounded-full" 
                    style={{ width: `${getPercent(stats.cancelledOrders)}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg text-primary">Low Stock</h2>
              <Link to="/admin/products" className="text-xs font-bold uppercase tracking-wider text-secondary hover:text-primary">
                View All
              </Link>
            </div>
            
            {loading ? (
               <div className="text-xs text-secondary">Loading...</div>
            ) : lowStockItems.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
                <CheckCircle2 className="h-4 w-4" />
                <span>Inventory looks healthy!</span>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div key={`${item.id}-${item.sku}`} className="flex items-start gap-3 p-3 rounded-lg bg-red-50/50 border border-red-100">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-primary truncate">{item.name}</p>
                      <p className="text-xs text-secondary truncate">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-bold text-red-600">{item.quantity}</span>
                      <span className="text-[10px] text-red-500 uppercase">Left</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
