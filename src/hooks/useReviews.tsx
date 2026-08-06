import { useEffect, useState } from "react";
import { reviewsSupabase, type Review } from "@/lib/reviewsClient";
import { fetchReviewMaterials, fetchPinnedReviews } from "@/lib/reviewMaterials";

let cache: Review[] | null = null;
let inflight: Promise<Review[]> | null = null;

async function fetchAll(): Promise<Review[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const all: Review[] = [];
    const pageSize = 1000;
    let from = 0;
    while (true) {
      const { data, error } = await reviewsSupabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      all.push(...(data as Review[]));
      if (data.length < pageSize) break;
      from += pageSize;
    }
    cache = all;
    return all;
  })();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState<string | null>(null);
  const [materials, setMaterials] = useState<Record<string, string>>({});
  const [pins, setPins] = useState<Record<string, number>>({});

  useEffect(() => {
    let alive = true;
    fetchReviewMaterials().then((m) => { if (alive) setMaterials(m); });
    fetchPinnedReviews().then((p) => { if (alive) setPins(p); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (cache) {
      setReviews(cache);
      setLoading(false);
      return;
    }
    fetchAll()
      .then((d) => {
        if (mounted) {
          setReviews(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (mounted) {
          setError(e.message ?? "Gagal memuat testimoni");
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { reviews, loading, error, materials, pins };
}
