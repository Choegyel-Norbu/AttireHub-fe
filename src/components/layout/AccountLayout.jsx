import { NavLink, Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { User, Settings, Shield, Package, ChevronRight } from 'lucide-react';

function isAdmin(user) {
  return user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';
}

export default function AccountLayout() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-quaternary">
        <div className="mx-auto max-w-7xl px-4 pt-4 pb-8 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
            {/* Left sidebar navigation */}
            <aside
              className="sticky top-16 z-50 ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)] w-screen shrink-0 self-start rounded-b-3xl bg-white py-3 shadow-sm lg:ml-0 lg:mr-0 lg:w-56 lg:rounded-none lg:bg-transparent lg:py-0 lg:shadow-none"
              aria-label="Account navigation"
            >
              <nav className="flex w-full flex-row flex-wrap justify-center gap-2 px-4 lg:flex-col lg:justify-start lg:rounded-3xl lg:bg-quaternary lg:px-2 lg:py-2">
                <ul className="flex flex-row flex-wrap justify-center gap-2 lg:flex-col lg:flex-nowrap lg:justify-start lg:gap-0 lg:space-y-0.5">
                  <li>
                    <NavLink
                      to="/profile"
                      end
                      className={({ isActive }) =>
                        `flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors lg:flex-initial lg:justify-start lg:px-3 ${
                          isActive ? 'bg-primary text-quaternary' : 'text-primary hover:bg-tertiary/20'
                        }`
                      }
                    >
                      <User className="h-4 w-4 shrink-0" aria-hidden />
                      <span>Profile</span>
                      <ChevronRight className="hidden h-4 w-4 shrink-0 opacity-70 lg:block" aria-hidden />
                    </NavLink>
                  </li>
                  {!isAdmin(user) && user && (
                    <li>
                      <NavLink
                        to="/account/orders"
                        end={false}
                        className={({ isActive }) =>
                          `flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors lg:flex-initial lg:justify-start lg:px-3 ${
                            isActive ? 'bg-primary text-quaternary' : 'text-primary hover:bg-tertiary/20'
                          }`
                        }
                      >
                        <Package className="h-4 w-4 shrink-0" aria-hidden />
                        <span>Orders</span>
                        <ChevronRight className="hidden h-4 w-4 shrink-0 opacity-70 lg:block" aria-hidden />
                      </NavLink>
                    </li>
                  )}
                  <li>
                    <NavLink
                      to="/account/settings"
                      className={({ isActive }) =>
                        `flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors lg:flex-initial lg:justify-start lg:px-3 ${
                          isActive ? 'bg-primary text-quaternary' : 'text-primary hover:bg-tertiary/20'
                        }`
                      }
                    >
                      <Settings className="h-4 w-4 shrink-0" aria-hidden />
                      <span>Settings</span>
                      <ChevronRight className="hidden h-4 w-4 shrink-0 opacity-70 lg:block" aria-hidden />
                    </NavLink>
                  </li>
                  {isAdmin(user) && (
                    <li>
                      <div className="my-2 hidden border-t border-tertiary lg:block" />
                      <NavLink
                        to="/admin/products"
                        className={({ isActive }) =>
                          `flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors lg:flex-initial lg:justify-start lg:px-3 ${
                            isActive ? 'bg-primary text-quaternary' : 'text-primary hover:bg-tertiary/20'
                          }`
                        }
                      >
                        <Shield className="h-4 w-4 shrink-0" aria-hidden />
                        <span>Admin</span>
                        <ChevronRight className="hidden h-4 w-4 shrink-0 opacity-70 lg:block" aria-hidden />
                      </NavLink>
                    </li>
                  )}
                </ul>
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
