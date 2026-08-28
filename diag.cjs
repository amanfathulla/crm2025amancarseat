const { createClient } = require("@supabase/supabase-js");
const RURL = "https://brxxmhnymhdlolelrjgy.supabase.co";
const RKEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeHhtaG55bWhkbG9sZWxyamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNTIzNjQsImV4cCI6MjA1NTcyODM2NH0.stdRgr4-_QkZDTBhZizXJM_npCN3JxhWXhSIarzHzk4";
const MURL = "https://ywjblrnqygowfixxmigw.supabase.co";
const MKEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3amJscm5xeWdvd2ZpeHhtaWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5ODkyNDEsImV4cCI6MjA1NjU2NTI0MX0.-H1zLrSd1eB1zFqknQePspLAmvi6TkISr020jahYpn0";
const rsb = createClient(RURL, RKEY, { auth: { persistSession: false } });
const msb = createClient(MURL, MKEY, { auth: { persistSession: false } });
(async () => {
  const { count: rc } = await rsb.from("reviews").select("*", { count: "exact", head: true });
  console.log("REVIEWS (brxx) count:", rc);
  const { count: mc } = await msb.from("review_materials").select("*", { count: "exact", head: true });
  console.log("REVIEW_MATERIALS (main) count:", mc);
  const { data: rm } = await msb.from("review_materials").select("review_id, material").limit(400);
  const matSet = new Set((rm || []).map(r => r.material));
  console.log("distinct materials:", [...matSet]);
  // sample review ids, check if mapped
  const { data: rev } = await rsb.from("reviews").select("id").limit(5);
  const mappedIds = new Set((rm || []).map(r => r.review_id));
  const sampleIds = (rev || []).map(r => r.id);
  console.log("sample review ids mapped?", sampleIds.map(id => mappedIds.has(id)));
})();
