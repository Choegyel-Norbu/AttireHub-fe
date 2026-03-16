import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, ArrowRight } from 'lucide-react';

const FOOTER_LINKS = {
  Shop: [
    { to: '/products', label: 'All Products' },
    { to: '/products?newArrivalsOnly=true', label: 'New Arrivals' },
    { to: '/products?trending=true', label: 'Trending' },
    { to: '/sale', label: 'Sale' },
  ],
  Support: [
    { to: '/help/shipping', label: 'Shipping & Delivery' },
    { to: '/help/returns', label: 'Returns & Exchanges' },
    { to: '/help/size-guide', label: 'Size Guide' },
    { to: '/help/faq', label: 'FAQ' },
  ],
  Company: [
    { to: '/about', label: 'Our Story' },
    { to: '/careers', label: 'Careers' },
    { to: '/sustainability', label: 'Sustainability' },
    { to: '/contact', label: 'Contact Us' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-primary text-white pt-16 pb-8 border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <Link to="/" className="font-serif text-2xl tracking-tight text-white sm:text-3xl">
                AttireHub
              </Link>
              <p className="mt-4 max-w-sm text-sm text-white/60 leading-relaxed">
                Elevating your everyday style with curated essentials. Quality craftsmanship, sustainable practices, and timeless design.
              </p>
            </div>
            
            <div className="max-w-md">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-white">Subscribe to our newsletter</h3>
              <p className="mt-2 text-xs text-white/50">Get the latest updates on new products and upcoming sales.</p>
              <form className="mt-4 flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full min-w-0 appearance-none rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
                />
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-primary transition-colors hover:bg-white/90"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7 lg:pl-12">
            {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
              <div key={heading}>
                <h3 className="text-sm font-semibold uppercase tracking-widest text-white">{heading}</h3>
                <ul className="mt-4 space-y-3">
                  {links.map(({ to, label }) => (
                    <li key={label}>
                      <Link
                        to={to}
                        className="text-sm text-white/60 transition-colors hover:text-white"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 border-t border-white/10 pt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
            <p className="text-xs text-white/40">
              &copy; {new Date().getFullYear()} AttireHub. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link to="/privacy" className="text-xs text-white/40 hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-xs text-white/40 hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex gap-4">
            <a href="#" className="text-white/60 hover:text-white transition-colors" aria-label="Instagram">
              <Instagram className="h-5 w-5" strokeWidth={1.5} />
            </a>
            <a href="#" className="text-white/60 hover:text-white transition-colors" aria-label="Facebook">
              <Facebook className="h-5 w-5" strokeWidth={1.5} />
            </a>
            <a href="#" className="text-white/60 hover:text-white transition-colors" aria-label="Twitter">
              <Twitter className="h-5 w-5" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
