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

  // Kumpul baris kepada blok: bullet group atau perenggan
  const blocks: Array<{ type: "bullets" | "paragraph" | "spacer"; items: string[] }> = [];
  let currentBullets: string[] = [];
  let currentParagraph: string[] = [];

  const flushBullets = () => {
    if (currentBullets.length) {
      blocks.push({ type: "bullets", items: [...currentBullets] });
      currentBullets = [];
    }
  };
  const flushParagraph = () => {
    if (currentParagraph.length) {
      blocks.push({ type: "paragraph", items: [currentParagraph.join(" ")] });
      currentParagraph = [];
    }
  };

  const bulletRegex = /^([-*•✓✔→►●▪◆◇○]|\d+[.)])\s+/;

  for (const line of lines) {
    if (!line) {
      flushBullets();
      flushParagraph();
      continue;
    }
    if (bulletRegex.test(line)) {
      flushParagraph();
      currentBullets.push(line.replace(bulletRegex, "").trim());
    } else {
      flushBullets();
      currentParagraph.push(line);
    }
  }
  flushBullets();
  flushParagraph();

  return (
    <div className={`space-y-2 ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === "bullets") {
          return (
            <ul key={idx} className="space-y-1.5 pl-1">
              {block.items.map((item, i) => (
                <li key={i} className="flex gap-2 leading-relaxed">
                  <span className="text-primary/70 shrink-0 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={idx} className="leading-relaxed">
            {block.items[0]}
          </p>
        );
      })}
    </div>
  );
};

export default FormattedDescription;
