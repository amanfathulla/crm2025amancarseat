import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'bm' | 'en';

interface Translations {
  // Hero Section
  heroHeadline: string;
  heroSubheadline: string;
  heroCTA: string;
  
  // Social Proof
  happyCustomers: string;
  realTestimonials: string;
  
  // Comparison
  beforeAfterTitle: string;
  before: string;
  after: string;
  transformIn: string;
  minutes: string;
  
  // Products
  productsTitle: string;
  productsSubtitle: string;
  mostPopular: string;
  orderNow: string;
  startingFrom: string;
  
  // Trust Signals
  warranty: string;
  waterproof: string;
  scratchResistant: string;
  easyInstall: string;
  
  // Wall of Fame
  wallOfFameTitle: string;
  wallOfFameSubtitle: string;
  loadMore: string;
  viewAll: string;
  
  // Testimonials
  testimonialsTitle: string;
  filterByBrand: string;
  all: string;
  writeReview: string;
  cancel: string;
  previous: string;
  next: string;
  
  // WhatsApp
  whatsappCTA: string;
  chatWithSpecialist: string;
  checkPrice: string;
  
  // Navigation
  home: string;
  testimonials: string;
  products: string;
  contact: string;
  
  // Testimoni Page - Categories
  searchPlaceholder: string;
  seeTransformations: string;
  owners: string;
  continental: string;
  others: string;
  
  // CTA Banners
  urgencyBanner: string;
  qualityBanner: string;
  bookingBanner: string;
}

const translations: Record<Language, Translations> = {
  bm: {
    heroHeadline: "Ubah Ruang Dalaman Kereta Anda Menjadi Mewah Serta-merta",
    heroSubheadline: "Material Premium Kalis Air & Anti-Calar. Jaminan Kepuasan dengan 1,000+ Testimoni Sebenar.",
    heroCTA: "Pilih Design & Tempah Sekarang",
    
    happyCustomers: "Pelanggan Berpuas Hati",
    realTestimonials: "Testimoni Sebenar",
    
    beforeAfterTitle: "Transformasi Luar Biasa",
    before: "Sebelum",
    after: "Selepas",
    transformIn: "Transformasi dalam",
    minutes: "minit",
    
    productsTitle: "Pilih Design Kegemaran Anda",
    productsSubtitle: "3 koleksi premium untuk setiap citarasa",
    mostPopular: "Paling Popular",
    orderNow: "Tempah Sekarang",
    startingFrom: "Bermula dari",
    
    warranty: "Jaminan 1 Tahun",
    waterproof: "Kalis Air",
    scratchResistant: "Anti-Calar",
    easyInstall: "Pasang 30-60 Minit",
    
    wallOfFameTitle: "11,799+ PEMILIK KERETA DI MALAYSIA DAH UPGRADE KE AMANCARSEAT!",
    wallOfFameSubtitle: "Jangan biar seat kereta boss nampak usang. Join komuniti kami yang mementingkan interior mewah & selesa",
    loadMore: "Lihat Lebih Banyak",
    viewAll: "Lihat Semua Testimoni",
    
    testimonialsTitle: "Galeri Testimoni",
    filterByBrand: "Tapis mengikut jenama",
    all: "Semua",
    writeReview: "Tulis Review Anda",
    cancel: "Batal",
    previous: "Sebelum",
    next: "Seterusnya",
    
    whatsappCTA: "WhatsApp Specialist",
    chatWithSpecialist: "Chat dengan pakar kami sekarang",
    checkPrice: "Check Harga Untuk Model Kereta Saya",
    
    home: "Utama",
    testimonials: "Testimoni",
    products: "Produk",
    contact: "Hubungi",
    
    searchPlaceholder: "Cari model kereta (cth: Myvi, Civic, Vios)...",
    seeTransformations: "Lihat hasil transformasi",
    owners: "pemilik",
    continental: "Continental",
    others: "Lain-lain",
    
    urgencyBanner: "🔥 Slot pemasangan minggu ini hampir penuh. Booking sekarang untuk elak tunggu lama!",
    qualityBanner: "✨ Material Premium Fabric Silk - Lebih sejuk, corak diamond eksklusif & grip anti-slip.",
    bookingBanner: "📞 Dapatkan harga terbaik untuk kereta anda sekarang!",
  },
  en: {
    heroHeadline: "Transform Your Car Interior Into Luxury Instantly",
    heroSubheadline: "Premium Waterproof & Scratch-Resistant Material. Satisfaction Guaranteed with 1,000+ Real Testimonials.",
    heroCTA: "Choose Design & Order Now",
    
    happyCustomers: "Happy Customers",
    realTestimonials: "Real Testimonials",
    
    beforeAfterTitle: "Amazing Transformation",
    before: "Before",
    after: "After",
    transformIn: "Transform in",
    minutes: "minutes",
    
    productsTitle: "Choose Your Favorite Design",
    productsSubtitle: "3 premium collections for every taste",
    mostPopular: "Most Popular",
    orderNow: "Order Now",
    startingFrom: "Starting from",
    
    warranty: "1 Year Warranty",
    waterproof: "Waterproof",
    scratchResistant: "Scratch-Resistant",
    easyInstall: "Install in 30-60 Min",
    
    wallOfFameTitle: "11,799+ CAR OWNERS IN MALAYSIA HAVE UPGRADED TO AMANCARSEAT!",
    wallOfFameSubtitle: "Don't let your car seats look worn out. Join our community who prioritize luxurious & comfortable interiors",
    loadMore: "Load More",
    viewAll: "View All Testimonials",
    
    testimonialsTitle: "Testimonial Gallery",
    filterByBrand: "Filter by brand",
    all: "All",
    writeReview: "Write Your Review",
    cancel: "Cancel",
    previous: "Previous",
    next: "Next",
    
    whatsappCTA: "WhatsApp Specialist",
    chatWithSpecialist: "Chat with our specialist now",
    checkPrice: "Check Price For My Car Model",
    
    home: "Home",
    testimonials: "Testimonials",
    products: "Products",
    contact: "Contact",
    
    searchPlaceholder: "Search car model (e.g., Myvi, Civic, Vios)...",
    seeTransformations: "See transformations from",
    owners: "owners",
    continental: "Continental",
    others: "Others",
    
    urgencyBanner: "🔥 Installation slots this week are almost full. Book now to avoid the wait!",
    qualityBanner: "✨ Premium Fabric Silk Material - Cooler feel, exclusive diamond pattern & anti-slip grip.",
    bookingBanner: "📞 Get the best price for your car now!",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('bm');
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
