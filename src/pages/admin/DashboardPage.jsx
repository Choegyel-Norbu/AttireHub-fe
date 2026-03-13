import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  ArrowRight,
  Plus,
  AlertCircle
} from 'lucide-react';

// Mock stats for the dashboard
const STATS = [
  { label: 'Total Revenue', value: 'Nu 124,500', change: '+12%', icon: TrendingUp },
  { label: 'Active Orders', value: '24', change: '+4', icon: ShoppingCart },
  { label: 'Products', value: '142', change: '12 low stock', icon: Package },
  { label: 'Customers', value: '1,204', change: '+18%', icon: Users },
];

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

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-primary">Dashboard</h1>
          <p className="mt-1 text-secondary">Overview of your store's performance.</p>
        </div>
        <div className="flex gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all ${action.color}`}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-xl border border-border bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-secondary">{stat.label}</p>
                <h3 className="mt-2 text-2xl font-bold text-primary">{stat.value}</h3>
              </div>
              <div className="rounded-full bg-gray-50 p-2 text-primary">
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-green-600">
              {stat.change}
              <span className="ml-1 text-secondary/60">vs last month</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity / Sections */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Orders Preview (Mock) */}
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl text-primary">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm font-medium text-primary hover:text-secondary">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-secondary">
                    #{1000 + i}
                  </div>
                  <div>
                    <p className="font-medium text-primary">Order #{1000 + i}</p>
                    <p className="text-xs text-secondary">2 items • Nu 4,500</p>
                  </div>
                </div>
                <span className="rounded-full bg-yellow-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-800">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alert (Mock) */}
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl text-primary">Low Stock Alerts</h2>
            <Link to="/admin/products" className="text-sm font-medium text-primary hover:text-secondary">
              Manage Inventory
            </Link>
          </div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 rounded-lg border border-red-100 bg-red-50/50 p-4">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium text-primary">Silk Scarf - Blue</p>
                  <p className="text-xs text-red-600">Only 2 left in stock</p>
                </div>
                <Link to={`/admin/products/edit/silk-scarf`} className="ml-auto text-xs font-bold uppercase text-primary hover:underline">
                  Restock
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
