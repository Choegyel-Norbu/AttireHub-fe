import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Hero from '@/components/home/Hero';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/product/ProductCard';
import { useAuth } from '@/context/AuthContext';
import { getProducts } from '@/services/productService';
import { getCategories, flattenCategoriesWithSlug } from '@/services/categoryService';

const FEATURED_SIZE = 8;
const TRENDING_SIZE = 8;
const NEW_ARRIVAL_SIZE = 8;

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
        setCategories(flat.filter((c) => c.slug && c.depth === 0).slice(0, 4)); // Limit to 4 top-level
      })
      .catch(() => setCategories([]));
  }, []);

  // Reusable Section Component
  const ProductSection = ({ title, subtitle, products, loading, linkTo }) => (
    <section className="py-4 sm:py-10">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-xl font-medium text-primary sm:text-2xl lg:text-3xl">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-secondary/70 sm:mt-2 sm:text-base">{subtitle}</p>}
          </div>
          {linkTo && (
            <Link
              to={linkTo}
              className="group inline-flex min-h-10 items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:text-secondary sm:text-sm"
            >
              View All
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 sm:h-4 sm:w-4" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center sm:h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
          </div>
        ) : products.length === 0 ? (
          <p className="py-8 text-center text-sm text-secondary sm:py-12">No products found.</p>
        ) : (
          <div className="-mx-3 flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory px-3 sm:mx-0 sm:gap-6 sm:pb-8 sm:px-0">
            {products.map((product) => (
              <div
                key={product.id}
                className="h-[420px] min-w-[160px] w-[160px] shrink-0 snap-start sm:h-[468px] sm:min-w-[220px] sm:w-[220px] lg:min-w-[240px] lg:w-[240px]"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <Hero />

      {/* Shop by Category */}
      <section className="bg-[#F9F9F9] py-12 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="mb-10 text-center sm:mb-16">
            <h2 className="font-serif text-xl font-medium text-primary sm:text-2xl lg:text-3xl">Shop by Category</h2>
            <p className="mt-2 text-sm text-secondary/70 sm:mt-3 sm:text-base">Explore our comprehensive range of apparel.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                to={`/products?category=${encodeURIComponent(category.slug)}`}
                className="group relative block aspect-[3/4] overflow-hidden rounded-xl bg-gray-200"
              >
                <img
                  src={`https://images.unsplash.com/photo-${
                    index === 0
                      ? '1490481651871-ab68de25d43d' // Men
                      : index === 1
                      ? '1515886657613-9f3515b0c78f' // Women
                      : index === 2
                      ? '1532453288672-3a27e9be9efd' // Accessories
                      : '1483985988355-763728e1935b' // Other
                  }?q=80&w=600&auto=format&fit=crop`}
                  alt={category.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-80" />
                <div className="absolute bottom-0 left-0 p-3 sm:p-6">
                  <h3 className="font-serif text-base font-medium text-white sm:text-xl lg:text-2xl">{category.name}</h3>
                  <div className="mt-2 flex items-center gap-2 text-xs font-medium text-white opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    <span>Shop Now</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Collection */}
      <ProductSection 
        title="Featured Collection" 
        subtitle="Curated picks for the season."
        products={featuredProducts} 
        loading={featuredLoading}
        linkTo="/products"
      />

      {/* New Arrivals */}
      <ProductSection 
        title="New Arrivals" 
        subtitle="Fresh styles just landed."
        products={newArrivalProducts} 
        loading={newArrivalLoading}
        linkTo="/products?newArrivalsOnly=true"
      />

      {/* Trending */}
      <ProductSection 
        title="Trending Now" 
        subtitle="What everyone is talking about."
        products={trendingProducts} 
        loading={trendingLoading}
        linkTo="/products?trending=true"
      />

      {/* Editorial / CTA Strip */}
      <section className="relative overflow-hidden bg-primary py-12 sm:py-16 lg:py-24">
        <div className="absolute inset-0 opacity-20">
           <img 
             src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop" 
             alt="" 
             className="h-full w-full object-cover grayscale"
           />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-serif text-xl font-medium text-white sm:text-2xl lg:text-3xl">
            Elevate Your Everyday
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-xs text-white/80 sm:mt-3 sm:text-sm">
            Join our community for exclusive access to new drops, sales, and style inspiration.
          </p>
          
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row">
            {isAuthenticated ? (
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:bg-gray-100"
              >
                Shop Full Collection
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:bg-gray-100"
                >
                  Create Account
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
