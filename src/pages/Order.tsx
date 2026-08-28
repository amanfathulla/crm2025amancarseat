import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/pixels";
import { trackSalePageEvent } from "@/lib/salePageEvents";
import seat2 from "@/assets/seat-png/2-seater.png";
import seat5 from "@/assets/seat-png/5-seater.png";
import seat7 from "@/assets/seat-png/7-seater.png";
import { ChevronRight, ShoppingBag, Loader2, CheckCircle, ArrowLeft, Youtube, Info, MapPin, User, Car, Tag, ChevronLeft, ChevronRight as ChevronRightIcon, CreditCard as CreditCardIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import FormattedDescription from "@/components/products/FormattedDescription";
import { Upload, X, ImagePlus } from "lucide-react";
import MaterialTestimonials from "@/components/sales/MaterialTestimonials";

const ALL_MATERIAL_CATEGORIES = [
  { id: "kain-mesh",      label: "Kain Mesh",              emoji: "🔵", gradient: "from-blue-500 to-blue-700",     border: "border-blue-500/40",   glow: "shadow-blue-500/20",   desc: "Berjalur, selesa & sejuk" },
  { id: "kain-nylon",     label: "Kain Nylon",             emoji: "🟢", gradient: "from-green-500 to-green-700",   border: "border-green-500/40",  glow: "shadow-green-500/20",  desc: "Tahan lama, mudah dicuci" },
  { id: "kain-fullsilk",  label: "Kain Fullsilk",          emoji: "🟣", gradient: "from-purple-500 to-purple-700", border: "border-purple-500/40", glow: "shadow-purple-500/20", bestSeller: true, desc: "Mewah, lembut & tahan panas" },
  { id: "semi-leather",   label: "Semi Leather Kalis Air", emoji: "🟡", gradient: "from-amber-500 to-amber-700",   border: "border-amber-500/40",  glow: "shadow-amber-500/20",  bestSeller: true, desc: "Kalis air, mudah dibersihkan" },
];

const STATES_MY = [
  "Johor","Kedah","Kelantan","Melaka","Negeri Sembilan","Pahang",
  "Perak","Perlis","Pulau Pinang","Sabah","Sarawak","Selangor",
  "Terengganu","W.P. Kuala Lumpur","W.P. Labuan","W.P. Putrajaya"
];

function parseSeatCount(name: string): number {
  const m = name.match(/(\d+)\s*seater/i);
  return m ? parseInt(m[1], 10) : 5;
}
function SeatIcon({ count }: { count: number }) {
  const src = count <= 2 ? seat2 : count <= 5 ? seat5 : seat7;
  return <img src={src} alt={`${count} seater`} className="h-12 sm:h-14 w-auto shrink-0 object-contain" />;
}

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
  const pageScrollRef = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState<Step>("category");
  // While pre-selecting product/variation from URL (?product=ID), hide the material screen
  // so users coming from a salepage don't see a 3-second "Pilih Material" flash.
  const [preselecting, setPreselecting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [enabledCategories, setEnabledCategories] = useState<string[] | null>(null);
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
  const [categoryDescriptions, setCategoryDescriptions] = useState<Record<string, string>>({});
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
  const [showRefDialog, setShowRefDialog] = useState(false);
  // Real storage URLs (for saving to DB). seatImages holds local preview blobs.
  const [seatImageUrls, setSeatImageUrls] = useState<{ front: string; back: string; third: string }>({ front: "", back: "", third: "" });
  const [uploadingImage, setUploadingImage] = useState<"front" | "back" | "third" | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Affiliate referral code captured from ?ref= (set once on load)
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [paymentType, setPaymentType] = useState<"full" | "deposit">("full");
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  const [gateways, setGateways] = useState<{ provider: string; display_name: string }[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<string>("billplz");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("payment_gateways" as any)
        .select("provider, display_name, display_order")
        .eq("is_enabled", true)
        .order("display_order", { ascending: true });
      const list = (data as any[]) || [];
      if (list.length > 0) {
        setGateways(list);
        setSelectedGateway(list[0].provider);
      } else {
        setGateways([]);
        setSelectedGateway("");
      }
    })();
  }, []);

  const resetOrderScroll = () => {
    pageScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    if (pageScrollRef.current) pageScrollRef.current.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    resetOrderScroll();
    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    resetOrderScroll();
    requestAnimationFrame(() => {
      resetOrderScroll();
      requestAnimationFrame(resetOrderScroll);
    });
  }, [step]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, slot: "front" | "back" | "third") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Saiz fail terlalu besar", description: "Maksimum 5MB per gambar.", variant: "destructive" });
      return;
    }
    // Show a local preview immediately so the customer sees the image right away
    // (the bucket is private, so the uploaded public URL is not directly viewable).
    const localUrl = URL.createObjectURL(file);
    setSeatImages(prev => ({ ...prev, [slot]: localUrl }));
    setUploadingImage(slot);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${slot}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("customer-seat-images").upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("customer-seat-images").getPublicUrl(path);
      // Keep the local preview (seatImages) for instant display; store the real
      // storage URL separately so the DB record points at the uploaded file.
      setSeatImageUrls(prev => ({ ...prev, [slot]: pub.publicUrl }));
      toast({ title: "Gambar dimuat naik", description: "Gambar berjaya dihantar.", variant: "default" });
    } catch (err: any) {
      toast({ title: "Gagal muat naik", description: err?.message || "Sila cuba lagi.", variant: "destructive" });
    } finally {
      setUploadingImage(null);
      e.target.value = "";
    }
  };

  const removeImage = (slot: "front" | "back" | "third") => {
    setSeatImages(prev => ({ ...prev, [slot]: "" }));
    setSeatImageUrls(prev => ({ ...prev, [slot]: "" }));
  };

  const [shippingCosts, setShippingCosts] = useState<{ semenanjung: number; sabahSarawak: number; enabled: boolean }>({ semenanjung: 10, sabahSarawak: 20, enabled: true });

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_amount: number; discount_type: string; applicable_materials: string[] | null } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [agreedNotReadyStock, setAgreedNotReadyStock] = useState(false);

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
    supabase.from("category_settings" as any).select("*").then(({ data }) => {
      if (data) {
        const enabled = (data as any[]).filter(r => r.is_enabled).map(r => r.name);
        setEnabledCategories(enabled);
        const imgs: Record<string, string> = {};
        const descs: Record<string, string> = {};
        (data as any[]).forEach(r => {
          if (r.image_url) imgs[r.name] = r.image_url;
          if (r.description) descs[r.name] = r.description;
        });
        setCategoryImages(imgs);
        setCategoryDescriptions(descs);
      } else {
        setEnabledCategories(ALL_MATERIAL_CATEGORIES.map(c => c.label));
      }
    });
  }, []);

  // Auto-select material from URL path (/order/materialmesh) or query param (?material=fullsilk)
  // Also support ?product=ID to pre-select a specific product (used by salepage /page/[slug] Buy Now)
  useEffect(() => {
    if (enabledCategories === null) return;
    const params = new URLSearchParams(window.location.search);
    let mat = params.get("material");
    // Capture affiliate referral code (?ref=CODE)
    const ref = params.get("ref");
    if (ref) {
      setReferralCode(ref);
      (supabase.rpc as any)("record_affiliate_click", { p_ref: ref }).then(() => {}).catch(() => {});
    }
    if (!mat) {
      // Path-based: /order/materialmesh, /order/mesh, /order/kain-mesh
      const parts = window.location.pathname.split("/").filter(Boolean);
      const last = parts[parts.length - 1];
      if (last && last !== "order") {
        mat = last.toLowerCase().replace(/^material[-_]?/, "");
      }
    }
    if (mat) {
      const needle = mat.toLowerCase();
      const match = ALL_MATERIAL_CATEGORIES.find(c =>
        c.id.toLowerCase().includes(needle) ||
        c.label.toLowerCase().includes(needle)
      );
      if (match) {
        setSelectedCategory(match);
        setSelectedProduct(null);
        setSelectedVariation(null);
        fetchProducts(match.label);
        setStep("product");
        (supabase as any).from("page_views").insert({
          material: match.label,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        }).then(() => {});
        trackEvent("ViewContent", { content_category: match.label, content_name: match.label });
      }
    }
    // Pre-select product by ID (?product=UUID) — used by salepage Buy Now.
    // Also supports ?variation=ID to pre-select a specific variation the user
    // already picked on the salepage, so they skip straight to the form.
    const productId = params.get("product");
    if (productId) {
      setPreselecting(true); // hide "Pilih Material" screen during fetch
      (async () => {
        try {
          const { data: prod } = await (supabase as any)
            .from("public_products")
            .select("id, name, price, category, image_url, description, status, youtube_url, image_urls")
            .eq("id", productId).single();
          if (!prod) {
            setPreselecting(false);
            return;
          }
          // Determine the product's category, then pre-select it + the product
          const catMatch = ALL_MATERIAL_CATEGORIES.find(c => c.label === prod.category);
          if (catMatch) {
            setSelectedCategory(catMatch);
            // Fetch variations for this product
            const { data: vars } = await (supabase as any)
              .from("public_product_variations")
              .select("id, product_id, name, price")
              .eq("product_id", productId)
              .order("price");
            const fullProd: Product = {
              ...prod,
              youtube_url: prod.youtube_url || null,
              image_urls: prod.image_urls || null,
              variations: vars || [],
            };
            setProducts(prev => prev.some(p => p.id === fullProd.id) ? prev : [fullProd, ...prev]);
            setSelectedProduct(fullProd);

            // Check if a specific variation was passed (?variation=ID from salepage)
            const variationId = params.get("variation");
            const matchedVar = vars?.find((v: any) => v.id === variationId);
            if (matchedVar) {
              setSelectedVariation(matchedVar);
              setStep("form"); setFormStep(1);
            } else if (vars && vars.length === 1) {
              // Only one variation — auto-select it and jump to form
              setSelectedVariation(vars[0]);
              setStep("form"); setFormStep(1);
            } else if (vars && vars.length > 1) {
              // Multiple variations and none specified — user must pick
              setStep("product");
            } else {
              // No variations — go straight to form
              setStep("form"); setFormStep(1);
            }
          }
        } catch (e) {
          console.error("pre-select product error", e);
        } finally {
          setPreselecting(false);
        }
      })();
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
    // Reflect selection in URL so views are tracked per material
    try {
      const slug = cat.id.toLowerCase();
      window.history.pushState({}, "", `/order/material${slug}`);
    } catch {}
    // Track page view (fire-and-forget)
    (supabase as any).from("page_views").insert({
      material: cat.label,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
    }).then(() => {});
    trackEvent("ViewContent", { content_category: cat.label, content_name: cat.label });
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
  const amountToPay = paymentType === "deposit" ? Math.round(finalPrice * 0.5 * 100) / 100 : finalPrice;
  const balanceAmount = paymentType === "deposit" ? Math.round((finalPrice - amountToPay) * 100) / 100 : 0;
  const selectedGatewayName = gateways.find((g) => g.provider === selectedGateway)?.display_name || "Gateway";

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
      const eligibleMaterials: string[] | null = (data as any).applicable_materials;
      if (eligibleMaterials && eligibleMaterials.length > 0) {
        const currentMaterial = selectedCategory?.label;
        if (!currentMaterial || !eligibleMaterials.includes(currentMaterial)) {
          setCouponError(`Kod ini hanya sah untuk material: ${eligibleMaterials.join(", ")}`);
          return;
        }
      }
      setAppliedCoupon({ code: data.code, discount_amount: data.discount_amount, discount_type: data.discount_type, applicable_materials: eligibleMaterials });
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
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    resetOrderScroll();
    setStep("form"); setFormStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast({ title: "Sila isi nama dan nombor telefon", variant: "destructive" }); return; }
    if (!form.state) { toast({ title: "Sila pilih negeri untuk kira kos postage", variant: "destructive" }); return; }
    if (finalPrice <= 0) { toast({ title: "Harga tidak sah", variant: "destructive" }); return; }
    if (!selectedGateway) { toast({ title: "Gateway pembayaran belum aktif", description: "Sila pilih Bayar Melalui WhatsApp atau cuba lagi kemudian.", variant: "destructive" }); return; }
    if (!agreedNotReadyStock) { toast({ title: "Sila sahkan prosedur tempahan", description: "Tick kotak 'bukan barang ready stock' di bahagian kupon sebelum membuat bayaran.", variant: "destructive" }); return; }
    // Track CTA click for CPC (fire-and-forget)
    if (selectedCategory) {
      (supabase as any).from("material_clicks").insert({
        material: selectedCategory.label,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      }).then(() => {});
    }
    trackEvent("InitiateCheckout", {
      value: amountToPay,
      currency: "MYR",
      content_name: selectedProduct?.name || "",
      content_category: selectedCategory?.label || "",
      payment_type: paymentType,
    });
    setStep("loading");
    try {
      const endpoint = selectedGateway === "billplz"
        ? "billplz-create-bill"
        : "payment-create-bill";
      const payload: any = {
        ...form,
        product: selectedProduct?.name,
        product_variation: selectedVariation?.name || "",
        sales_amount: amountToPay.toString(),
        coupon_code: appliedCoupon?.code || "",
        seat_image_front: seatImageUrls.front || null,
        seat_image_back: seatImageUrls.back || null,
        seat_image_third_row: seatImageUrls.third || null,
        additional_notes: additionalNotes || null,
        payment_type: paymentType,
        full_price: finalPrice,
        balance_amount: balanceAmount,
      };
      // Jika pelanggan datang dari sale page (?sp=PAGE_ID), tag order ke page itu
      const spId = new URLSearchParams(window.location.search).get("sp");
      if (spId) payload.sale_page_id = spId;
      if (selectedGateway !== "billplz") payload.provider = selectedGateway;
      const res = await fetch(
        `https://ywjblrnqygowfixxmigw.supabase.co/functions/v1/${endpoint}`,
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload) }
      );
      const data = await res.json();
      if (!res.ok || !data.bill_url) throw new Error(data.error || "Gagal cipta bil");
      // Track "Klik Beli" (order via gateway) ke sale page analytics
      const spIdGw = new URLSearchParams(window.location.search).get("sp");
      if (spIdGw) trackSalePageEvent(spIdGw, "buy_click", { variation_id: selectedVariation?.id });
      await new Promise((r) => setTimeout(r, 400)); // beri masa pixel hantar event
      window.location.href = data.bill_url;
    } catch (err: any) {
      toast({ title: "Ralat", description: err.message, variant: "destructive" });
      setStep("form"); setFormStep(1);
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
    if (!agreedNotReadyStock) {
      toast({ title: "Sila sahkan prosedur tempahan", description: "Tick kotak 'bukan barang ready stock' di bahagian kupon sebelum hantar via WhatsApp.", variant: "destructive" });
      return;
    }

    // Track CTA click for CPC (fire-and-forget)
    if (selectedCategory) {
      (supabase as any).from("material_clicks").insert({
        material: selectedCategory.label,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      }).then(() => {});
    }

    // Nota: event Purchase dihantar selepas order berjaya masuk sistem (bukan Lead)
    trackEvent("InitiateCheckout", {
      value: amountToPay,
      currency: "MYR",
      content_name: selectedProduct?.name || "",
      content_category: selectedCategory?.label || "",
      method: "whatsapp",
    });

    setStep("loading");

    try {
      const customerId = crypto.randomUUID();
      const email = form.email?.trim() || `${form.phone.replace(/[^0-9]/g, "")}@noemail.com`;

      const { data: inserted, error } = await supabase.from("customers").insert({
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
        paid_amount: amountToPay,
        gross_profit: 0,
        order_status: "processing",
        payment_source: "whatsapp",
        payment_gateway: null,
        coupon_code: appliedCoupon?.code || null,
        order_date: new Date().toISOString(),
        seat_image_front: seatImageUrls.front || null,
        seat_image_back: seatImageUrls.back || null,
        seat_image_third_row: seatImageUrls.third || null,
        additional_notes: additionalNotes || null,
        payment_type: paymentType,
        deposit_amount: paymentType === "deposit" ? amountToPay : 0,
        balance_amount: balanceAmount,
      } as any).select("order_number").single();

      // Jika dari sale page, tag order ke page itu
      const spId = new URLSearchParams(window.location.search).get("sp");
      if (spId) {
        await (supabase as any).from("customers").update({ sale_page_id: spId }).eq("id", customerId);
      }

      if (error) throw error;
      const orderNumber = (inserted as any)?.order_number;
      const orderRef = orderNumber ? `#${orderNumber}` : customerId.slice(-6).toUpperCase();

      // Affiliate commission (if referred)
      if (referralCode && selectedProduct?.id) {
        try {
          const { data: prod } = await supabase
            .from("products")
            .select("affiliate_commission")
            .eq("id", selectedProduct.id)
            .single();
          const commission = (prod?.affiliate_commission as number) ?? 0;
          await (supabase.rpc as any)("record_affiliate_order", {
            p_ref: referralCode,
            p_order_id: orderRef,
            p_material: selectedCategory?.label || null,
            p_order_amount: finalPrice,
            p_commission_amount: commission,
            p_customer_name: form.name,
          }).catch(() => {});
        } catch {}
      }

      if (appliedCoupon?.code) {
        await supabase.rpc("increment_coupon_usage", { p_code: appliedCoupon.code });
      }

      fetch(`https://ywjblrnqygowfixxmigw.supabase.co/functions/v1/telegram-notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customerId, payment_source: "whatsapp" }),
      }).catch(() => {});

      const paymentLine = paymentType === "deposit"
        ? `💰 Bayaran Deposit (50%): RM${amountToPay.toFixed(2)}\n💵 Baki Tertunggak: RM${balanceAmount.toFixed(2)}\n💯 Jumlah Penuh: RM${finalPrice.toFixed(2)}`
        : `💰 Jumlah Bayar (Penuh): RM${amountToPay.toFixed(2)}`;

      const waMsg = encodeURIComponent(
        `Assalamualaikum, saya ingin membuat bayaran melalui WhatsApp untuk tempahan berikut:\n\n` +
        `📋 No. Tempahan: #${orderRef}\n` +
        `📦 Produk: ${selectedProduct?.name || "-"}${selectedVariation ? ` (${selectedVariation.name})` : ""}\n` +
        `${paymentLine}\n\n` +
        `Saya telah buat pemindahan ke:\n🏦 Maybank – ACS LEGACY\n🔢 553038596454\n\n` +
        `Nama: ${form.name || "-"}\nNo. Telefon: ${form.phone || "-"}\nModel Kereta: ${form.car_model || "-"}\n\n` +
        `Sila sahkan penerimaan bayaran. Terima kasih! 🙏`
      );

      // Order sudah masuk sistem → kira sebagai Purchase (bayaran via WhatsApp)
      trackEvent("Purchase", {
        value: amountToPay,
        currency: "MYR",
        content_name: selectedProduct?.name || "",
        content_category: selectedCategory?.label || "",
        content_type: "product",
        order_id: orderRef,
        payment_source: "whatsapp",
        payment_type: paymentType,
      });
      // elak double-count bila page thank-you dibuka
      try { sessionStorage.setItem(`acs_purchase_${customerId}`, "1"); } catch {}
      // Track "Klik Beli" (actual order complete via WhatsApp) ke sale page analytics
      const spIdWa = new URLSearchParams(window.location.search).get("sp");
      if (spIdWa) trackSalePageEvent(spIdWa, "buy_click", { variation_id: selectedVariation?.id });

      // Buka WhatsApp dalam tab baharu supaya pixel sempat hantar event,
      // kemudian bawa pelanggan ke page thank-you.
      const waUrl = `https://wa.me/60194503184?text=${waMsg}`;
      const waTab = window.open(waUrl, "_blank");
      await new Promise((r) => setTimeout(r, 600));
      if (waTab) {
        window.location.href = `/order/thank-you?customer_id=${customerId}&source=whatsapp&paid=true`;
      } else {
        window.location.href = waUrl;
      }

    } catch (err: any) {
      toast({ title: "Ralat", description: err?.message || "Gagal simpan tempahan. Sila cuba lagi.", variant: "destructive" });
      setStep("form"); setFormStep(1);
    }
  };

  const getYoutubeId = (url: string | null) => {
    if (!url) return null;
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  };

  return (
    /* Full-screen fixed background — covers everything */
    <div ref={pageScrollRef} className="fixed inset-0 bg-black overflow-y-auto">
      {/* Ambient glow top — subtle neutral, no blue/purple */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-white/5 blur-[120px]" />
      </div>

      {/* ── Sticky Header ─────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/8">
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

        {/* Pre-select loading — avoid flashing the material selection screen */}
        {preselecting && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-white/60" />
            <p className="text-white/50 text-sm">Memuatkan produk...</p>
          </div>
        )}

        {/* ── STEP: Category ── */}
        {step === "category" && !preselecting && (
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
                  <div className={`absolute inset-0 bg-black/20`} />
                  {cat.bestSeller && (
                    <span className="absolute top-3 right-3 z-20 text-[10px] font-bold bg-white text-red-600 px-2 py-1 rounded-full shadow">🔥 Best Seller</span>
                  )}
                  <div className="relative z-10 p-6">
                    <span className="text-4xl mb-4 block">{cat.emoji}</span>
                    <h3 className="text-white font-bold text-lg mb-1">{cat.label}</h3>
                    <p className="text-white/75 text-sm">{categoryDescriptions[cat.label] ?? cat.desc}</p>
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
            <button onClick={() => { handleRemoveCoupon(); setStep("category"); }}
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

            {/* Material hero image (full ratio, no crop) */}
            {categoryImages[selectedCategory.label] && (
              <div className="mb-6 rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
                <img
                  src={categoryImages[selectedCategory.label]}
                  alt={selectedCategory.label}
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
              </div>
            )}

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
                  const isExpanded = isSelected;
                  return (
                    <div key={product.id} className={`rounded-xl border transition-all duration-200 ${isSelected ? "border-blue-500/50 bg-blue-500/5" : "border-white/8 bg-white/4 hover:border-white/15"}`}>
                      {/* Header: klik untuk expand/collapse */}
                      <button
                        onClick={() => {
                          if (isSelected) { setSelectedProduct(null); setSelectedVariation(null); }
                          else { setSelectedProduct(product); setSelectedVariation(null); setImageIndex(0); }
                        }}
                        className={`w-full flex items-center justify-between p-3.5 text-left transition-colors ${isSelected ? "text-white" : "text-white/65 hover:text-white"}`}
                      >
                        <div className="flex-1 min-w-0 flex items-center gap-3">
                          {product.image_url && (
                            <img src={product.image_url} alt={product.name} className="h-10 w-10 rounded-lg object-cover shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold block truncate text-sm">{product.name}</span>
                            <span className={`text-xs font-bold mt-0.5 block ${isSelected ? "text-blue-300" : "text-white/45"}`}>
                              {product.variations.length > 0
                                ? `Dari RM${Math.min(...product.variations.map(v => v.price)).toFixed(0)}`
                                : `RM${product.price.toFixed(0)}`}
                            </span>
                          </div>
                        </div>
                        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>

                      {/* Expanded content: gambar + description + video + seater */}
                      {isExpanded && (
                        <div className="px-3.5 pb-3.5 space-y-3 border-t border-white/8 pt-3">
                          {/* Gambar carousel */}
                          {(() => {
                            const imgs = (product.image_urls && product.image_urls.length > 0)
                              ? product.image_urls
                              : product.image_url ? [product.image_url] : [];
                            if (imgs.length === 0) return null;
                            return (
                              <div className="relative w-full overflow-hidden rounded-lg bg-black/40 flex items-center justify-center">
                                <img src={imgs[imageIndex] || imgs[0]} alt={product.name} className="w-full h-auto max-h-[50vh] object-contain" />
                                {imgs.length > 1 && (
                                  <>
                                    <button onClick={() => setImageIndex(i => (i - 1 + imgs.length) % imgs.length)} className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white">
                                      <ChevronLeft className="h-3.5 w-3.5" />
                                    </button>
                                    <button onClick={() => setImageIndex(i => (i + 1) % imgs.length)} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white">
                                      <ChevronRightIcon className="h-3.5 w-3.5" />
                                    </button>
                                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                                      {imgs.map((_, i) => (
                                        <button key={i} onClick={() => setImageIndex(i)} className={`w-1.5 h-1.5 rounded-full ${i === imageIndex ? "bg-white w-3" : "bg-white/40"}`} />
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                          {/* Description */}
                          {product.description && (
                            <div className="flex gap-2 text-white/65 text-xs">
                              <Info className="h-3.5 w-3.5 text-white/35 shrink-0 mt-0.5" />
                              <FormattedDescription text={product.description} className="flex-1" />
                            </div>
                          )}
                          {/* Video */}
                          {getYoutubeId(product.youtube_url) && (
                            <div className="aspect-video rounded-lg overflow-hidden bg-black/40">
                              <iframe src={`https://www.youtube.com/embed/${getYoutubeId(product.youtube_url)}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Video produk" />
                            </div>
                          )}
                          {/* Pilih Saiz / Variasi */}
                          {product.variations.length > 0 && (
                            <div>
                              <p className="text-white/50 text-[10px] uppercase tracking-widest font-medium mb-2">Pilih Saiz / Variasi</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {product.variations.map((v) => {
                                  const sel = selectedVariation?.id === v.id;
                                  return (
                                    <button key={v.id} onClick={() => setSelectedVariation(v)}
                                      className={`flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-all ${sel ? "border-white bg-white text-black" : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10"}`}>
                                      <span className="flex items-center gap-2">
                                        <SeatIcon count={parseSeatCount(v.name)} />
                                        <span>{v.name}</span>
                                      </span>
                                      <span className={`font-bold ${sel ? "text-black" : "text-green-400"}`}>RM{v.price.toFixed(0)}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Harga produk tanpa variasi */}
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

            <MaterialTestimonials material={selectedCategory.label} />
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

            {/* ── Progress Bar ── */}
            <div className="flex items-center gap-2 mb-6">
              {[
                { n: 1, label: "Pembeli & Alamat" },
                { n: 2, label: "Maklumat Tambahan" },
                { n: 3, label: "Bayaran" },
              ].map((s, i) => (
                <div key={s.n} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center gap-2 ${formStep >= s.n ? "text-blue-600" : "text-gray-400"}`}>
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      formStep >= s.n ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                    }`}>
                      {formStep > s.n ? "✓" : s.n}
                    </div>
                    <span className="text-[11px] font-semibold hidden sm:block">{s.label}</span>
                  </div>
                  {i < 2 && <div className={`flex-1 h-1 rounded-full ${formStep > s.n ? "bg-blue-600" : "bg-gray-200"}`} />}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* ── STEP 1: Maklumat Pembeli + Alamat ── */}
              {formStep === 1 && (<>
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

                  {/* Button: Seterusnya */}
                  <button
                  type="button"
                  onClick={() => {
                    if (!form.name || !form.phone) { toast({ title: "Sila isi nama dan nombor telefon", variant: "destructive" }); return; }
                    if (!form.state) { toast({ title: "Sila pilih negeri", variant: "destructive" }); return; }
                    setFormStep(2);
                  }}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg"
                  >
                  Seterusnya →
                  </button>
                  </>)}
                  {/* ── END STEP 1 ── */}

                  {/* ── STEP 2: Maklumat Tambahan ── */}
                  {formStep === 2 && (<>
              <section className="backdrop-blur-xl bg-white/80 rounded-2xl p-5 border border-gray-200 shadow-lg space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <ImagePlus className="h-4 w-4 text-pink-600" />
                  <h3 className="text-gray-900 font-semibold text-sm">Maklumat Tambahan</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">Opsional</span>
                </div>
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex gap-2">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>Jika diluar kawasan atau di tempat kerja, boleh hantar gambar kemudian. Team HQ kami akan followup anda. 🙏</p>
                </div>

                {/* Butang buka gambar rujukan cara ambil gambar */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRefDialog(true)}
                  className="w-full gap-2 border-pink-200 text-pink-700 hover:bg-pink-50"
                >
                  <ImagePlus className="h-4 w-4" />
                  Lihat cara ambil gambar (rujukan)
                </Button>

                {/* Dialog gambar rujukan */}
                <Dialog open={showRefDialog} onOpenChange={setShowRefDialog}>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Cara ambil gambar seat</DialogTitle>
                    </DialogHeader>
                    <img
                      src="/seat-reference.jpg"
                      alt="Rujukan cara ambil gambar seat"
                      className="w-full rounded-xl border border-gray-200"
                    />
                    <p className="text-xs text-gray-500 text-center">
                      Hantar gambar ikut sudut ini supaya Team HQ boleh buat cover yang tepat.
                    </p>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary" className="w-full">Tutup</Button>
                    </DialogClose>
                  </DialogContent>
                </Dialog>

                {(["front","back","third"] as const).map((slot) => {
                  const labels = {
                    front: "Gambar Seat Depan",
                    back: "Gambar Seat Belakang",
                    third: "Gambar Baris Ke-3 (MPV sahaja)",
                  };
                  const url = seatImages[slot];
                  const isUploading = uploadingImage === slot;
                  return (
                    <div key={slot}>
                      <Label className="text-gray-600 text-xs mb-1.5 block">{labels[slot]}</Label>
                      {url ? (
                        <div className="relative rounded-xl overflow-hidden border border-gray-300 bg-gray-50">
                          <img src={url} alt={labels[slot]} className="w-full max-h-56 object-contain" />
                          <button
                            type="button"
                            onClick={() => removeImage(slot)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center"
                            aria-label="Buang gambar"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label className={`flex flex-col items-center justify-center gap-2 w-full py-6 px-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-blue-400 cursor-pointer transition-colors ${isUploading ? "opacity-60 pointer-events-none" : ""}`}>
                          {isUploading ? (
                            <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />
                          ) : (
                            <Upload className="h-5 w-5 text-gray-500" />
                          )}
                          <span className="text-sm text-gray-700 font-medium">
                            {isUploading ? "Memuat naik..." : "Klik untuk muat naik gambar"}
                          </span>
                          <span className="text-xs text-gray-400">Maks 5MB · JPG/PNG</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, slot)}
                            disabled={isUploading}
                          />
                        </label>
                      )}
                    </div>
                  );
                })}

                <div>
                  <Label className="text-gray-600 text-xs mb-1.5 block">Nota Tambahan (opsional)</Label>
                  <Textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Sebarang arahan atau permintaan khas..."
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 min-h-[80px]"
                    maxLength={1000}
                  />
                </div>
              </section>

              {/* Buttons: Kembali + Seterusnya */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormStep(1)}
                  className="flex-1 h-12 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-sm rounded-xl transition-all"
                >
                  ← Kembali
                </button>
                <button
                  type="button"
                  onClick={() => setFormStep(3)}
                  className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg"
                >
                  Seterusnya →
                </button>
              </div>
              </>)}
              {/* ── END STEP 2 ── */}

              {/* ── STEP 3: Jenis Bayaran + Ringkasan + Kupon + Payment ── */}
              {formStep === 3 && (<>
              <section className="backdrop-blur-xl bg-white/80 rounded-2xl p-5 border border-gray-200 shadow-lg space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCardIcon className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-gray-900 font-semibold text-sm">Jenis Bayaran</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentType("full")}
                    className={`relative rounded-xl border-2 p-3 text-left transition-all ${paymentType === "full" ? "border-emerald-500 bg-emerald-50 shadow-md" : "border-gray-200 bg-white hover:border-gray-300"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-gray-900">Bayaran Penuh</span>
                      {paymentType === "full" && <CheckCircle className="h-4 w-4 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-gray-500">Bayar 100% sekali termasuk penghantaran</p>
                    <p className="text-sm font-bold text-emerald-600 mt-1">RM{finalPrice.toFixed(2)}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType("deposit")}
                    className={`relative rounded-xl border-2 p-3 text-left transition-all ${paymentType === "deposit" ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-200 bg-white hover:border-gray-300"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-gray-900">Deposit (50%)</span>
                      {paymentType === "deposit" && <CheckCircle className="h-4 w-4 text-blue-600" />}
                    </div>
                    <p className="text-[11px] text-gray-500">Bayar separuh dahulu, baki kemudian</p>
                    <p className="text-sm font-bold text-blue-600 mt-1">RM{(finalPrice * 0.5).toFixed(2)}</p>
                  </button>
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
                  <div className="flex justify-between pt-3 border-t border-gray-200 text-sm">
                    <span className="text-gray-600">Jumlah Penuh</span>
                    <span className="text-gray-900 font-semibold">RM{finalPrice.toFixed(2)}</span>
                  </div>
                  {paymentType === "deposit" ? (
                    <>
                      <div className="flex justify-between font-bold text-base">
                        <span className="text-gray-900">Bayar Sekarang (Deposit 50%)</span>
                        <span className="text-blue-600">RM{amountToPay.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 mt-2">
                        <span className="text-amber-800 font-semibold text-xs">⏳ Baki Perlu Dibayar</span>
                        <span className="text-amber-700 font-bold">RM{balanceAmount.toFixed(2)}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">Baki akan diuruskan oleh team HQ selepas tempahan disahkan.</p>
                    </>
                  ) : (
                    <div className="flex justify-between font-bold text-base">
                      <span className="text-gray-900">Jumlah Bayar</span>
                      <span className="text-green-600">RM{amountToPay.toFixed(2)}</span>
                    </div>
                  )}
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

                {/* Pengakuan bukan ready stock */}
                <label className="flex items-start gap-2.5 mt-4 p-3 rounded-xl bg-yellow-50 border border-yellow-300 cursor-pointer">
                  <Checkbox
                    checked={agreedNotReadyStock}
                    onCheckedChange={(v) => setAgreedNotReadyStock(v === true)}
                    className="mt-0.5"
                  />
                  <span className="text-xs text-gray-900 leading-snug">
                    <strong>Saya faham dan bersetuju</strong> dengan prosedur tempahan AMANCARSEAT. Setiap set dibuat khas mengikut model kereta dan mengambil <strong>masa 10–14 hari</strong> bekerja sebelum penghantaran.
                  </span>
                </label>
              </section>



              {/* Payment Options */}
              <div className="space-y-3">
                <p className="text-white/40 text-xs uppercase tracking-widest text-center font-medium">Pilih Kaedah Pembayaran</p>

                {/* Gateway picker (only show if more than 1 enabled) */}
                {gateways.length > 1 && (
                  <div className="grid grid-cols-2 gap-2">
                    {gateways.map((g) => (
                      <button
                        key={g.provider}
                        type="button"
                        onClick={() => setSelectedGateway(g.provider)}
                        className={`rounded-xl border-2 p-2.5 text-center text-xs font-semibold transition-all ${
                          selectedGateway === g.provider
                            ? "border-blue-400 bg-blue-500/20 text-white shadow-lg shadow-blue-900/40"
                            : "border-white/15 bg-white/5 text-white/70 hover:border-white/30"
                        }`}
                      >
                        {g.display_name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Pay button */}
                <Button type="submit"
                  disabled={!selectedGateway}
                  className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold text-base rounded-xl shadow-xl shadow-blue-900/40 transition-all">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  {!selectedGateway
                    ? "Gateway Online Belum Aktif"
                    : paymentType === "deposit"
                    ? `Bayar Deposit RM${amountToPay.toFixed(2)} Dengan ${selectedGatewayName}`
                    : `Bayar RM${amountToPay.toFixed(2)} Dengan ${selectedGatewayName}`}
                </Button>
                <p className="text-center text-white/25 text-xs">
                  {selectedGateway ? `🔒 Pembayaran selamat melalui ${selectedGatewayName} Malaysia` : "Aktifkan gateway online di panel Payment Gateway atau gunakan WhatsApp"}
                </p>


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
                    <button
                      type="button"
                      onClick={() => setShowQr(v => !v)}
                      className="w-full mt-1 text-xs font-semibold text-green-300 hover:text-green-200 underline underline-offset-2"
                    >
                      {showQr ? "Sembunyi QR" : "Papar QR untuk scan"}
                    </button>
                    {showQr && (
                      <div className="mt-2 flex flex-col items-center gap-2 rounded-xl bg-white p-3">
                        <img
                          src="/qr-payment.jpg"
                          alt="QR Pembayaran Maybank ACS LEGACY"
                          className="w-48 h-48 sm:w-60 sm:h-60 md:w-64 md:h-64 max-w-full object-contain rounded-lg"
                        />
                        <p className="text-[10px] text-gray-600 text-center leading-tight">
                          Scan dengan app perbankan untuk bayar<br />Maybank · ACS LEGACY · 553038596454
                        </p>
                      </div>
                    )}
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

              {/* Button: Kembali */}
              <button
                type="button"
                onClick={() => setFormStep(2)}
                className="w-full h-11 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-sm rounded-xl transition-all"
              >
                ← Kembali ke Maklumat Tambahan
              </button>
              </>)}
              {/* ── END STEP 3 ── */}
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
    </div>
  );
}
