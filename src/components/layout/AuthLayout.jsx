import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

/**
 * Minimal layout for auth pages: logo header and centered content.
 * Keeps the experience focused while staying on-brand.
 * @param {string} [backgroundImage] - Optional path to a background image. Rendered sharp with a quaternary overlay for opacity.
 */
export default function AuthLayout({ children, title, backgroundImage }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="absolute inset-0 bg-quaternary" aria-hidden />
      {backgroundImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImage})` }}
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-quaternary"
            style={{ opacity: 0.82 }}
            aria-hidden
          />
        </>
      )}
      <header className="relative z-10 border-b border-tertiary bg-quaternary">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-primary transition-opacity hover:opacity-80"
            aria-label="AttireHub Home"
          >
            <ShoppingBag className="h-8 w-8" aria-hidden />
            <span className="text-xl font-semibold tracking-tight">AttireHub</span>
          </Link>
          <Link
            to="/"
            className="text-sm font-medium text-primary transition-colors hover:text-secondary"
          >
            Back to store
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        {title && (
          <h1 className="sr-only">{title}</h1>
        )}
        {children}
      </main>
    </div>
  );
}
