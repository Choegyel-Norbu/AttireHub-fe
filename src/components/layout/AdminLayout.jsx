import { NavLink, Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Package, ShoppingCart, ChevronRight } from 'lucide-react';

const SIDEBAR_ITEMS = [
  { to: '/admin/products', end: false, label: 'Products', icon: Package },
  { to: '/admin/orders', end: true, label: 'Orders', icon: ShoppingCart },
];

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left sidebar */}
        <aside
          className="w-full shrink-0 border-b border-border bg-quaternary lg:w-56 lg:border-b-0 lg:border-r"
          aria-label="Admin navigation"
        >
          <nav className="sticky top-0 p-4 lg:p-4">
            <h2 className="mb-4 px-3 text-lg font-bold text-primary">
              Admin Dashboard
            </h2>
            <ul className="flex flex-wrap gap-2 lg:flex-col lg:flex-nowrap lg:space-y-1 lg:gap-0">
              {SIDEBAR_ITEMS.map(({ to, end, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-quaternary'
                          : 'text-primary hover:bg-tertiary/20'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="flex-1">{label}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Right content */}
        <main className="min-w-0 flex-1 bg-quaternary px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
