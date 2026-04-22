import { useEffect, useState } from "react";

interface LiveFooterProps {
  /** Tailwind classes for the wrapper text color/size. Defaults to dark themed (white/20). */
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
 * Shows: © {currentYear} ACS Legacy AmancarseatCover · Semua hak terpelihara
 *        {Hari, Tarikh Bulan Tahun} • {HH:MM:SS}
 */
export default function LiveFooter({
  className = "text-white/30 text-xs",
  containerClassName = "border-t border-white/5 py-4 text-center space-y-1",
}: LiveFooterProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { dateStr, timeStr, year } = formatNow(now);

  return (
    <footer className={containerClassName}>
      <p className={className}>
        © {year} ACS Legacy AmancarseatCover · Semua hak terpelihara
      </p>
      <p className={className}>
        <span className="opacity-80">{dateStr}</span>
        <span className="mx-2 opacity-40">•</span>
        <span className="font-mono tabular-nums">{timeStr}</span>
      </p>
    </footer>
  );
}
