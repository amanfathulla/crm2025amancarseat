import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, ShoppingBag, Loader2, CheckCircle, ArrowLeft, Youtube, Info, MapPin, User, Car, Tag, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import LiveFooter from "@/components/LiveFooter";
import FormattedDescription from "@/components/products/FormattedDescription";
import { Upload, X, ImagePlus } from "lucide-react";

const ALL_MATERIAL_CATEGORIES = [
  { id: "kain-mesh",      label: "Kain Mesh",              emoji: "🔵", gradient: "from-blue-500 to-blue-700",     border: "border-blue-500/40",   glow: "shadow-blue-500/20",   desc: "Berjalur, selesa & sejuk" },
  { id: "kain-nylon",     label: "Kain Nylon",             emoji: "🟢", gradient: "from-green-500 to-green-700",   border: "border-green-500/40",  glow: "shadow-green-500/20",  desc: "Tahan lama, mudah dicuci" },
  { id: "kain-fullsilk",  label: "Kain Fullsilk",          emoji: "🟣", gradient: "from-purple-500 to-purple-700", border: "border-purple-500/40", glow: "shadow-purple-500/20", desc: "Mewah, lembut & tahan panas" },
  { id: "semi-leather",   label: "Semi Leather Kalis Air", emoji: "🟡", gradient: "from-amber-500 to-amber-700",   border: "border-amber-500/40",  glow: "shadow-amber-500/20",  desc: "Kalis air, mudah dibersihkan" },
];

const STATES_MY = [
  "Johor","Kedah","Kelantan","Melaka","Negeri Sembilan","Pahang",
  "Perak","Perlis","Pulau Pinang","Sabah","Sarawak","Selangor",
  "Terengganu","W.P. Kuala Lumpur","W.P. Labuan","W.P. Putrajaya"
];

interface ProductVariation { id: string; name: string; price: number; }
interface Product {
  id: string; name: string; price: number;
  category: string | null; image_url: string | null; image_urls?: string[] | null;
  description: string | null; youtube_url: string | null;
  variations: ProductVariation[];
}
type Step = "category" | "product" | "form" | "loading";

const STEP_LABELS: Record<Step, string> = {
  category: "Jenis Material",
  product:  "Pilih Produk",
  form:     "Maklumat",
  loading:  "Memproses",
};

export default function OrderPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("category");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [enabledCategories, setEnabledCategories] = useState<string[] | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState<typeof ALL_MATERIAL_CATEGORIES[0] | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);

  const [form, setForm] = useState({
    name: "", phone: "", email: "", car_model: "",
    address: "", city: "", state: "", zip_code: "",
  });

  // Optional seat reference images + notes
  const [seatImages, setSeatImages] = useState<{ front: string; back: string; third: string }>({ front: "", back: "", third: "" });
  const [uploadingImage, setUploadingImage] = useState<"front" | "back" | "third" | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, slot: "front" | "back" | "third") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Saiz fail terlalu besar", description: "Maksimum 5MB per gambar.", variant: "destructive" });
      return;
    }
    setUploadingImage(slot);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${slot}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("customer-seat-images").upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("customer-seat-images").getPublicUrl(path);
      setSeatImages(prev => ({ ...prev, [slot]: pub.publicUrl }));
      toast({ title: "Gambar dimuat naik", description: "Gambar berjaya dihantar." });
    } catch (err: any) {
      toast({ title: "Gagal muat naik", description: err?.message || "Sila cuba lagi.", variant: "destructive" });
    } finally {
      setUploadingImage(null);
      e.target.value = "";
    }
  };

  const removeImage = (slot: "front" | "back" | "third") => {
    setSeatImages(prev => ({ ...prev, [slot]: "" }));
  };

  const [shippingCosts, setShippingCosts] = useState<{ semenanjung: number; sabahSarawak: number; enabled: boolean }>({ semenanjung: 10, sabahSarawak: 20, enabled: true });

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_amount: number; discount_type: string } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Fetch shipping settings
  useEffect(() => {
    supabase.from("shipping_settings" as any)
      .select("semenanjung_cost, sabah_sarawak_cost, is_enabled")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const r = data as any;
          setShippingCosts({
            semenanjung: Number(r.semenanjung_cost) || 0,
            sabahSarawak: Number(r.sabah_sarawak_cost) || 0,
            enabled: !!r.is_enabled,
          });
        }
      });
  }, []);

  // Fetch enabled categories on mount
  useEffect(() => {
    supabase.from("category_settings" as any).select("name, is_enabled").then(({ data }) => {
      if (data) {
        const enabled = (data as any[]).filter(r => r.is_enabled).map(r => r.name);
        setEnabledCategories(enabled);
      } else {
        setEnabledCategories(ALL_MATERIAL_CATEGORIES.map(c => c.label));
      }
    });
  }, []);

  // Auto-select material from URL query param (e.g. ?material=fullsilk)
  useEffect(() => {
    if (enabledCategories === null) return;
    const params = new URLSearchParams(window.location.search);
    const mat = params.get("material");
    if (!mat) return;
    const match = ALL_MATERIAL_CATEGORIES.find(c =>
      c.id.toLowerCase().includes(mat.toLowerCase()) ||
      c.label.toLowerCase().includes(mat.toLowerCase())
    );
    if (match) {
      setSelectedCategory(match);
      setSelectedProduct(null);
      setSelectedVariation(null);
      fetchProducts(match.label);
      setStep("product");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledCategories]);

  const MATERIAL_CATEGORIES = enabledCategories
    ? ALL_MATERIAL_CATEGORIES.filter(c => enabledCategories.includes(c.label))
    : ALL_MATERIAL_CATEGORIES;

  const fetchProducts = async (categoryLabel: string) => {
    setLoadingProducts(true);
    try {
      const { data: prods, error } = await (supabase as any)
        .from("public_products").select("id, name, price, category, image_url, description, status")
        .eq("status", "active").eq("category", categoryLabel)
        .order("name", { ascending: true }).limit(200);
      if (error) throw error;

      const ids = (prods || []).map((p: any) => p.id);
      const [varsRes, detailRes] = await Promise.all([
        ids.length > 0 ? (supabase as any).from("public_product_variations").select("id, product_id, name, price").in("product_id", ids).order("price") : { data: [] },
        ids.length > 0 ? ((supabase as any).from("public_products").select("id, youtube_url, image_urls").in("id", ids)) : { data: [] },
      ]);
      const vars = varsRes.data || [];
      const detailMap: Record<string, { youtube_url: string | null; image_urls: string[] | null }> = {};
      (detailRes.data || []).forEach((p: any) => {
        detailMap[p.id] = { youtube_url: p.youtube_url || null, image_urls: p.image_urls || null };
      });

      setProducts((prods || []).map(p => ({
        ...p,
        youtube_url: detailMap[p.id]?.youtube_url || null,
        image_urls: detailMap[p.id]?.image_urls || null,
        variations: vars.filter((v: any) => v.product_id === p.id),
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSelectCategory = (cat: typeof ALL_MATERIAL_CATEGORIES[0]) => {
    setSelectedCategory(cat);
    setSelectedProduct(null); setSelectedVariation(null);
    fetchProducts(cat.label);
    setStep("product");
  };

  const productPrice = selectedVariation?.price ?? selectedProduct?.price ?? 0;

  const EAST_MALAYSIA = ["Sabah", "Sarawak", "W.P. Labuan"];
  const getPostageCost = (state: string) => {
    if (!state || !shippingCosts.enabled) return 0;
    return EAST_MALAYSIA.includes(state) ? shippingCosts.sabahSarawak : shippingCosts.semenanjung;
  };
  const postageCost = getPostageCost(form.state);

  const couponDiscount = appliedCoupon
    ? appliedCoupon.discount_type === "percentage"
      ? Math.round((productPrice + postageCost) * appliedCoupon.discount_amount / 100)
      : appliedCoupon.discount_amount
    : 0;
  const finalPrice = Math.max(0, productPrice + postageCost - couponDiscount);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCouponError("Sila masukkan kod kupon"); return; }
    setIsValidatingCoupon(true); setCouponError("");
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .single();
      if (error || !data) { setCouponError("Kod kupon tidak sah"); return; }
      if (new Date(data.valid_until) < new Date()) { setCouponError("Kupon telah tamat tempoh"); return; }
      if (data.usage_count >= data.usage_limit) { setCouponError("Kupon telah habis digunakan"); return; }
      setAppliedCoupon({ code: data.code, discount_amount: data.discount_amount, discount_type: data.discount_type });
      setCouponError("");
      toast({ title: "Kupon berjaya!", description: `Diskaun ${data.discount_type === "fixed" ? `RM${data.discount_amount}` : `${data.discount_amount}%`} telah diaplikasikan` });
    } catch { setCouponError("Gagal mengesahkan kupon"); }
    finally { setIsValidatingCoupon(false); }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null); setCouponInput(""); setCouponError("");
  };

  const handleProceedToForm = () => {
    if (!selectedProduct) { toast({ title: "Sila pilih produk", variant: "destructive" }); return; }
    if (selectedProduct.variations.length > 0 && !selectedVariation) { toast({ title: "Sila pilih saiz / variasi", variant: "destructive" }); return; }
    setStep("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast({ title: "Sila isi nama dan nombor telefon", variant: "destructive" }); return; }
    if (!form.state) { toast({ title: "Sila pilih negeri untuk kira kos postage", variant: "destructive" }); return; }
    if (finalPrice <= 0) { toast({ title: "Harga tidak sah", variant: "destructive" }); return; }
    setStep("loading");
    try {
      const res = await fetch(
        `https://ywjblrnqygowfixxmigw.supabase.co/functions/v1/billplz-create-bill`,
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, product: selectedProduct?.name, product_variation: selectedVariation?.name || "", sales_amount: finalPrice.toString(), coupon_code: appliedCoupon?.code || "" }) }
      );
      const data = await res.json();
      if (!res.ok || !data.bill_url) throw new Error(data.error || "Gagal cipta bil");
      window.location.href = data.bill_url;
    } catch (err: any) {
      toast({ title: "Ralat", description: err.message, variant: "destructive" });
      setStep("form");
    }
  };

  const handleWhatsappPayment = async () => {
    if (!form.name || !form.phone || !form.car_model || !form.state) {
      toast({ title: "Isi maklumat dahulu", description: "Sila lengkapkan nama, telefon, model kereta dan negeri terlebih dahulu.", variant: "destructive" });
      return;
    }
    if (finalPrice <= 0) {
      toast({ title: "Harga tidak sah", variant: "destructive" });
      return;
    }

    setStep("loading");

    try {
      const customerId = crypto.randomUUID();
      const email = form.email?.trim() || `${form.phone.replace(/[^0-9]/g, "")}+${Date.now()}@noemail.com`;
      const orderRef = customerId.slice(-6).toUpperCase();

      const { error } = await supabase.from("customers").insert({
        id: customerId,
        name: form.name,
        phone: form.phone,
        email,
        address: form.address,
        city: form.city || form.state,
        state: form.state,
        zip_code: form.zip_code,
        car_model: form.car_model,
        product: selectedProduct?.name || "",
        product_variation: selectedVariation?.name || "",
        sales_amount: finalPrice,
        paid_amount: finalPrice,
        gross_profit: 0,
        order_status: "processing",
        payment_source: "whatsapp",
        order_date: new Date().toISOString(),
      });

      if (error) throw error;

      if (appliedCoupon?.code) {
        await supabase.rpc("increment_coupon_usage", { p_code: appliedCoupon.code });
      }

      fetch(`https://ywjblrnqygowfixxmigw.supabase.co/functions/v1/telegram-notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customerId, payment_source: "whatsapp" }),
      }).catch(() => {});

      const waMsg = encodeURIComponent(
        `Assalamualaikum, saya ingin membuat bayaran melalui WhatsApp untuk tempahan berikut:\n\n` +
        `📋 No. Tempahan: #${orderRef}\n` +
        `📦 Produk: ${selectedProduct?.name || "-"}${selectedVariation ? ` (${selectedVariation.name})` : ""}\n` +
        `💰 Jumlah Bayar: RM${finalPrice.toFixed(2)}\n\n` +
        `Saya telah buat pemindahan ke:\n🏦 Maybank – ACS LEGACY\n🔢 553038596454\n\n` +
        `Nama: ${form.name || "-"}\nNo. Telefon: ${form.phone || "-"}\nModel Kereta: ${form.car_model || "-"}\n\n` +
        `Sila sahkan penerimaan bayaran. Terima kasih! 🙏`
      );

      window.location.href = `https://wa.me/60194503184?text=${waMsg}`;
    } catch (err: any) {
      toast({ title: "Ralat", description: err?.message || "Gagal simpan tempahan. Sila cuba lagi.", variant: "destructive" });
      setStep("form");
    }
  };

  const getYoutubeId = (url: string | null) => {
    if (!url) return null;
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  };

  return (
    /* Full-screen fixed background — covers everything */
    <div className="fixed inset-0 bg-[#0a0a0f] overflow-y-auto">
      {/* Ambient glow top */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-20 w-[400px] h-[400px] rounded-full bg-purple-600/8 blur-[100px]" />
      </div>

      {/* ── Sticky Header ─────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/8">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <img src="/lovable-uploads/2a080884-e251-46d5-a2c1-c5d1018f76f5.png" alt="ACS" className="h-7 w-7 object-contain" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-none truncate">ACS Legacy</p>
            <p className="text-white/40 text-[10px] leading-tight">Cover Kerusi Kereta</p>
          </div>
          {/* Step indicator pills */}
          <div className="hidden sm:flex items-center gap-1">
            {(["category","product","form"] as Step[]).map((s, i) => {
              const steps: Step[] = ["category","product","form"];
              const idx = steps.indexOf(step);
              const done = steps.indexOf(s) < idx;
              const active = s === step || (step === "loading" && s === "form");
              return (
                <div key={s} className="flex items-center gap-1">
                  {i > 0 && <div className={`w-4 h-px ${done || active ? "bg-blue-500/60" : "bg-white/10"}`} />}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${active ? "bg-blue-600 text-white font-semibold" : done ? "bg-white/10 text-white/60" : "text-white/25"}`}>
                    {i + 1}. {STEP_LABELS[s]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 py-8 pb-16">

        {/* ── STEP: Category ── */}
        {step === "category" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 mb-4">
                <ShoppingBag className="h-7 w-7 text-white/70" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Pilih Jenis Material</h1>
              <p className="text-white/50 text-sm max-w-xs mx-auto">Semua cover jahitan kemas, tahan lama & berkualiti tinggi</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MATERIAL_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat)}
                  className={`group relative overflow-hidden rounded-2xl border ${cat.border} text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] shadow-xl ${cat.glow}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-85`} />
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative z-10 p-6">
                    <span className="text-4xl mb-4 block">{cat.emoji}</span>
                    <h3 className="text-white font-bold text-lg mb-1">{cat.label}</h3>
                    <p className="text-white/75 text-sm">{cat.desc}</p>
                    <div className="mt-5 flex items-center gap-1 text-white text-xs font-semibold bg-white/20 w-fit px-3 py-1.5 rounded-full">
                      Lihat Produk <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: Product ── */}
        {step === "product" && selectedCategory && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button onClick={() => setStep("category")}
              className="flex items-center gap-1.5 text-white/50 hover:text-white mb-6 text-sm transition-colors">
              <ArrowLeft className="h-4 w-4" /> Tukar material
            </button>

            {/* Category badge */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${selectedCategory.gradient} text-lg`}>{selectedCategory.emoji}</div>
              <div>
                <p className="text-white/50 text-xs">Kategori dipilih</p>
                <h2 className="text-white font-bold text-lg">{selectedCategory.label}</h2>
              </div>
            </div>

            {loadingProducts ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-white/30" />
                <p className="text-white/40 text-sm">Memuatkan produk...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white/3 rounded-2xl border border-white/8">
                <p className="text-white/40 text-sm">Tiada produk untuk kategori ini.</p>
              </div>
            ) : (
              <div className="space-y-2.5 mb-6">
                <p className="text-white/50 text-xs uppercase tracking-widest font-medium mb-3">Pilih Produk</p>
                {products.map((product) => {
                  const isSelected = selectedProduct?.id === product.id;
                  return (
                    <button key={product.id} onClick={() => { setSelectedProduct(product); setSelectedVariation(null); setImageIndex(0); }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-150 ${
                        isSelected
                          ? "border-blue-500/60 bg-blue-500/10 text-white ring-1 ring-blue-500/30"
                          : "border-white/8 bg-white/4 text-white/65 hover:bg-white/8 hover:text-white hover:border-white/15"
                      }`}>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold block truncate">{product.name}</span>
                        <span className={`text-sm font-bold mt-0.5 block ${isSelected ? "text-blue-300" : "text-white/45"}`}>
                          {product.variations.length > 0
                            ? `Dari RM${Math.min(...product.variations.map(v => v.price)).toFixed(0)}`
                            : `RM${product.price.toFixed(0)}`}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="ml-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                          <CheckCircle className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Product detail card */}
            {selectedProduct && (() => {
              const imgs = (selectedProduct.image_urls && selectedProduct.image_urls.length > 0)
                ? selectedProduct.image_urls
                : selectedProduct.image_url ? [selectedProduct.image_url] : [];
              return (
                <div className="mb-6 rounded-2xl overflow-hidden border border-white/10 bg-white/4">
                  {/* Multi-image carousel */}
                  {imgs.length > 0 && (
                    <div className="relative w-full aspect-video overflow-hidden bg-black/40">
                      <img
                        src={imgs[imageIndex] || imgs[0]}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover transition-opacity duration-200"
                      />
                      {imgs.length > 1 && (
                        <>
                          <button
                            onClick={() => setImageIndex(i => (i - 1 + imgs.length) % imgs.length)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setImageIndex(i => (i + 1) % imgs.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                          >
                            <ChevronRightIcon className="h-4 w-4" />
                          </button>
                          {/* Dots indicator */}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {imgs.map((_, i) => (
                              <button key={i} onClick={() => setImageIndex(i)}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${i === imageIndex ? "bg-white w-4" : "bg-white/40"}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {/* Thumbnail strip */}
                  {imgs.length > 1 && (
                    <div className="flex gap-2 p-3 overflow-x-auto">
                      {imgs.map((url, i) => (
                        <button key={i} onClick={() => setImageIndex(i)}
                          className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === imageIndex ? "border-white/60" : "border-transparent opacity-50 hover:opacity-75"}`}>
                          <img src={url} alt={`Gambar ${i+1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedProduct.description && (
                    <div className="p-4 flex gap-3 border-t border-white/8">
                      <Info className="h-4 w-4 text-white/35 shrink-0 mt-0.5" />
                      <FormattedDescription
                        text={selectedProduct.description}
                        className="text-white/70 text-sm flex-1"
                      />
                    </div>
                  )}
                  {getYoutubeId(selectedProduct.youtube_url) && (
                    <div className="p-4 pt-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Youtube className="h-4 w-4 text-red-400" />
                        <span className="text-white/50 text-xs font-medium">Video Produk</span>
                      </div>
                      <div className="aspect-video rounded-xl overflow-hidden bg-black/40">
                        <iframe
                          src={`https://www.youtube.com/embed/${getYoutubeId(selectedProduct.youtube_url)}`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen title="Video produk"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Variations */}
            {selectedProduct?.variations && selectedProduct.variations.length > 0 && (
              <div className="mb-6">
                <p className="text-white/50 text-xs uppercase tracking-widest font-medium mb-3">Pilih Saiz / Variasi</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedProduct.variations.map((v) => {
                    const sel = selectedVariation?.id === v.id;
                    return (
                      <button key={v.id} onClick={() => setSelectedVariation(v)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border text-sm font-medium transition-all ${
                          sel ? "border-white bg-white text-black shadow-lg" : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white"
                        }`}>
                        <span>{v.name}</span>
                        <span className={`font-bold ${sel ? "text-black" : "text-green-400"}`}>RM{v.price.toFixed(0)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedProduct?.variations.length === 0 && selectedProduct && (
              <div className="mb-6 p-4 rounded-xl bg-green-500/8 border border-green-500/20 text-center">
                <p className="text-white/50 text-xs mb-1">Harga</p>
                <p className="text-green-400 font-bold text-2xl">RM{selectedProduct.price.toFixed(0)}</p>
              </div>
            )}

            <Button onClick={handleProceedToForm} disabled={!selectedProduct}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-900/40 disabled:opacity-30 transition-all">
              Teruskan Tempahan <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* ── STEP: Form ── */}
        {step === "form" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button onClick={() => setStep("product")}
              className="flex items-center gap-1.5 text-white/50 hover:text-white mb-6 text-sm transition-colors">
              <ArrowLeft className="h-4 w-4" /> Tukar produk
            </button>

            {/* Selected product summary pill */}
            <div className="flex items-center gap-3 mb-8 p-4 rounded-2xl bg-white/4 border border-white/8">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${selectedCategory?.gradient || "from-blue-500 to-blue-700"} text-base shrink-0`}>
                {selectedCategory?.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{selectedProduct?.name}</p>
                {selectedVariation && <p className="text-white/50 text-xs truncate">{selectedVariation.name}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-green-400 font-bold text-xl">RM{productPrice.toFixed(0)}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Buyer Info */}
              <section className="backdrop-blur-xl bg-white/80 rounded-2xl p-5 border border-gray-200 shadow-lg space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-blue-600" />
                  <h3 className="text-gray-900 font-semibold text-sm">Maklumat Pembeli</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600 text-xs mb-1.5 block">Nama Penuh *</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                      placeholder="Nama penuh" className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 h-10" required />
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs mb-1.5 block">No. Telefon *</Label>
                    <Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                      placeholder="0123456789" className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 h-10" required />
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600 text-xs mb-1.5 block">Email (opsional)</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
                    placeholder="email@contoh.com" className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 h-10" />
                </div>
                <div>
                  <Label className="text-gray-600 text-xs mb-1.5 block flex items-center gap-1.5">
                    <Car className="h-3 w-3" /> Model Kereta *
                  </Label>
                  <Input value={form.car_model} onChange={e => setForm(f => ({...f, car_model: e.target.value}))}
                    placeholder="Contoh: Perodua Myvi 2022" className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 h-10" required />
                </div>
              </section>

              {/* Delivery Address */}
              <section className="backdrop-blur-xl bg-white/80 rounded-2xl p-5 border border-gray-200 shadow-lg space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-purple-600" />
                  <h3 className="text-gray-900 font-semibold text-sm">Alamat Penghantaran</h3>
                </div>
                <div>
                  <Label className="text-gray-600 text-xs mb-1.5 block">Alamat</Label>
                  <Input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))}
                    placeholder="No, Jalan..." className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 h-10" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-600 text-xs mb-1.5 block">Bandar</Label>
                    <Input value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))}
                      placeholder="Bandar" className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 h-10" />
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs mb-1.5 block">Poskod</Label>
                    <Input value={form.zip_code} onChange={e => setForm(f => ({...f, zip_code: e.target.value}))}
                      placeholder="50000" className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 h-10" />
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600 text-xs mb-1.5 block">Negeri *</Label>
                  <Select onValueChange={val => setForm(f => ({...f, state: val}))}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900 h-10 focus:border-blue-500">
                      <SelectValue placeholder="Pilih negeri" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {STATES_MY.map(s => <SelectItem key={s} value={s} className="text-gray-900 focus:bg-gray-100">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </section>

              {/* Order Summary */}
              <section className="backdrop-blur-xl bg-white/80 rounded-2xl p-5 border border-gray-200 shadow-lg">
                <h3 className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-4">Ringkasan Tempahan</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Produk</span>
                    <span className="text-gray-900 font-medium text-right max-w-[60%] truncate">{selectedProduct?.name}</span>
                  </div>
                  {selectedVariation && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Saiz/Variasi</span>
                      <span className="text-gray-900">{selectedVariation.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Harga Produk</span>
                    <span className="text-gray-900">RM{productPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Kos Postage {form.state ? `(${form.state})` : ""}</span>
                    <span className={`font-medium ${form.state ? "text-gray-900" : "text-gray-400"}`}>
                      {form.state ? `RM${postageCost.toFixed(2)}` : "Pilih negeri"}
                    </span>
                  </div>
                  {!form.state && (
                    <p className="text-amber-600 text-xs flex items-center gap-1">
                      <Info className="h-3 w-3" /> Semenanjung RM{shippingCosts.semenanjung.toFixed(0)} · Sabah/Sarawak/Labuan RM{shippingCosts.sabahSarawak.toFixed(0)}
                    </p>
                  )}
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Diskaun ({appliedCoupon.code})</span>
                      <span>-RM{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-gray-200 font-bold text-base">
                    <span className="text-gray-900">Jumlah Bayar</span>
                    <span className="text-green-600">RM{finalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </section>

              {/* Coupon Section */}
              <section className="backdrop-blur-xl bg-white/80 rounded-2xl p-5 border border-gray-200 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-orange-500" />
                  <h3 className="text-gray-900 font-semibold text-sm">Ada Kod Kupon?</h3>
                </div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-200">
                    <div>
                      <p className="text-green-700 font-bold text-sm">{appliedCoupon.code}</p>
                      <p className="text-green-600 text-xs">
                        Diskaun {appliedCoupon.discount_type === "fixed" ? `RM${appliedCoupon.discount_amount}` : `${appliedCoupon.discount_amount}%`} diaplikasikan
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={handleRemoveCoupon}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs">
                      Buang
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input value={couponInput} onChange={e => setCouponInput(e.target.value)}
                      placeholder="Masukkan kod kupon"
                      className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 h-10 uppercase"
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleApplyCoupon())} />
                    <Button type="button" onClick={handleApplyCoupon} disabled={isValidatingCoupon}
                      variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100 h-10 px-4 shrink-0">
                      {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guna"}
                    </Button>
                  </div>
                )}
                {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
              </section>

              {/* Payment Options */}
              <div className="space-y-3">
                <p className="text-white/40 text-xs uppercase tracking-widest text-center font-medium">Pilih Kaedah Pembayaran</p>

                {/* BillPlz */}
                <Button type="submit"
                  className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold text-base rounded-xl shadow-xl shadow-blue-900/40 transition-all">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Bayar Dengan BillPlz
                </Button>
                <p className="text-center text-white/25 text-xs">🔒 Pembayaran selamat melalui BillPlz Malaysia</p>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/30 text-xs">atau</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* WhatsApp Payment */}
                <div className="rounded-2xl border border-green-500/25 bg-green-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">💬</span>
                    <h3 className="text-white font-semibold text-sm">Bayar Melalui WhatsApp</h3>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-1.5">
                    <p className="text-white/50 text-xs uppercase tracking-wide font-medium">Nombor Akaun Pembayaran</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏦</span>
                      <div>
                        <p className="text-white font-bold text-sm">Maybank – ACS LEGACY</p>
                        <p className="text-green-400 font-bold text-lg tracking-widest">553038596454</p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 w-full h-12 bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-green-900/30"
                    onClick={handleWhatsappPayment}
                  >
                    <span className="text-base">📱</span>
                    Hubungi & Bayar Via WhatsApp
                  </button>
                  <p className="text-white/25 text-xs text-center">Transfer dulu, kemudian hantar bukti bayaran via WhatsApp</p>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ── STEP: Loading ── */}
        {step === "loading" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in duration-300">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
              </div>
              <div className="absolute inset-0 rounded-full bg-blue-500/5 animate-ping" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-xl mb-1">Sedang memproses...</p>
              <p className="text-white/40 text-sm">Anda akan diarahkan ke halaman pembayaran</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <LiveFooter />
    </div>
  );
}
