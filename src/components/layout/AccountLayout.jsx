import { NavLink, Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { User, Settings, Shield, ChevronRight } from 'lucide-react';

const navItems = [
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/account/settings', label: 'Settings', icon: Settings },
];

function isAdmin(user) {
  return user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';
}

export default function AccountLayout() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-quaternary">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
            {/* Left sidebar navigation */}
            <aside
              className="shrink-0 lg:w-56"
              aria-label="Account navigation"
            >
              <nav className="rounded-2xl border border-tertiary bg-quaternary p-2 shadow-sm">
                <ul className="space-y-0.5">
                  {navItems.map(({ to, label, icon: Icon }) => (
                    <li key={to}>
                      <NavLink
                        to={to}
                        end={to === '/profile'}
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
                {isAdmin(user) && (
                  <>
                    <div className="my-2 border-t border-tertiary" />
                    <NavLink
                      to="/admin/products"
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive ? 'bg-primary text-quaternary' : 'text-primary hover:bg-tertiary/20'
                        }`
                      }
                    >
                      <Shield className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="flex-1">Admin</span>
                      <ChevronRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                    </NavLink>
                  </>
                )}
              </nav>
            </aside>

            {/* Page content */}
            <div className="min-w-0 flex-1">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
