import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ImageOff, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { getProducts } from '@/services/productService';
import { getCategories, flattenCategoriesWithSlug } from '@/services/categoryService';

const FEATURED_SIZE = 8;
const TRENDING_SIZE = 20;
const NEW_ARRIVAL_SIZE = 12;

function formatPrice(value) {
  if (typeof value !== 'number') return String(value ?? '');
  return Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [newArrivalProducts, setNewArrivalProducts] = useState([]);
  const [newArrivalLoading, setNewArrivalLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getProducts({ newArrivalsOnly: true, size: NEW_ARRIVAL_SIZE })
      .then((res) => setNewArrivalProducts(res.content ?? []))
      .catch(() => setNewArrivalProducts([]))
      .finally(() => setNewArrivalLoading(false));
  }, []);

  useEffect(() => {
    getProducts({ trending: true, size: TRENDING_SIZE })
      .then((res) => setTrendingProducts(res.content ?? []))
      .catch(() => setTrendingProducts([]))
      .finally(() => setTrendingLoading(false));
  }, []);

  useEffect(() => {
    getProducts({ featured: true, size: FEATURED_SIZE })
      .then((res) => setFeaturedProducts(res.content ?? []))
      .catch(() => setFeaturedProducts([]))
      .finally(() => setFeaturedLoading(false));
  }, []);

  useEffect(() => {
    getCategories()
      .then((tree) => {
        const flat = flattenCategoriesWithSlug(Array.isArray(tree) ? tree : []);
        setCategories(flat.filter((c) => c.slug && c.depth === 0));
      })
      .catch(() => setCategories([]));
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero */}
      <section className="relative min-h-[28rem] overflow-hidden sm:min-h-[32rem] lg:min-h-[36rem]">
        <img
          src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
        <div
          className="absolute inset-0 bg-primary/50"
          aria-hidden
        />
        <div className="relative z-10 flex min-h-[28rem] flex-col items-center justify-center px-4 py-20 text-center sm:min-h-[32rem] sm:py-28 lg:min-h-[36rem]">
          <h1 className="text-4xl font-bold tracking-tight text-quaternary sm:text-5xl lg:text-6xl">
            Style that fits your life
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-quaternary/90">
            Discover curated clothing and accessories. Quality fabrics, timeless designs.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-quaternary shadow-sm transition-opacity hover:opacity-90"
            >
              Shop All
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              to="/categories/sale"
              className="inline-flex items-center rounded-md border-2 border-quaternary bg-transparent px-6 py-3 text-sm font-semibold text-quaternary transition-colors hover:bg-quaternary/10"
            >
              View Sale
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-t border-tertiary bg-quaternary py-16" aria-labelledby="categories-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="categories-heading" className="text-center text-2xl font-semibold text-primary sm:text-3xl">
            Shop by category
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map(({ id, name, slug }) => (
              <Link
                key={id}
                to={`/products?category=${encodeURIComponent(slug)}`}
                className="group relative overflow-hidden rounded-lg border border-tertiary bg-quaternary p-8 text-center transition-colors hover:border-secondary hover:bg-tertiary/10"
              >
                <span className="block text-lg font-semibold text-primary group-hover:text-secondary">
                  {name}
                </span>
                <span className="mt-1 block text-sm text-secondary">View all products in this category</span>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-primary group-hover:text-secondary">
                  Shop {name}
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="border-t border-tertiary bg-quaternary py-16" aria-labelledby="featured-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <h2 id="featured-heading" className="text-2xl font-semibold text-primary sm:text-3xl">
              Featured products
            </h2>
            <Link
              to="/products"
              className="hidden text-sm font-medium text-primary hover:text-secondary sm:block"
            >
              View all
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:mt-10 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {featuredLoading ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
                <span className="sr-only">Loading featured products…</span>
              </div>
            ) : featuredProducts.length === 0 ? (
              <p className="col-span-full text-center text-secondary">No featured products right now.</p>
            ) : (
              featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${encodeURIComponent(product.slug ?? product.id)}`}
                  className="group flex flex-col overflow-hidden rounded-lg bg-quaternary transition-all duration-200 ease-out hover:-translate-y-1 hover:bg-tertiary/10 hover:shadow-md"
                >
                  <div className="relative p-2 pb-0 sm:p-3 sm:pb-0">
                    {(product.newArrival === true || product.new_arrival === true) && (
                      <span className="absolute left-2 top-2 z-10 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-quaternary shadow-sm sm:left-4 sm:top-4 sm:px-2.5 sm:py-1 sm:text-xs">
                        New arrival
                      </span>
                    )}
                    <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-tertiary/20 sm:aspect-[4/5]">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt=""
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-tertiary">
                          <ImageOff className="h-6 w-6 sm:h-10 sm:w-10" aria-hidden />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-2 sm:p-3">
                    <h3 className="line-clamp-2 text-xs font-semibold text-primary group-hover:text-secondary sm:text-sm">
                      {product.name}
                    </h3>
                    {product.categoryName && (
                      <p className="mt-0.5 text-[10px] text-secondary sm:text-xs">{product.categoryName}</p>
                    )}
                    <p className="mt-1 text-sm font-semibold text-primary sm:mt-1.5 sm:text-base">
                      Nu {formatPrice(product.basePrice)} /-
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
          <Link
            to="/products"
            className="mt-8 block text-center text-sm font-medium text-primary hover:text-secondary sm:hidden"
          >
            View all products
          </Link>
        </div>
      </section>

      {/* Trending products */}
      <section className="border-t border-tertiary bg-quaternary py-16" aria-labelledby="trending-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <h2 id="trending-heading" className="text-2xl font-semibold text-primary sm:text-3xl">
              Trending now
            </h2>
            <Link
              to="/products?trending=true"
              className="hidden text-sm font-medium text-primary hover:text-secondary sm:block"
            >
              View all
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:mt-10 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {trendingLoading ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
                <span className="sr-only">Loading trending products…</span>
              </div>
            ) : trendingProducts.length === 0 ? (
              <p className="col-span-full text-center text-secondary">No trending products right now.</p>
            ) : (
              trendingProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${encodeURIComponent(product.slug ?? product.id)}`}
                  className="group flex flex-col overflow-hidden rounded-lg bg-quaternary transition-all duration-200 ease-out hover:-translate-y-1 hover:bg-tertiary/10 hover:shadow-md"
                >
                  <div className="relative p-2 pb-0 sm:p-3 sm:pb-0">
                    {(product.newArrival === true || product.new_arrival === true) && (
                      <span className="absolute left-2 top-2 z-10 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-quaternary shadow-sm sm:left-4 sm:top-4 sm:px-2.5 sm:py-1 sm:text-xs">
                        New arrival
                      </span>
                    )}
                    <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-tertiary/20 sm:aspect-[4/5]">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt=""
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-tertiary">
                          <ImageOff className="h-6 w-6 sm:h-10 sm:w-10" aria-hidden />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-2 sm:p-3">
                    <h3 className="line-clamp-2 text-xs font-semibold text-primary group-hover:text-secondary sm:text-sm">
                      {product.name}
                    </h3>
                    {product.categoryName && (
                      <p className="mt-0.5 text-[10px] text-secondary sm:text-xs">{product.categoryName}</p>
                    )}
                    <p className="mt-1 text-sm font-semibold text-primary sm:mt-1.5 sm:text-base">
                      Nu {formatPrice(product.basePrice)} /-
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
          <Link
            to="/products?trending=true"
            className="mt-8 block text-center text-sm font-medium text-primary hover:text-secondary sm:hidden"
          >
            View all trending
          </Link>
        </div>
      </section>

      {/* New arrival */}
      <section className="border-t border-tertiary bg-quaternary py-16" aria-labelledby="new-arrival-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <h2 id="new-arrival-heading" className="text-2xl font-semibold text-primary sm:text-3xl">
              New arrival
            </h2>
            <Link
              to="/products?newArrivalsOnly=true"
              className="hidden text-sm font-medium text-primary hover:text-secondary sm:block"
            >
              View all
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:mt-10 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {newArrivalLoading ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
                <span className="sr-only">Loading new arrivals…</span>
              </div>
            ) : newArrivalProducts.length === 0 ? (
              <p className="col-span-full text-center text-secondary">No new arrivals right now.</p>
            ) : (
              newArrivalProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${encodeURIComponent(product.slug ?? product.id)}`}
                  className="group flex flex-col overflow-hidden rounded-lg bg-quaternary transition-all duration-200 ease-out hover:-translate-y-1 hover:bg-tertiary/10 hover:shadow-md"
                >
                  <div className="relative p-2 pb-0 sm:p-3 sm:pb-0">
                    <span className="absolute left-2 top-2 z-10 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-quaternary shadow-sm sm:left-4 sm:top-4 sm:px-2.5 sm:py-1 sm:text-xs">
                      New arrival
                    </span>
                    <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-tertiary/20 sm:aspect-[4/5]">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt=""
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-tertiary">
                          <ImageOff className="h-6 w-6 sm:h-10 sm:w-10" aria-hidden />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-2 sm:p-3">
                    <h3 className="line-clamp-2 text-xs font-semibold text-primary group-hover:text-secondary sm:text-sm">
                      {product.name}
                    </h3>
                    {product.categoryName && (
                      <p className="mt-0.5 text-[10px] text-secondary sm:text-xs">{product.categoryName}</p>
                    )}
                    <p className="mt-1 text-sm font-semibold text-primary sm:mt-1.5 sm:text-base">
                      Nu {formatPrice(product.basePrice)} /-
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
          <Link
            to="/products?newArrivalsOnly=true"
            className="mt-8 block text-center text-sm font-medium text-primary hover:text-secondary sm:hidden"
          >
            View all new arrivals
          </Link>
        </div>
      </section>

      {/* CTA strip */}
      <section className="border-t border-tertiary bg-primary py-12" aria-labelledby="cta-heading">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 id="cta-heading" className="text-xl font-semibold text-quaternary sm:text-2xl">
            Free shipping on orders over $75
          </h2>
          <p className="mt-2 text-tertiary">
            {isAuthenticated
              ? 'Enjoy exclusive member benefits and early access to sales.'
              : 'Join us for exclusive drops and early access to sales.'}
          </p>
          {isAuthenticated ? (
            <Link
              to="/products"
              className="mt-6 inline-flex items-center gap-2 rounded-md border-2 border-quaternary bg-transparent px-6 py-2.5 text-sm font-semibold text-quaternary transition-colors hover:bg-quaternary hover:text-primary"
            >
              Shop now
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <Link
              to="/register"
              className="mt-6 inline-block rounded-md border-2 border-quaternary bg-transparent px-6 py-2.5 text-sm font-semibold text-quaternary transition-colors hover:bg-quaternary hover:text-primary"
            >
              Create account
            </Link>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
