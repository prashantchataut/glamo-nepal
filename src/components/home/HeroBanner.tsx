import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { IMAGES } from "@/lib/image-library";

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFF5F8] to-white pt-8 pb-20 lg:pt-20 lg:pb-32">
      {/* Background Decor */}
      <div className="absolute -top-[20%] -right-[10%] z-0 h-[600px] w-[600px] rounded-full bg-[#FDECEF]/60 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-[10%] -left-[10%] z-0 h-[400px] w-[400px] rounded-full bg-[#F7D3DD]/40 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          {/* Text Content */}
          <div className="max-w-2xl text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#F7D3DD] bg-white/80 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#AD4B64] shadow-sm backdrop-blur-sm">
              <Sparkles size={14} /> Curated Beauty For You
            </div>
            
            <h1 className="font-display text-[3.5rem] font-medium leading-[1.05] tracking-[-0.02em] text-[#35131D] sm:text-7xl lg:text-[5.5rem]">
              Clean Beauty
              <span className="mt-2 block italic text-[#D97898]">Made Easy.</span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-[#7A726B] lg:mx-0">
              Transform your daily routine with our curated selection of premium skincare, makeup, and body essentials. Sourced globally, delivered locally.
            </p>
            
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/shop"
                className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-[#35131D] px-8 text-xs font-bold uppercase tracking-[0.18em] text-white transition-all duration-300 hover:bg-[#D97898] hover:shadow-lg hover:-translate-y-1"
              >
                Shop the Edit <ArrowRight size={16} />
              </Link>
              <Link
                href="/routines"
                className="inline-flex h-14 items-center justify-center gap-3 rounded-full border border-[#E8E4DF] bg-white px-8 text-xs font-bold uppercase tracking-[0.18em] text-[#35131D] transition-all duration-300 hover:border-[#D97898] hover:text-[#D97898]"
              >
                View Routines
              </Link>
            </div>
            
            <div className="mt-14 grid grid-cols-2 gap-6 border-t border-[#F5F3F0] pt-8 sm:grid-cols-3">
              <div className="flex flex-col items-center lg:items-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FDECEF] text-[#AD4B64]">
                  <ShieldCheck size={18} />
                </div>
                <p className="mt-3 text-sm font-bold text-[#35131D]">Authentic</p>
                <p className="mt-1 text-xs text-[#A8A09A]">100% Genuine</p>
              </div>
              <div className="flex flex-col items-center lg:items-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FDECEF] text-[#AD4B64]">
                  <Truck size={18} />
                </div>
                <p className="mt-3 text-sm font-bold text-[#35131D]">Fast Delivery</p>
                <p className="mt-1 text-xs text-[#A8A09A]">All across Nepal</p>
              </div>
              <div className="hidden flex-col items-center sm:flex lg:items-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FDECEF] text-[#AD4B64]">
                  <Sparkles size={18} />
                </div>
                <p className="mt-3 text-sm font-bold text-[#35131D]">Curated</p>
                <p className="mt-1 text-xs text-[#A8A09A]">Expert selected</p>
              </div>
            </div>
          </div>

          {/* Visual Composition */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            {/* Main Image */}
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2.5rem] shadow-[0_30px_90px_-20px_rgba(217,120,152,0.3)] ring-1 ring-white/50">
              <Image
                src={IMAGES.hero.secondary}
                alt="Premium skincare assortment"
                fill
                priority
                className="object-cover transition-transform duration-1000 hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            
            {/* Floating Product Card */}
            <div className="absolute -bottom-6 -left-4 z-20 flex w-72 items-center gap-4 rounded-[2rem] bg-white/95 p-4 shadow-[0_20px_50px_-10px_rgba(53,19,29,0.1)] backdrop-blur-md sm:-left-12 lg:-bottom-10 lg:-left-16">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.2rem] bg-[#F5F3F0]">
                <Image
                  src={IMAGES.heroProducts.cosrx}
                  alt="Featured serum"
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#AD4B64]">Best Seller</p>
                <p className="mt-1 font-display text-[1.35rem] font-semibold leading-tight text-[#35131D]">Botanical Serum</p>
                <Link 
                  href="/shop" 
                  className="mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#FDECEF] text-[#AD4B64] transition hover:bg-[#AD4B64] hover:text-white"
                  aria-label="Shop Botanical Serum"
                >
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Small Floating Accent */}
            <div className="absolute -right-4 top-16 z-20 hidden animate-[bounce_8s_infinite] items-center gap-3 rounded-full bg-white px-5 py-3 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] sm:flex lg:-right-8">
               <div className="flex -space-x-2">
                 <div className="h-8 w-8 rounded-full border-2 border-white bg-[#D97898]" />
                 <div className="h-8 w-8 rounded-full border-2 border-white bg-[#DFC2AF]" />
                 <div className="h-8 w-8 rounded-full border-2 border-white bg-[#E8E4DF]" />
               </div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-[#35131D]">5k+ Loved</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
