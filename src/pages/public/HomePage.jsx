import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, ImageOff, Loader2 } from 'lucide-react';
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

/** Horizontal scroll carousel track; scrollbar hidden, use arrow buttons to scroll. */
const carouselTrackClass =
  'mt-6 flex gap-4 overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory pb-0 sm:mt-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
const SCROLL_AMOUNT = 280;
const productCardClass =
  'group flex flex-shrink-0 w-[48vw] min-w-[180px] max-w-[280px] sm:w-[220px] sm:min-w-[220px] sm:max-w-[280px] lg:w-[260px] lg:min-w-[260px] snap-start flex-col overflow-hidden rounded-lg bg-quaternary transition-all duration-200 ease-out hover:-translate-y-1 hover:bg-tertiary/10 hover:shadow-md';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const featuredCarouselRef = useRef(null);
  const trendingCarouselRef = useRef(null);
  const newArrivalCarouselRef = useRef(null);

  const scrollCarousel = (ref, direction) => {
    const el = ref?.current;
    if (!el) return;
    const amount = direction === 'left' ? -SCROLL_AMOUNT : SCROLL_AMOUNT;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

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

      {/* Hero – inspired by Anna Stone & Jud capsule look */}
      <section className="relative min-h-[28rem] overflow-hidden sm:min-h-[32rem] lg:min-h-[36rem]">
        <img
          src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
        <div className="relative z-10 flex min-h-[28rem] flex-col items-center justify-center px-4 py-20 text-center sm:min-h-[32rem] sm:py-28 lg:min-h-[36rem]">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl">
            <span className="font-extralight tracking-[0.35em] sm:tracking-[0.4em] text-white">
              ATTIREHUB
            </span>
            <span className="font-bold tracking-tight text-black">&nbsp;& STYLE.</span>
          </h1>
          <p
            className="mx-auto mt-4 max-w-2xl text-base sm:text-lg"
            style={{ color: '#666666' }}
          >
            Introducing the Capsule Collection
          </p>
          <div className="mt-10">
            <Link
              to="/products"
              className="inline-block rounded-md px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#80B5AE' }}
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="border-t border-border bg-quaternary py-16" aria-labelledby="featured-heading">
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
          <div className="relative">
            {!featuredLoading && featuredProducts.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => scrollCarousel(featuredCarouselRef, 'left')}
                  className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-quaternary shadow-md transition-colors hover:bg-tertiary/30 disabled:opacity-50 sm:h-12 sm:w-12"
                  aria-label="Scroll featured products left"
                >
                  <ArrowLeft className="h-5 w-5 text-primary sm:h-6 sm:w-6" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel(featuredCarouselRef, 'right')}
                  className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-quaternary shadow-md transition-colors hover:bg-tertiary/30 disabled:opacity-50 sm:h-12 sm:w-12"
                  aria-label="Scroll featured products right"
                >
                  <ArrowRight className="h-5 w-5 text-primary sm:h-6 sm:w-6" aria-hidden />
                </button>
              </>
            )}
            <div ref={featuredCarouselRef} className={carouselTrackClass}>
            {featuredLoading ? (
              <div className="flex w-full justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
                <span className="sr-only">Loading featured products…</span>
              </div>
            ) : featuredProducts.length === 0 ? (
              <p className="w-full py-8 text-center text-secondary">No featured products right now.</p>
            ) : (
              featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${encodeURIComponent(product.slug ?? product.id)}`}
                  className={productCardClass}
                >
                  <div className="relative p-2 pb-0 sm:p-3 sm:pb-0">
                    {(product.newArrival === true || product.new_arrival === true) && (
                      <span className="absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm sm:left-4 sm:top-4 sm:px-2.5 sm:py-1 sm:text-xs" style={{ backgroundColor: '#80B5AE' }}>
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
      <section className="border-t border-border bg-quaternary py-16" aria-labelledby="trending-heading">
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
          <div className="relative">
            {!trendingLoading && trendingProducts.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => scrollCarousel(trendingCarouselRef, 'left')}
                  className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-quaternary shadow-md transition-colors hover:bg-tertiary/30 disabled:opacity-50 sm:h-12 sm:w-12"
                  aria-label="Scroll trending products left"
                >
                  <ArrowLeft className="h-5 w-5 text-primary sm:h-6 sm:w-6" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel(trendingCarouselRef, 'right')}
                  className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-quaternary shadow-md transition-colors hover:bg-tertiary/30 disabled:opacity-50 sm:h-12 sm:w-12"
                  aria-label="Scroll trending products right"
                >
                  <ArrowRight className="h-5 w-5 text-primary sm:h-6 sm:w-6" aria-hidden />
                </button>
              </>
            )}
            <div ref={trendingCarouselRef} className={carouselTrackClass}>
            {trendingLoading ? (
              <div className="flex w-full justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
                <span className="sr-only">Loading trending products…</span>
              </div>
            ) : trendingProducts.length === 0 ? (
              <p className="w-full py-8 text-center text-secondary">No trending products right now.</p>
            ) : (
              trendingProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${encodeURIComponent(product.slug ?? product.id)}`}
                  className={productCardClass}
                >
                  <div className="relative p-2 pb-0 sm:p-3 sm:pb-0">
                    {(product.newArrival === true || product.new_arrival === true) && (
                      <span className="absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm sm:left-4 sm:top-4 sm:px-2.5 sm:py-1 sm:text-xs" style={{ backgroundColor: '#80B5AE' }}>
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
      <section className="border-t border-border bg-quaternary py-16" aria-labelledby="new-arrival-heading">
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
          <div className="relative">
            {!newArrivalLoading && newArrivalProducts.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => scrollCarousel(newArrivalCarouselRef, 'left')}
                  className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-quaternary shadow-md transition-colors hover:bg-tertiary/30 disabled:opacity-50 sm:h-12 sm:w-12"
                  aria-label="Scroll new arrivals left"
                >
                  <ArrowLeft className="h-5 w-5 text-primary sm:h-6 sm:w-6" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel(newArrivalCarouselRef, 'right')}
                  className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-quaternary shadow-md transition-colors hover:bg-tertiary/30 disabled:opacity-50 sm:h-12 sm:w-12"
                  aria-label="Scroll new arrivals right"
                >
                  <ArrowRight className="h-5 w-5 text-primary sm:h-6 sm:w-6" aria-hidden />
                </button>
              </>
            )}
            <div ref={newArrivalCarouselRef} className={carouselTrackClass}>
            {newArrivalLoading ? (
              <div className="flex w-full justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
                <span className="sr-only">Loading new arrivals…</span>
              </div>
            ) : newArrivalProducts.length === 0 ? (
              <p className="w-full py-8 text-center text-secondary">No new arrivals right now.</p>
            ) : (
              newArrivalProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${encodeURIComponent(product.slug ?? product.id)}`}
                  className={productCardClass}
                >
                  <div className="relative p-2 pb-0 sm:p-3 sm:pb-0">
                    <span className="absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm sm:left-4 sm:top-4 sm:px-2.5 sm:py-1 sm:text-xs" style={{ backgroundColor: '#80B5AE' }}>
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
          </div>
          <Link
            to="/products?newArrivalsOnly=true"
            className="mt-8 block text-center text-sm font-medium text-primary hover:text-secondary sm:hidden"
          >
            View all new arrivals
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section
        className="border-t border-border bg-gradient-to-b from-tertiary/5 to-quaternary py-20 sm:py-24"
        aria-labelledby="categories-heading"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 id="categories-heading" className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
              Shop by category
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-secondary">
              Find what you need across our curated collections
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {categories.map(({ id, name, slug }) => (
              <Link
                key={id}
                to={`/products?category=${encodeURIComponent(slug)}`}
                className="group relative flex flex-col rounded-xl border border-border/60 bg-quaternary p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-secondary/50 hover:shadow-md sm:p-8"
              >
                <span
                  className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-primary/20 transition-colors group-hover:bg-primary"
                  aria-hidden
                />
                <span className="text-xl font-semibold tracking-tight text-primary transition-colors group-hover:text-secondary">
                  {name}
                </span>
                <span className="mt-1 text-sm text-secondary">
                  Browse the full {name} collection
                </span>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors group-hover:text-secondary">
                  Shop {name}
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="border-t border-border bg-primary py-12" aria-labelledby="cta-heading">
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
