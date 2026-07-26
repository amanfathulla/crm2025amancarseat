import { useEffect, useState } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

interface LiveFooterProps {
  /** Tailwind classes for the wrapper text color/size. Defaults to dark themed (white/30). */
  className?: string;
  /** Override container className entirely if needed. */
  containerClassName?: string;
}

const MS_DAYS = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
const MS_MONTHS = [
  "Januari", "Februari", "Mac", "April", "Mei", "Jun",
  "Julai", "Ogos", "September", "Oktober", "November", "Disember",
];

function formatNow(d: Date) {
  const day = MS_DAYS[d.getDay()];
  const date = d.getDate();
  const month = MS_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return { dateStr: `${day}, ${date} ${month} ${year}`, timeStr: `${hh}:${mm}:${ss}`, year };
}

/**
 * Live updating footer for public order pages.
 * Shows company info + live clock (updates every second).
 */
export default function LiveFooter({
  className = "text-white/60 text-sm",
  containerClassName = "bg-black border-t border-white/10 py-10 md:py-12 text-white",
}: LiveFooterProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { dateStr, timeStr, year } = formatNow(now);

  return (
    <footer className={containerClassName}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center p-1">
                <img src="/acs-logo.png" alt="AmanCarSeat" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-xl text-white">AMANCARSEAT</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              Pakar sarung tempat duduk kereta premium di Malaysia. Lebih 10 tahun pengalaman dalam industri automotif.
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Hubungi Kami</h4>
            <div className="space-y-3">
              <a
                href="tel:+60194503184"
                className="flex items-center gap-3 text-sm text-white/70 hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4" />
                019-450 3184
              </a>
              <a
                href="mailto:admin@amancarseat.com"
                className="flex items-center gap-3 text-sm text-white/70 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4" />
                admin@amancarseat.com
              </a>
              <div className="flex items-start gap-3 text-sm text-white/70">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Kota Bharu, Kelantan</span>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Waktu Operasi</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-white/70">
                <Clock className="w-4 h-4" />
                <div>
                  <p>Isnin - Sabtu</p>
                  <p className="font-medium text-white">9:00 AM - 6:00 PM</p>
                </div>
              </div>
              <p className="text-sm text-white/70">Ahad: Tutup</p>
            </div>
          </div>
        </div>

        {/* Bottom bar with live clock */}
        <div className="border-t border-white/20 mt-8 pt-6 text-center space-y-2">
          <p className="text-sm text-white/80">
            © {year} Aman Car Seat. Hak Cipta Terpelihara.
          </p>
          <p className={`${className} font-mono tabular-nums`}>
            <span className="opacity-80">{dateStr}</span>
            <span className="mx-2 opacity-40">•</span>
            <span>{timeStr}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
