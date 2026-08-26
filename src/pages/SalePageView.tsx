import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { reviewsSupabase, type Review } from "@/lib/reviewsClient";
import { fetchReviewMaterials } from "@/lib/reviewMaterials";
import { Eye, Star } from "lucide-react";
import { SalePageTemplate, type TplPage, type TplProduct } from "./SalePageTemplates";

interface SalePage {
  id: string;
  slug: string;
  title: string;
  headline: string | null;
  subheadline: string | null;
  video_url: string | null;
  video_urls: string[] | null;
  poster_url: string | null;
  product_id: string | null;
  product_mode: string | null;
  product_category: string | null;
  cta_label: string | null;
  badge_text: string | null;
  theme: string | null;
  template: number;
  is_published: boolean;
  views: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string | null;
  image_url: string | null;
  description: string | null;
  status?: string | null;
}

export default function SalePageView() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<SalePage | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const { data: pg } = await supabase
          .from("sale_pages")
          .select("id, slug, title, headline, subheadline, video_url, video_urls, poster_url, product_id, product_mode, product_category, cta_label, badge_text, theme, template, is_published, views")
          .eq("slug", slug).single();
        if (!pg || !pg.is_published) { setLoading(false); return; }
        setPage(pg as SalePage);
        supabase.rpc("bump_sale_page_views", { p_slug: pg.slug }).then(({ data }: any) => {
          const newViews = typeof data === "number" ? data : (pg.views || 0) + 1;
          setPage(prev => prev ? { ...prev, views: newViews } : prev);
        }).catch(() => {});

        let mainProd: Product | null = null;
        if ((pg.product_mode || "single") === "category" && pg.product_category) {
          const { data: catProds } = await supabase
            .from("public_products")
            .select("id, name, price, category, image_url, description, status")
            .eq("category", pg.product_category)
            .eq("status", "active")
            .order("price");
          const cProds = (catProds || []) as Product[];
          setCategoryProducts(cProds);
          mainProd = cProds[0] || null;
        } else if (pg.product_id) {
          const { data: prod } = await supabase
            .from("public_products")
            .select("id, name, price, category, image_url, description, status")
            .eq("id", pg.product_id).single();
          if (prod) { setProduct(prod as Product); mainProd = prod as Product; }
        }

        // Reviews total count (mengikut material produk utama)
        if (mainProd?.category) {
          try {
            const matMap = await fetchReviewMaterials();
            const allRev: any[] = [];
            let fromR = 0;
            while (true) {
              const { data: batch } = await reviewsSupabase
                .from("reviews")
                .select("id")
                .order("created_at", { ascending: false })
                .range(fromR, fromR + 999);
              if (!batch || batch.length === 0) break;
              allRev.push(...batch);
              if (batch.length < 1000) break;
              fromR += 1000;
            }
            const matched = allRev.filter((r: any) => matMap[r.id] === mainProd!.category);
            setReviewCount(matched.length);
          } catch { /* ignore */ }
        }
      } catch (e) {
        console.error("salepage load error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center text-white/40 text-sm">Memuatkan…</div>;
  }
  if (!page) {
    return <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-3 text-white/60">
      <p className="text-lg font-semibold">Page tidak dijumpai</p>
      <p className="text-xs text-white/40">Mungkin masih Draft — kena Publish dulu di CRM.</p>
      <Link to="/page" className="text-[#CFA227] text-sm underline">← Ke feed</Link>
    </div>;
  }

  // Pilih produk utama untuk template (single = product, category = produk pertama)
  const tplProduct: TplProduct | null = product
    ? { id: product.id, name: product.name, price: product.price, image_url: product.image_url, category: product.category }
    : (categoryProducts[0]
        ? { id: categoryProducts[0].id, name: categoryProducts[0].name, price: categoryProducts[0].price, image_url: categoryProducts[0].image_url, category: categoryProducts[0].category }
        : null);

  const tplPage: TplPage = {
    title: page.title,
    headline: page.headline,
    subheadline: page.subheadline,
    video_url: page.video_url,
    video_urls: page.video_urls,
    poster_url: page.poster_url,
    badge_text: page.badge_text,
    theme: page.theme,
    cta_label: page.cta_label,
    product_mode: page.product_mode,
    product_category: page.product_category,
    template: page.template || 1,
  };

  return (
    <div className="fixed inset-0 bg-black flex justify-center overflow-hidden">
      <div className="relative w-full" style={{ maxWidth: 430, height: "100dvh" }}>
        <SalePageTemplate template={page.template || 1} page={tplPage} product={tplProduct} />

        {/* Header overlay: logo ACS + views + review count */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-3 pb-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className="flex items-center gap-2">
            <img src="/lovable-uploads/2a080884-e251-46d5-a2c1-c5d1018f76f5.png" alt="ACS" className="h-7 w-7 object-contain" />
            <span className="text-white text-sm font-bold">AmanCarSeat</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-white/80 text-[11px] font-medium bg-black/50 backdrop-blur px-2.5 py-1 rounded-full">
              <Eye className="h-3 w-3" /> {page.views || 0} view
            </span>
            {reviewCount > 0 && (
              <span className="flex items-center gap-1 text-white/80 text-[11px] font-medium bg-black/50 backdrop-blur px-2.5 py-1 rounded-full">
                <Star className="h-3 w-3 text-amber-400 fill-amber-400" /> {reviewCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
