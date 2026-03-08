import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, ShoppingBag, Loader2, CheckCircle, ArrowLeft, Youtube, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const MATERIAL_CATEGORIES = [
  { id: "kain-mesh",     label: "Kain Mesh",               emoji: "🔵", gradient: "from-blue-500 to-blue-700",     badge: "bg-blue-100 text-blue-700",     desc: "Bahan mesh berjalur, selesa & sejuk" },
  { id: "kain-nylon",   label: "Kain Nylon",               emoji: "🟢", gradient: "from-green-500 to-green-700",   badge: "bg-green-100 text-green-700",   desc: "Tahan lama, mudah dicuci" },
  { id: "kain-fullsilk",label: "Kain Fullsilk",            emoji: "🟣", gradient: "from-purple-500 to-purple-700", badge: "bg-purple-100 text-purple-700", desc: "Mewah, lembut & tahan panas" },
  { id: "semi-leather", label: "Semi Leather Kalis Air",   emoji: "🟡", gradient: "from-amber-500 to-amber-700",   badge: "bg-amber-100 text-amber-700",   desc: "Kalis air, mudah dibersihkan" },
];

const STATES_MY = [
  "Johor","Kedah","Kelantan","Melaka","Negeri Sembilan","Pahang",
  "Perak","Perlis","Pulau Pinang","Sabah","Sarawak","Selangor",
  "Terengganu","W.P. Kuala Lumpur","W.P. Labuan","W.P. Putrajaya"
];

interface ProductVariation {
  id: string;
  name: string;
  price: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string | null;
  image_url: string | null;
  description: string | null;
  youtube_url: string | null;
  variations: ProductVariation[];
}

type Step = "category" | "product" | "form" | "loading";

export default function OrderPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("category");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<typeof MATERIAL_CATEGORIES[0] | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);

  const [form, setForm] = useState({
    name: "", phone: "", email: "", car_model: "",
    address: "", city: "", state: "", zip_code: "",
  });

  // Fetch products for selected category
  const fetchProducts = async (categoryLabel: string) => {
    setLoadingProducts(true);
    try {
      const { data: prods, error } = await supabase
        .from("products")
        .select("id, name, price, category, image_url, description")
        .eq("status", "active")
        .eq("category", categoryLabel)
        .order("name", { ascending: true })
        .limit(200);

      if (error) throw error;

      const productIds = (prods || []).map(p => p.id);
      let variations: any[] = [];
      if (productIds.length > 0) {
        const { data: vars } = await supabase
          .from("product_variations")
          .select("id, product_id, name, price")
          .in("product_id", productIds)
          .order("price", { ascending: true });
        variations = vars || [];
      }

      // Fetch youtube_url separately (new column)
      let youtubeMap: Record<string, string | null> = {};
      if (productIds.length > 0) {
        const { data: ytData } = await supabase
          .from("products")
          .select("id, youtube_url")
          .in("id", productIds) as any;
        (ytData || []).forEach((p: any) => { youtubeMap[p.id] = p.youtube_url || null; });
      }

      const enriched: Product[] = (prods || []).map(p => ({
        ...p,
        image_url: p.image_url || null,
        description: p.description || null,
        youtube_url: youtubeMap[p.id] || null,
        variations: variations.filter(v => v.product_id === p.id),
      }));

      setProducts(enriched);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSelectCategory = (cat: typeof MATERIAL_CATEGORIES[0]) => {
    setSelectedCategory(cat);
    setSelectedProduct(null);
    setSelectedVariation(null);
    fetchProducts(cat.label);
    setStep("product");
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedVariation(null);
  };

  const handleProceedToForm = () => {
    if (!selectedProduct) {
      toast({ title: "Sila pilih produk", variant: "destructive" });
      return;
    }
    if (selectedProduct.variations.length > 0 && !selectedVariation) {
      toast({ title: "Sila pilih saiz / variasi", variant: "destructive" });
      return;
    }
    setStep("form");
  };

  const finalPrice = selectedVariation?.price ?? selectedProduct?.price ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast({ title: "Sila isi nama dan nombor telefon", variant: "destructive" });
      return;
    }
    if (finalPrice <= 0) {
      toast({ title: "Harga tidak sah", variant: "destructive" });
      return;
    }
    setStep("loading");

    try {
      const projectId = "ywjblrnqygowfixxmigw";
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/billplz-create-bill`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            product: selectedProduct?.name,
            product_variation: selectedVariation?.name || "",
            sales_amount: finalPrice.toString(),
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.bill_url) {
        throw new Error(data.error || "Gagal cipta bil");
      }

      window.location.href = data.bill_url;
    } catch (err: any) {
      toast({ title: "Ralat", description: err.message, variant: "destructive" });
      setStep("form");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <div className="bg-gray-900/80 border-b border-white/10 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src="/lovable-uploads/2a080884-e251-46d5-a2c1-c5d1018f76f5.png" alt="ACS" className="h-8 w-8 object-contain" />
          <div>
            <span className="text-white font-bold text-sm">ACS Legacy AmancarseatCover</span>
            <p className="text-white/50 text-xs">Tempahan Cover Kerusi Kereta</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Step: Category */}
        {step === "category" && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Pilih Jenis Material</h1>
              <p className="text-white/60 text-sm">Semua cover jahitan kemas & tahan lama</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MATERIAL_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat)}
                  className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all hover:scale-105 active:scale-100 shadow-xl"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-90`} />
                  <div className="relative z-10">
                    <span className="text-3xl mb-3 block">{cat.emoji}</span>
                    <h3 className="text-white font-bold text-lg mb-1">{cat.label}</h3>
                    <p className="text-white/80 text-sm">{cat.desc}</p>
                    <div className="mt-4 flex items-center gap-1 text-white/90 text-xs font-medium">
                      <span>Lihat produk</span>
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Product selection */}
        {step === "product" && selectedCategory && (
          <div>
            <button onClick={() => setStep("category")} className="flex items-center gap-2 text-white/60 hover:text-white mb-6 text-sm">
              <ArrowLeft className="h-4 w-4" />Balik
            </button>
            <div className="mb-6">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${selectedCategory.badge}`}>
                {selectedCategory.emoji} {selectedCategory.label}
              </div>
              <h2 className="text-xl font-bold text-white mt-3">Pilih Produk</h2>
            </div>

            {loadingProducts ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-white/50" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-white/50">Tiada produk untuk kategori ini.</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                      selectedProduct?.id === product.id
                        ? "border-white bg-white/10 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <div>
                      <span className="font-semibold block">{product.name}</span>
                      {product.variations.length === 0 && (
                        <span className="text-sm text-green-400 font-bold">RM{product.price.toFixed(0)}</span>
                      )}
                      {product.variations.length > 0 && (
                        <span className="text-xs text-white/50">
                          Dari RM{Math.min(...product.variations.map(v => v.price)).toFixed(0)}
                        </span>
                      )}
                    </div>
                    {selectedProduct?.id === product.id && <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            {/* Variations */}
            {selectedProduct && selectedProduct.variations.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-3">Pilih Saiz / Variasi</h3>
                <div className="grid grid-cols-1 gap-2">
                  {selectedProduct.variations.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariation(v)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all ${
                        selectedVariation?.id === v.id
                          ? "border-white bg-white text-black"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      <span>{v.name}</span>
                      <span className="font-bold">RM{v.price.toFixed(0)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedProduct && selectedProduct.variations.length === 0 && (
              <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                <p className="text-green-400 font-semibold text-center text-lg">RM{selectedProduct.price.toFixed(0)}</p>
              </div>
            )}

            <Button
              onClick={handleProceedToForm}
              disabled={!selectedProduct}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl disabled:opacity-40"
            >
              Teruskan Tempahan <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step: Order form */}
        {step === "form" && (
          <div>
            <button onClick={() => setStep("product")} className="flex items-center gap-2 text-white/60 hover:text-white mb-6 text-sm">
              <ArrowLeft className="h-4 w-4" />Balik
            </button>
            <h2 className="text-xl font-bold text-white mb-1">Maklumat Tempahan</h2>
            <p className="text-white/50 text-sm mb-1">
              {selectedProduct?.name}{selectedVariation ? ` — ${selectedVariation.name}` : ""}
            </p>
            <p className="text-green-400 font-bold text-lg mb-6">RM{finalPrice.toFixed(0)}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-white/5 rounded-2xl p-5 space-y-4 border border-white/10">
                <h3 className="text-white font-semibold text-sm uppercase tracking-wide">Maklumat Pembeli</h3>
                <div>
                  <Label className="text-white/70 text-sm">Nama Penuh *</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                    placeholder="Nama penuh" className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30" required />
                </div>
                <div>
                  <Label className="text-white/70 text-sm">No. Telefon *</Label>
                  <Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                    placeholder="0123456789" className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30" required />
                </div>
                <div>
                  <Label className="text-white/70 text-sm">Email (opsional)</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
                    placeholder="email@contoh.com" className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                </div>
                <div>
                  <Label className="text-white/70 text-sm">Model Kereta *</Label>
                  <Input value={form.car_model} onChange={e => setForm(f => ({...f, car_model: e.target.value}))}
                    placeholder="Contoh: Perodua Myvi 2022" className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30" required />
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-5 space-y-4 border border-white/10">
                <h3 className="text-white font-semibold text-sm uppercase tracking-wide">Alamat Penghantaran</h3>
                <div>
                  <Label className="text-white/70 text-sm">Alamat</Label>
                  <Input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))}
                    placeholder="No, Jalan..." className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-white/70 text-sm">Bandar</Label>
                    <Input value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))}
                      placeholder="Bandar" className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                  </div>
                  <div>
                    <Label className="text-white/70 text-sm">Poskod</Label>
                    <Input value={form.zip_code} onChange={e => setForm(f => ({...f, zip_code: e.target.value}))}
                      placeholder="50000" className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                  </div>
                </div>
                <div>
                  <Label className="text-white/70 text-sm">Negeri</Label>
                  <Select onValueChange={val => setForm(f => ({...f, state: val}))}>
                    <SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Pilih negeri" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES_MY.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-3">Ringkasan Tempahan</h3>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/60">{selectedProduct?.name}</span>
                  <span className="text-white">{selectedVariation?.name || "-"}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-white/10 pt-3 mt-3">
                  <span className="text-white">Jumlah Bayar</span>
                  <span className="text-green-400">RM{finalPrice.toFixed(2)}</span>
                </div>
              </div>

              <Button type="submit" className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold text-base rounded-xl shadow-lg">
                <ShoppingBag className="h-5 w-5 mr-2" />
                Bayar Dengan BillPlz
              </Button>
              <p className="text-center text-white/40 text-xs">Pembayaran selamat melalui BillPlz Malaysia</p>
            </form>
          </div>
        )}

        {/* Step: Loading */}
        {step === "loading" && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
            <div className="text-center">
              <p className="text-white font-semibold text-lg">Sedang memproses...</p>
              <p className="text-white/50 text-sm mt-1">Anda akan diarahkan ke halaman pembayaran</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
