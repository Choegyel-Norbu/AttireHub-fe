import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingCart,
  ArrowRight,
} from 'lucide-react';

const ADMIN_LINKS = [
  {
    to: '/admin/products',
    label: 'Manage Products',
    description: 'View, edit, and manage product catalog',
    icon: Package,
  },
  {
    to: '/admin/products/new',
    label: 'Add Product',
    description: 'Create a new product with variants',
    icon: PlusCircle,
    primary: true,
  },
  {
    to: '/admin/orders',
    label: 'Manage Orders',
    description: 'View and process customer orders',
    icon: ShoppingCart,
  },
];

export default function DashboardPage() {
  return (
    <>
      <div className="flex items-center gap-2 text-secondary">
        <LayoutDashboard className="h-5 w-5" aria-hidden />
        <h1 className="text-2xl font-semibold text-primary">Admin dashboard</h1>
      </div>
      <p className="mt-2 text-sm text-secondary">
        Manage your store products and orders. Use the sidebar to navigate.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ADMIN_LINKS.map(({ to, label, description, icon: Icon, primary }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col rounded-xl border p-6 transition-colors hover:border-secondary ${
              primary
                ? 'border-secondary bg-secondary/10 hover:bg-secondary/15'
                : 'border-border bg-quaternary hover:bg-tertiary/10'
            }`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                primary ? 'bg-primary text-quaternary' : 'bg-tertiary/30 text-primary'
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="mt-4 font-semibold text-primary">{label}</h2>
            <p className="mt-1 flex-1 text-sm text-secondary">{description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Open
              <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
