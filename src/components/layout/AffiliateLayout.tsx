import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Network, LayoutDashboard, Link2, Package, ShoppingBag, Wallet, Landmark, User, LogOut } from "lucide-react";

const AFF_TOKEN = "affiliateToken";
const AFF_ID = "affiliateId";
const AFF_NAME = "affiliateName";
const AFF_REF = "affiliateReferral";

const NAV = [
  { to: "/affiliate/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/affiliate/referral", label: "Referral Center", icon: Link2 },
  { to: "/affiliate/products", label: "Product Focus Link", icon: Package },
  { to: "/affiliate/orders", label: "Orders", icon: ShoppingBag },
  { to: "/affiliate/commissions", label: "Komisen", icon: Wallet },
  { to: "/affiliate/withdraw", label: "Withdraw", icon: Landmark },
  { to: "/affiliate/profile", label: "Profil", icon: User },
];

export default function AffiliateLayout() {
  const navigate = useNavigate();
  const [name, setName] = useState(localStorage.getItem(AFF_NAME) || "Affiliate");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(AFF_TOKEN);
    if (!token) {
      navigate("/affiliate/login");
      return;
    }
    // validate session server-side
    supabase
      .rpc("validate_affiliate_session", { p_token: token })
      .then(({ data }: any) => {
        if (!data) {
          localStorage.clear();
          navigate("/affiliate/login");
          return;
        }
        localStorage.setItem(AFF_ID, data.affiliate_id);
        localStorage.setItem(AFF_NAME, data.name);
        localStorage.setItem(AFF_REF, data.referral_code);
        localStorage.setItem("affiliateStatus", data.status);
        setName(data.name);
        setReady(true);
      })
      .catch(() => {
        localStorage.clear();
        navigate("/affiliate/login");
      });
  }, [navigate]);

  const logout = async () => {
    const token = localStorage.getItem(AFF_TOKEN);
    if (token) {
      try { await supabase.rpc("invalidate_affiliate_session", { p_token: token }); } catch {}
    }
    localStorage.clear();
    navigate("/affiliate/login");
  };

  if (!ready) {
    return (
      <div className="min-h-screen grid place-content-center bg-slate-950">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-slate-900 border-r border-white/10 flex flex-col">
        <div className="h-16 flex items-center gap-2 px-4 border-b border-white/10">
          <img
            src="/lovable-uploads/c601d9f9-1e06-4854-83de-2fcd1b040c9c.png"
            alt="ACS"
            className="h-9 w-9 object-contain"
          />
          <div className="leading-tight">
            <p className="text-sm font-bold">ACS Affiliate</p>
            <p className="text-[10px] text-slate-400">Panel Affiliate</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-blue-600/20 text-blue-300"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <n.icon className="h-5 w-5" />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
            <div className="grid size-8 place-content-center rounded-full bg-blue-600/30 text-blue-300 text-xs font-bold">
              {name.slice(0, 1).toUpperCase()}
            </div>
            <span className="text-sm truncate">{name}</span>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-slate-900/50">
          <Network className="h-5 w-5 text-blue-400" />
          <span className="text-sm text-slate-400">Referral: <b className="text-blue-300">{localStorage.getItem(AFF_REF)}</b></span>
        </header>
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
