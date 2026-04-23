import React from "react";

interface FormattedDescriptionProps {
  text: string;
  className?: string;
}

/**
 * Memaparkan penerangan produk dengan format yang konsisten:
 * - Sokong <br> tag dari admin
 * - Auto-detect bullet points (baris bermula dengan -, *, •, ✓, ✔, →, ►)
 * - Newline dipelihara sebagai perenggan berasingan
 * - Baris kosong = jarak antara perenggan
 */
export const FormattedDescription: React.FC<FormattedDescriptionProps> = ({
  text,
  className = "",
}) => {
  if (!text) return null;

  // Normalize: tukar <br>, <br/>, <br /> kepada newline
  const normalized = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\r\n/g, "\n")
    .trim();

  // Pecah ikut newline
  const lines = normalized.split("\n").map((l) => l.trim());

  // Setiap baris = 1 blok (preserve apa yang admin taip/copy).
  // Baris kosong = spacer (jarak perenggan tambahan).
  // Baris bermula dengan simbol bullet = bullet item.
  // Baris berturut-turut yang bullet akan dikumpul dalam satu <ul>.
  type Block =
    | { type: "bullets"; items: string[] }
    | { type: "line"; text: string }
    | { type: "spacer" };

  const blocks: Block[] = [];
  let currentBullets: string[] = [];

  const flushBullets = () => {
    if (currentBullets.length) {
      blocks.push({ type: "bullets", items: [...currentBullets] });
      currentBullets = [];
    }
  };

  const bulletRegex = /^([-*•✓✔→►●▪◆◇○]|\d+[.)])\s+/;

  for (const line of lines) {
    if (!line) {
      flushBullets();
      // Elak spacer berganda di awal/akhir
      if (blocks.length && blocks[blocks.length - 1].type !== "spacer") {
        blocks.push({ type: "spacer" });
      }
      continue;
    }
    if (bulletRegex.test(line)) {
      currentBullets.push(line.replace(bulletRegex, "").trim());
    } else {
      flushBullets();
      blocks.push({ type: "line", text: line });
    }
  }
  flushBullets();
  // Buang spacer di akhir
  while (blocks.length && blocks[blocks.length - 1].type === "spacer") blocks.pop();

  return (
    <div className={className}>
      {blocks.map((block, idx) => {
        if (block.type === "bullets") {
          return (
            <ul key={idx} className="space-y-1.5 pl-1 my-2">
              {block.items.map((item, i) => (
                <li key={i} className="flex gap-2 leading-relaxed">
                  <span className="text-primary/70 shrink-0 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "spacer") {
          return <div key={idx} className="h-2" aria-hidden />;
        }
        return (
          <p key={idx} className="leading-relaxed">
            {block.text}
          </p>
        );
      })}
    </div>
  );
};

export default FormattedDescription;
