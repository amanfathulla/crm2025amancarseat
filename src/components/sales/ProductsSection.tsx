import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Check } from "lucide-react";

interface Product {
  id: string;
  name: string;
  nameBm: string;
  description: string;
  descriptionBm: string;
  price: string;
  features: string[];
  featuresBm: string[];
  popular?: boolean;
  image: string;
}

const products: Product[] = [
  {
    id: "executive",
    name: "Executive",
    nameBm: "Executive",
    description: "Premium leather look with elegant stitching",
    descriptionBm: "Gaya kulit premium dengan jahitan elegan",
    price: "RM 350",
    features: ["Full leather look", "Ergonomic design", "Easy cleaning"],
    featuresBm: ["Gaya kulit penuh", "Rekaan ergonomik", "Mudah bersih"],
    popular: true,
    image: "/placeholder.svg",
  },
  {
    id: "sporty",
    name: "Sporty",
    nameBm: "Sporty",
    description: "Racing-inspired design for bold drivers",
    descriptionBm: "Rekaan inspirasi lumba untuk pemandu berani",
    price: "RM 320",
    features: ["Racing stripes", "Breathable mesh", "Bold colors"],
    featuresBm: ["Jalur lumba", "Mesh bernafas", "Warna berani"],
    popular: false,
    image: "/placeholder.svg",
  },
  {
    id: "classic",
    name: "Classic",
    nameBm: "Classic",
    description: "Timeless design for everyday comfort",
    descriptionBm: "Rekaan abadi untuk keselesaan harian",
    price: "RM 280",
    features: ["Universal fit", "Durable fabric", "Affordable luxury"],
    featuresBm: ["Muat universal", "Fabrik tahan lama", "Kemewahan mampu milik"],
    popular: false,
    image: "/placeholder.svg",
  },
];

interface ProductsSectionProps {
  onOrderClick: () => void;
}

export const ProductsSection = ({ onOrderClick }: ProductsSectionProps) => {
  const { language, t } = useLanguage();

  return (
    <section id="products" className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t.productsTitle}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t.productsSubtitle}
          </p>
        </div>

        {/* Products grid */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {products.map((product, index) => (
            <div
              key={product.id}
              className={`relative bg-card border rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                product.popular 
                  ? 'border-primary shadow-lg shadow-primary/20' 
                  : 'border-border'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Popular badge */}
              {product.popular && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-primary text-primary-foreground font-medium">
                    {t.mostPopular}
                  </Badge>
                </div>
              )}

              {/* Product image placeholder */}
              <div className="aspect-[4/3] bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                <div className="text-center p-6">
                  <div className={`w-24 h-24 mx-auto rounded-xl flex items-center justify-center ${
                    product.popular ? 'bg-primary/30' : 'bg-muted-foreground/20'
                  }`}>
                    <span className="text-5xl">
                      {product.id === 'executive' ? '👔' : product.id === 'sporty' ? '🏎️' : '🎯'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Gambar produk sebenar</p>
                </div>
              </div>

              {/* Product details */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-foreground">
                    {language === 'bm' ? product.nameBm : product.name}
                  </h3>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
                
                <p className="text-muted-foreground text-sm mb-4">
                  {language === 'bm' ? product.descriptionBm : product.description}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {(language === 'bm' ? product.featuresBm : product.features).map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Price and CTA */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t.startingFrom}</p>
                    <p className="text-2xl font-bold text-primary">{product.price}</p>
                  </div>
                  <Button 
                    onClick={onOrderClick}
                    className={product.popular ? 'bg-primary hover:bg-primary/90' : ''}
                    variant={product.popular ? 'default' : 'outline'}
                  >
                    {t.orderNow}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
