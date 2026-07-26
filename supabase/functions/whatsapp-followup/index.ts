// Supabase Edge Function: whatsapp-followup
// Engine untuk hantar WhatsApp follow-up automatik (harian) guna ustazai.my.
//
// Action:
//   POST { "action": "send", "secret": "..." }            -> hantar semua pending yang dah sampai masa
//   POST { "action": "setCredentials", "apiKey", "sender", "secret" } -> simpan kelayakan (service role)
//   POST { "action": "setAutomation", "enabled", "secret" } -> on/off automation
//
// Dipanggil oleh:
//   - CRM UI (admin) untuk set kelayakan / toggle / hantar manual
//   - pg_cron (setiap jam) untuk auto harian
//
// Env (set di Supabase Function settings / `supabase secrets set`):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_SECRET

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

async function getSettings(supabase: any) {
  const { data } = await supabase
    .from("whatsapp_settings")
    .select("automation_enabled, api_key_configured, sender_number")
    .eq("id", 1)
    .maybeSingle();
  return data;
}

async function getCredentials(supabase: any) {
  const { data, error } = await supabase
    .from("whatsapp_credentials")
    .select("api_key, sender_number")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function renderTemplate(tpl: string, vars: Record<string, string | null>) {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => {
    const v = vars[k];
    return v == null ? "" : String(v);
  });
}

async function signMediaUrl(supabase: any, mediaPath: string, expiresIn = 3600) {
  if (/^https?:\/\//i.test(mediaPath)) return mediaPath;
  const [bucket, ...rest] = mediaPath.split("/");
  const path = rest.join("/");
  if (!bucket || !path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data) return null;
  return data.signedUrl;
}

async function sendUstazai(creds: any, number: string, message: string, senderOverride?: string | null, media?: { type: string; url: string; caption?: string }) {
  const sender = senderOverride?.trim() || creds.sender_number || "";
  const base = "https://ustazai.my";
  const body: Record<string, unknown> = {
    api_key: creds.api_key,
    sender,
    number,
  };
  if (media && media.url) {
    body.media_type = media.type;
    body.url = media.url;
    if (media.caption) body.caption = media.caption;
    const r = await fetch(`${base}/send-media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await r.json().catch(() => ({}));
  }
  body.message = message;
  const r = await fetch(`${base}/send-message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return await r.json().catch(() => ({}));
}

async function runSend(supabase: any) {
  const settings = await getSettings(supabase);
  if (!settings?.automation_enabled) {
    return json({ ok: true, skipped: "automation disabled", sent: 0, failed: 0 });
  }
  const creds = await getCredentials(supabase);
  if (!creds?.api_key) {
    return json({ ok: false, error: "credentials not set", sent: 0, failed: 0 });
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const { data: senders } = await supabase
    .from("whatsapp_senders")
    .select("id, phone_number, is_active, gap_seconds, daily_limit, last_sent_at, connection_status, consecutive_failures");

  const senderMap = new Map((senders ?? []).map((s: any) => [s.id, s]));
  const dailyCounts = new Map<string, number>();
  const lastSent = new Map<string, number>();
  const failures = new Map<string, number>();
  for (const s of senders ?? []) {
    const { count } = await supabase
      .from("lead_followups")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent")
      .eq("sender_id_used", s.id)
      .gte("sent_at", startOfDay);
    dailyCounts.set(s.id, count ?? 0);
    if (s.last_sent_at) lastSent.set(s.id, new Date(s.last_sent_at).getTime());
    failures.set(s.id, s.consecutive_failures ?? 0);
  }

  const { data: due, error } = await supabase
    .from("lead_followups")
    .select("id, lead_id, day_offset, leads!inner(name, phone, product, followup_status, assigned_sender_id), followup_steps!inner(message_template, media_type, media_url)")
    .eq("status", "pending")
    .lte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true })
    .limit(100);

  if (error) return json({ error: error.message }, 500);

  let sent = 0, failed = 0, skipped = 0, deferred = 0;
  for (const row of due ?? []) {
    const lead = row.leads as any;
    const step = row.followup_steps as any;
    if (lead.followup_status !== "active") {
      await supabase.from("lead_followups").update({ status: "cancelled", updated_at: nowIso }).eq("id", row.id);
      skipped++;
      continue;
    }
    const sender = lead.assigned_sender_id ? senderMap.get(lead.assigned_sender_id) : undefined;
    if (sender) {
      if (!sender.is_active || sender.connection_status === "disconnected") { deferred++; continue; }
      if ((dailyCounts.get(sender.id) ?? 0) >= sender.daily_limit) { deferred++; continue; }
      const waitMs = (lastSent.get(sender.id) ?? 0) + sender.gap_seconds * 1000 - Date.now();
      if (waitMs > 0) {
        if (waitMs <= 10000) await new Promise((r) => setTimeout(r, waitMs));
        else { deferred++; continue; }
      }
    }

    const message = await renderTemplate(step.message_template ?? "", {
      nama: lead.name,
      produk: lead.product ?? "",
    });

    const senderId = sender?.id;
    let result: any;
    try {
      if (step.media_type && step.media_url) {
        const url = await signMediaUrl(supabase, step.media_url);
        if (!url) {
          await supabase.from("lead_followups").update({ status: "failed", error_message: "Gagal signed URL", updated_at: nowIso }).eq("id", row.id);
          failed++;
          continue;
        }
        result = await sendUstazai(creds, lead.phone, message, sender?.phone_number, { type: step.media_type, url, caption: message });
      } else {
        result = await sendUstazai(creds, lead.phone, message, sender?.phone_number);
      }
    } catch (e: any) {
      await supabase.from("lead_followups").update({ status: "failed", error_message: String(e?.message ?? e), updated_at: nowIso }).eq("id", row.id);
      failed++;
      continue;
    }

    const ok = result && (result.status === true || result.success === true || result.message_id);
    if (ok) {
      await supabase.from("lead_followups").update({
        status: "sent", sent_at: nowIso, provider_message_id: result?.message_id ?? null,
        rendered_message: message, sender_id_used: senderId ?? null, updated_at: nowIso,
      }).eq("id", row.id);
      await supabase.from("lead_messages").insert({
        lead_id: row.lead_id, sender_id: senderId ?? null, direction: "outbound",
        message_type: step.media_type ?? "text", content: message, media_url: step.media_url,
        provider_message_id: result?.message_id ?? null,
      });
      if (senderId) {
        lastSent.set(senderId, Date.now());
        dailyCounts.set(senderId, (dailyCounts.get(senderId) ?? 0) + 1);
        failures.set(senderId, 0);
        await supabase.from("whatsapp_senders").update({
          last_sent_at: nowIso, connection_status: "connected", consecutive_failures: 0, updated_at: nowIso,
        }).eq("id", senderId);
      }
      sent++;
    } else {
      await supabase.from("lead_followups").update({
        status: "failed", error_message: JSON.stringify(result).slice(0, 500), rendered_message: message,
        sender_id_used: senderId ?? null, updated_at: nowIso,
      }).eq("id", row.id);
      if (senderId) {
        const next = (failures.get(senderId) ?? 0) + 1;
        failures.set(senderId, next);
        const patch: any = { consecutive_failures: next, updated_at: nowIso };
        if (next >= 5) patch.connection_status = "disconnected";
        await supabase.from("whatsapp_senders").update(patch).eq("id", senderId);
      }
      failed++;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  return json({ ok: true, sent, failed, skipped, deferred });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    const body = await req.json().catch(() => ({}));
    const secret = body.secret ?? req.headers.get("x-admin-secret") ?? "";

    if (body.action === "send") {
      // allow if automation (cron) OR admin secret
      if (secret !== ADMIN_SECRET && secret !== "") {
        return json({ error: "unauthorized" }, 401);
      }
      return await runSend(supabase);
    }

    if (secret !== ADMIN_SECRET) return json({ error: "unauthorized" }, 401);

    if (body.action === "setCredentials") {
      const patch: any = { updated_at: new Date().toISOString() };
      if (body.apiKey !== undefined) patch.api_key = body.apiKey;
      if (body.sender !== undefined) patch.sender_number = body.sender;
      await supabase.from("whatsapp_credentials").update(patch).eq("id", 1);
      const cred = await getCredentials(supabase);
      await supabase.from("whatsapp_settings").update({
        api_key_configured: Boolean(cred?.api_key),
        sender_number: cred?.sender_number ?? null,
        updated_at: new Date().toISOString(),
      }).eq("id", 1);
      return json({ ok: true });
    }

    if (body.action === "setAutomation") {
      await supabase.from("whatsapp_settings").update({
        automation_enabled: Boolean(body.enabled), updated_at: new Date().toISOString(),
      }).eq("id", 1);
      return json({ ok: true });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e: any) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
