import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative w-full overflow-hidden bg-quaternary">
      <div className="grid min-h-[70vh] grid-cols-1 sm:min-h-[75vh] lg:min-h-[85vh] lg:grid-cols-12">
        {/* Left Content Panel */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex flex-col justify-center bg-[#F9F9F9] px-4 py-10 sm:px-6 sm:py-16 lg:col-span-5 lg:px-16 xl:px-20"
        >
          <div className="max-w-xl">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-3 inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-secondary/60 sm:mb-4 sm:text-xs"
            >
              New Collection 2026
            </motion.span>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
              className="mb-4 font-serif text-3xl font-medium leading-[1.15] text-primary sm:mb-6 sm:text-5xl sm:leading-[1.1] lg:text-6xl xl:text-7xl"
            >
              The Art of <br />
              <span className="italic text-secondary/80">Modern</span> Dressing.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mb-8 max-w-md text-sm leading-relaxed text-secondary/70 sm:mb-10 sm:text-base"
            >
              Discover our curated edit of timeless essentials, designed to elevate your everyday wardrobe with effortless sophistication.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center"
            >
              <Link
                to="/products"
                className="group relative flex min-h-12 items-center justify-center overflow-hidden rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-white transition-all duration-300 hover:bg-secondary hover:shadow-lg hover:shadow-primary/20 sm:px-8 sm:py-4"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Shop Collection
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
              
              <Link
                to="/products?newArrivalsOnly=true"
                className="group flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary px-6 py-3.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5 sm:px-8 sm:py-4"
              >
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                <span>New Arrivals</span>
              </Link>
            </motion.div>
          </div>

          {/* Decorative elements */}
          <div className="absolute bottom-8 left-8 hidden lg:block">
            <div className="flex items-center gap-4 text-xs font-medium tracking-widest text-secondary/40">
              <span>01</span>
              <div className="h-px w-12 bg-secondary/20"></div>
              <span>04</span>
            </div>
          </div>
        </motion.div>

        {/* Right Image Panel */}
        <div className="relative h-[40vh] min-h-[240px] sm:h-[50vh] lg:col-span-7 lg:h-auto lg:min-h-0 overflow-hidden">
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute inset-0 h-full w-full"
          >
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop"
              alt="Model walking in city wearing fashionable coat"
              className="h-full w-full object-cover object-center"
            />
            
            {/* Subtle overlay gradient for text readability if needed on mobile, 
                but here acts as a filter */}
            <div className="absolute inset-0 bg-primary/5 mix-blend-multiply lg:bg-transparent"></div>
          </motion.div>

          {/* Floating Card (Optional - adds depth) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="absolute bottom-8 right-8 hidden max-w-xs rounded-xl bg-white/90 p-5 backdrop-blur-md shadow-xl lg:block"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-200">
                <img 
                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=200&auto=format&fit=crop" 
                  alt="Featured item" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-secondary/60">Featured Look</p>
                <h3 className="text-sm font-semibold text-primary">The Classic Trench</h3>
                <p className="text-xs text-secondary"> timeless silhouette re-imagined.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
