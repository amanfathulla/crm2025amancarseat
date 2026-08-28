const { createClient } = require("@supabase/supabase-js");
const URL = "https://brxxmhnymhdlolelrjgy.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeHhtaG55bWhkbG9sZWxyamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNTIzNjQsImV4cCI6MjA1NTcyODM2NH0.stdRgr4-_QkZDTBhZizXJM_npCN3JxhWXhSIarzHzk4";
const sb = createClient(URL, KEY, { auth: { persistSession: false } });
(async () => {
  const fields = ["id","name","car_model","rating","review","images","created_at","avatar_url"];
  const { data, error } = await sb.from("reviews").select(fields.join(",")).limit(1);
  console.log("SELECT with images field ->", error ? "ERROR: "+error.message : "OK rows="+data.length);
  if (error) {
    // try without images
    const { data: d2, error: e2 } = await sb.from("reviews").select("id,name,car_model,rating,review,created_at,avatar_url").limit(1);
    console.log("WITHOUT images ->", e2 ? "ERR:"+e2.message : "OK");
  }
})();
