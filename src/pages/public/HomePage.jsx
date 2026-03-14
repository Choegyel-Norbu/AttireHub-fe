import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
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
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-10">
          <div>
            <h2 className="font-serif text-3xl text-primary sm:text-4xl">{title}</h2>
            {subtitle && <p className="mt-2 text-secondary/70">{subtitle}</p>}
          </div>
          {linkTo && (
            <Link
              to={linkTo}
              className="group inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary hover:text-secondary"
            >
              View All
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-secondary py-12">No products found.</p>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory px-4 sm:px-0">
            {products.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
                className="min-w-[240px] w-[240px] snap-start"
              >
                <ProductCard product={product} />
              </motion.div>
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

      {/* Featured Collection */}
      <ProductSection 
        title="Featured Collection" 
        subtitle="Curated picks for the season."
        products={featuredProducts} 
        loading={featuredLoading}
        linkTo="/products"
      />

      {/* Category Spotlight (Editorial Style) */}
      <section className="bg-[#F9F9F9] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl text-primary sm:text-4xl">Shop by Category</h2>
            <p className="mt-3 text-secondary/70">Explore our comprehensive range of apparel.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
                <div className="absolute bottom-0 left-0 p-4 sm:p-6">
                  <h3 className="font-serif text-xl text-white sm:text-2xl">{category.name}</h3>
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
      <section className="relative overflow-hidden bg-primary py-24 sm:py-32">
        <div className="absolute inset-0 opacity-20">
           <img 
             src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop" 
             alt="" 
             className="h-full w-full object-cover grayscale"
           />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl text-white sm:text-5xl">
            Elevate Your Everyday
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Join our community for exclusive access to new drops, sales, and style inspiration.
          </p>
          
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isAuthenticated ? (
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold uppercase tracking-wider text-primary transition-colors hover:bg-gray-100"
              >
                Shop Full Collection
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold uppercase tracking-wider text-primary transition-colors hover:bg-gray-100"
                >
                  Create Account
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-white px-8 py-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
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
