import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

const FOOTER_LINKS = {
  Shop: [
    { to: '/products', label: 'All Products' },
    { to: '/categories/new-arrivals', label: 'New Arrivals' },
    { to: '/categories/sale', label: 'Sale' },
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
    <footer className="border-t border-tertiary bg-primary text-quaternary">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-quaternary transition-opacity hover:opacity-90"
              aria-label="AttireHub Home"
            >
              <ShoppingBag className="h-8 w-8" aria-hidden />
              <span className="text-xl font-semibold tracking-tight">AttireHub</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-tertiary">
              Curated clothing and accessories for every style. Quality you can feel.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-quaternary">
                {heading}
              </h3>
              <ul className="mt-4 space-y-3" role="list">
                {links.map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-sm text-tertiary transition-colors hover:text-quaternary"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-secondary pt-8 sm:flex-row">
          <p className="text-sm text-tertiary">
            &copy; {new Date().getFullYear()} AttireHub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
