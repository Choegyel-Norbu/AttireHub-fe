import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

const FOOTER_LINKS = {
  Shop: [
    { to: '/products', label: 'All Products' },
    { to: '/categories/new-arrivals', label: 'New Arrivals' },
    { to: '/sale', label: 'Sale' },
    { to: '/cart', label: 'Cart' },
  ],
  Help: [
    { to: '/help/shipping', label: 'Shipping' },
    { to: '/help/returns', label: 'Returns' },
    { to: '/help/faq', label: 'FAQ' },
  ],
  Company: [
    { to: '/about', label: 'About Us' },
    { to: '/contact', label: 'Contact' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-border bg-primary text-quaternary">
      <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-quaternary transition-opacity hover:opacity-90"
              aria-label="AttireHub Home"
            >
              <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8" aria-hidden />
              <span className="text-lg font-semibold tracking-tight sm:text-xl">AttireHub</span>
            </Link>
            <p className="mt-3 max-w-sm text-xs text-tertiary sm:mt-4 sm:text-sm">
              Curated clothing and accessories for every style. Quality you can feel.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-quaternary sm:text-sm">
                {heading}
              </h3>
              <ul className="mt-2 space-y-2 sm:mt-4 sm:space-y-3" role="list">
                {links.map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-xs text-tertiary transition-colors hover:text-quaternary sm:text-sm"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-secondary pt-6 sm:mt-12 sm:flex-row sm:gap-4 sm:pt-8">
          <p className="text-xs text-tertiary sm:text-sm">
            &copy; {new Date().getFullYear()} AttireHub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
